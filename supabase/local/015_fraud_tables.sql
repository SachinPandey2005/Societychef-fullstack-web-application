-- fraud_rules/trust_scores/fraud_cases/fraud_activity_logs never existed
-- (confirmed absent from the live schema dump) despite being live-routed
-- (fraud.routes.ts). Created per the fully-specified shapes in
-- types/fraud.ts.

CREATE TABLE IF NOT EXISTS public.fraud_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    actions TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trust_scores (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 100,
    factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fraud_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('USER', 'ORDER', 'PAYMENT')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'FALSE_POSITIVE')),
    triggered_rules TEXT[] NOT NULL DEFAULT '{}',
    ai_summary TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fraud_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
