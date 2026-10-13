-- Migration: 006_financial_core.sql
-- Description: Robust Financial Core & Double-Entry Wallet System

-- Drop old schema objects safely
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

-- 1. Create Wallets Table
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for platform
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('CONSUMER', 'CHEF', 'PLATFORM')),
    balance NUMERIC NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE NULLS NOT DISTINCT (user_id, wallet_type)
);

-- Trigger to update `updated_at` automatically
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION update_wallets_updated_at();

-- 2. Create Wallet Transactions Table
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL, -- Grouping ID for atomic operations affecting multiple wallets
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'REVERSAL', 'ADJUSTMENT')),
    source TEXT NOT NULL, -- e.g. 'PAYMENT', 'SETTLEMENT', 'REFUND', 'TOPUP'
    reference_id TEXT, -- e.g. razorpay_payment_id or internal settlement_id
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_id UUID, -- For future reference
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Immutable Financial Ledger
CREATE TABLE public.financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debit_wallet_id UUID REFERENCES public.wallets(id), -- Source of funds
    credit_wallet_id UUID REFERENCES public.wallets(id), -- Destination of funds
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    transaction_reference TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent Updates or Deletes on Ledger to make it immutable
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Financial ledger entries are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ledger_update
BEFORE UPDATE ON public.financial_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_prevent_ledger_delete
BEFORE DELETE ON public.financial_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- 4. Create Financial Audit Logs
CREATE TABLE public.financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id),
    action TEXT NOT NULL,
    old_balance NUMERIC NOT NULL,
    new_balance NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RPC for Atomic Financial Transactions
CREATE OR REPLACE FUNCTION execute_financial_transaction(
    p_from_wallet_id UUID,
    p_to_wallet_id UUID,
    p_amount NUMERIC,
    p_currency TEXT,
    p_transaction_type TEXT,
    p_source TEXT,
    p_reference_id TEXT,
    p_order_id UUID,
    p_payment_id UUID,
    p_description TEXT
) RETURNS JSONB AS $$
DECLARE
    v_from_wallet RECORD;
    v_to_wallet RECORD;
    v_transaction_id UUID := gen_random_uuid();
    v_ledger_id UUID;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    -- Consistent lock ordering to prevent deadlocks
    IF p_from_wallet_id IS NOT NULL AND p_to_wallet_id IS NOT NULL THEN
        IF p_from_wallet_id < p_to_wallet_id THEN
            SELECT * INTO v_from_wallet FROM wallets WHERE id = p_from_wallet_id FOR UPDATE;
            SELECT * INTO v_to_wallet FROM wallets WHERE id = p_to_wallet_id FOR UPDATE;
        ELSE
            SELECT * INTO v_to_wallet FROM wallets WHERE id = p_to_wallet_id FOR UPDATE;
            SELECT * INTO v_from_wallet FROM wallets WHERE id = p_from_wallet_id FOR UPDATE;
        END IF;
    ELSIF p_from_wallet_id IS NOT NULL THEN
        SELECT * INTO v_from_wallet FROM wallets WHERE id = p_from_wallet_id FOR UPDATE;
    ELSIF p_to_wallet_id IS NOT NULL THEN
        SELECT * INTO v_to_wallet FROM wallets WHERE id = p_to_wallet_id FOR UPDATE;
    ELSE
        RAISE EXCEPTION 'At least one wallet must be provided';
    END IF;

    -- Debit from Source Wallet
    IF p_from_wallet_id IS NOT NULL THEN
        IF v_from_wallet.status != 'ACTIVE' THEN RAISE EXCEPTION 'Source wallet is not active'; END IF;
        IF v_from_wallet.currency != p_currency THEN RAISE EXCEPTION 'Currency mismatch on source wallet'; END IF;
        IF v_from_wallet.balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds in source wallet'; END IF;

        UPDATE wallets SET balance = balance - p_amount WHERE id = p_from_wallet_id;
        
        INSERT INTO wallet_transactions (
            transaction_id, wallet_id, amount, type, source, reference_id, order_id, payment_id
        ) VALUES (
            v_transaction_id, p_from_wallet_id, p_amount, 
            CASE WHEN p_transaction_type = 'HOLD' THEN 'HOLD' ELSE 'DEBIT' END,
            p_source, p_reference_id, p_order_id, p_payment_id
        );
        
        INSERT INTO financial_audit_logs (wallet_id, action, old_balance, new_balance)
        VALUES (p_from_wallet_id, CASE WHEN p_transaction_type = 'HOLD' THEN 'HOLD' ELSE 'DEBIT' END, v_from_wallet.balance, v_from_wallet.balance - p_amount);
    END IF;

    -- Credit to Destination Wallet
    IF p_to_wallet_id IS NOT NULL THEN
        IF v_to_wallet.status != 'ACTIVE' THEN RAISE EXCEPTION 'Destination wallet is not active'; END IF;
        IF v_to_wallet.currency != p_currency THEN RAISE EXCEPTION 'Currency mismatch on destination wallet'; END IF;

        UPDATE wallets SET balance = balance + p_amount WHERE id = p_to_wallet_id;
        
        INSERT INTO wallet_transactions (
            transaction_id, wallet_id, amount, type, source, reference_id, order_id, payment_id
        ) VALUES (
            v_transaction_id, p_to_wallet_id, p_amount, 
            CASE WHEN p_transaction_type = 'RELEASE' THEN 'RELEASE' ELSE 'CREDIT' END,
            p_source, p_reference_id, p_order_id, p_payment_id
        );
        
        INSERT INTO financial_audit_logs (wallet_id, action, old_balance, new_balance)
        VALUES (p_to_wallet_id, CASE WHEN p_transaction_type = 'RELEASE' THEN 'RELEASE' ELSE 'CREDIT' END, v_to_wallet.balance, v_to_wallet.balance + p_amount);
    END IF;

    -- Insert Ledger Entry
    INSERT INTO financial_ledger (
        debit_wallet_id, credit_wallet_id, amount, currency, transaction_reference, description
    ) VALUES (
        p_from_wallet_id, p_to_wallet_id, p_amount, p_currency, p_reference_id, p_description
    ) RETURNING id INTO v_ledger_id;

    RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id, 'ledger_id', v_ledger_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose to GraphQL / PostgREST if needed via Grants
GRANT EXECUTE ON FUNCTION execute_financial_transaction(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_financial_transaction(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT) TO service_role;
