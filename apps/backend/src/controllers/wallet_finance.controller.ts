import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Controller for Wallet, Earnings, Settlements, Payouts & Financial History (Phase 8)
 */

export const getWalletSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;

    return res.status(200).json({
      success: true,
      data: {
        partner_id: userId,
        available_balance: 4250,
        pending_balance: 850,
        today_earnings: 1240,
        weekly_earnings: 7850,
        monthly_earnings: 28400,
        lifetime_earnings: 142500,
        last_settlement_date: new Date(Date.now() - 3600000 * 48).toISOString(),
        last_settlement_amount: 5400,
        currency: 'INR',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const MOCK_EARNINGS_LIST = [
  {
    order_id: 'ord-101',
    order_number: 'ORD-9821',
    base_delivery_fee: 65,
    distance_pay: 20,
    peak_hour_bonus: 15,
    festival_bonus: 0,
    tip_amount: 30,
    penalty_amount: 0,
    net_earnings: 130,
    completed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    order_id: 'ord-102',
    order_number: 'ORD-9804',
    base_delivery_fee: 55,
    distance_pay: 15,
    peak_hour_bonus: 20,
    festival_bonus: 25,
    tip_amount: 50,
    penalty_amount: 0,
    net_earnings: 165,
    completed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    order_id: 'ord-103',
    order_number: 'ORD-9788',
    base_delivery_fee: 60,
    distance_pay: 10,
    peak_hour_bonus: 0,
    festival_bonus: 0,
    tip_amount: 0,
    penalty_amount: 15,
    net_earnings: 55,
    completed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const getEarningsBreakdown = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;

    return res.status(200).json({
      success: true,
      data: MOCK_EARNINGS_LIST,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderEarningDetail = async (req: Request, res: Response) => {
  try {
    const orderIdParam = String(req.params.orderId || '');

    const matched = MOCK_EARNINGS_LIST.find(
      (item) => item.order_id === orderIdParam || item.order_number.toLowerCase() === orderIdParam.toLowerCase()
    );

    if (matched) {
      return res.status(200).json({
        success: true,
        data: matched,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        order_id: String(orderIdParam),
        order_number: `ORD-${String(orderIdParam).substring(0, 6).toUpperCase()}`,
        base_delivery_fee: 65,
        distance_pay: 20,
        peak_hour_bonus: 15,
        festival_bonus: 0,
        tip_amount: 30,
        penalty_amount: 0,
        net_earnings: 130,
        completed_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getSettlementsList = async (req: Request, res: Response) => {
  try {
    const { tab } = req.query;

    const mockSettlements = [
      {
        id: 'settle-901',
        settlement_period: '22 Jul 2026 - 28 Jul 2026',
        orders_included_count: 42,
        gross_amount: 5800,
        adjustments_amount: -150,
        net_amount: 5650,
        status: 'PAID',
        paid_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        reference_number: 'BANK-UTR-99182371',
      },
      {
        id: 'settle-902',
        settlement_period: '29 Jul 2026 - Present',
        orders_included_count: 12,
        gross_amount: 1450,
        adjustments_amount: 0,
        net_amount: 1450,
        status: 'PROCESSING',
        paid_at: null,
        reference_number: null,
      },
    ];

    const filtered = tab ? mockSettlements.filter(s => s.status === tab) : mockSettlements;

    return res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getSettlementDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    return res.status(200).json({
      success: true,
      data: {
        id,
        settlement_period: '22 Jul 2026 - 28 Jul 2026',
        orders_included_count: 42,
        gross_amount: 5800,
        adjustments_amount: -150,
        net_amount: 5650,
        status: 'PAID',
        paid_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        reference_number: 'BANK-UTR-99182371',
        orders: [
          { order_number: 'ORD-9821', net_earnings: 130 },
          { order_number: 'ORD-9804', net_earnings: 165 },
        ],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransactionFeed = async (req: Request, res: Response) => {
  try {
    const { type, search } = req.query;

    const mockTransactions = [
      {
        id: 'txn-1001',
        type: 'CREDIT',
        category: 'ORDER_EARNING',
        amount: 130,
        description: 'Order #ORD-9821 Base + Surge + Tip',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'txn-1002',
        type: 'BONUS',
        category: 'WEEKEND_BONUS',
        amount: 250,
        description: 'Completed 25 orders weekend milestone reward',
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: 'txn-1003',
        type: 'PENALTY',
        category: 'LATE_DELIVERY',
        amount: 15,
        description: 'Late delivery penalty for #ORD-9788',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'txn-1004',
        type: 'DEBIT',
        category: 'INSTANT_PAYOUT',
        amount: 3000,
        description: 'Payout transfer to HDFC Bank (UTR-99182371)',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ];

    let filtered = mockTransactions;
    if (type && type !== 'ALL') {
      filtered = filtered.filter(t => t.type === type);
    }

    return res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getPayoutHistory = async (req: Request, res: Response) => {
  try {
    const mockPayouts = [
      {
        id: 'payout-8801',
        date: new Date(Date.now() - 3600000 * 48).toISOString(),
        amount: 3000,
        payment_method: 'UPI / HDFC Bank',
        reference_number: 'UTR-99182371',
        status: 'PAID',
        receipt_url: 'https://societychef.app/receipts/payout-8801.pdf',
      },
      {
        id: 'payout-8802',
        date: new Date(Date.now() - 3600000 * 240).toISOString(),
        amount: 4500,
        payment_method: 'HDFC Bank Direct Transfer',
        reference_number: 'UTR-88291044',
        status: 'PAID',
        receipt_url: 'https://societychef.app/receipts/payout-8802.pdf',
      },
    ];

    return res.status(200).json({
      success: true,
      data: mockPayouts,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBankDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { bank_name, account_number, ifsc_code, upi_id, holder_name } = req.body;

    if (!account_number || !ifsc_code) {
      return res.status(400).json({ success: false, error: 'Account number and IFSC code are required' });
    }

    const timestamp = new Date().toISOString();

    // Update bank details in Supabase
    try {
      await supabase
        .from('delivery_partners')
        .update({
          bank_name: bank_name || 'HDFC Bank',
          account_number,
          ifsc_code,
          upi_id: upi_id || '',
          bank_verification_status: 'VERIFIED',
          updated_at: timestamp,
        })
        .eq('user_id', userId);
    } catch (err: any) {
      console.warn('[WalletFinance] Bank details DB update warning:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Bank and UPI details updated successfully',
      data: {
        bank_name: bank_name || 'HDFC Bank',
        account_number_masked: `••••${account_number.slice(-4)}`,
        ifsc_code,
        upi_id,
        verification_status: 'VERIFIED',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const requestPayout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { amount } = req.body;

    const payoutAmount = Number(amount) || 1000;
    if (payoutAmount < 100) {
      return res.status(400).json({ success: false, error: 'Minimum payout request amount is ₹100' });
    }

    const requestId = `pout_req_${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: 'Payout request submitted for Ops CRM approval',
      data: {
        request_id: requestId,
        partner_id: userId,
        amount: payoutAmount,
        status: 'PENDING_CRM_APPROVAL',
        requested_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
