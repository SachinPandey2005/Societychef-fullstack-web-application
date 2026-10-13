import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { WalletService } from '../services/wallet.service';
import { InvoiceService } from '../services/invoice.service';
import { AccountingService } from '../services/accounting.service';
import { PayoutService } from '../services/payout.service';
import { SettlementService } from '../services/settlement.service';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { OrderRepository } from '../repositories/order.repository';
import { LedgerRepository } from '../repositories/ledger.repository';
import { sendSuccess } from '../utils/response';
import { ValidationError, NotFoundError } from '../utils/errors';
import { topupWalletSchema, requestPayoutSchema, updatePayoutStatusSchema } from '../validators/finance.schema';
import { WalletOwnerType } from '../types/wallet';

export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const owner_type = (req.user!.role === 'chef' ? 'CHEF' : 'CONSUMER') as WalletOwnerType;

  const wallet = await WalletService.getWallet(profile_id, owner_type);
  const transactions = await WalletService.getTransactions(wallet.id);

  sendSuccess(res, 'Wallet retrieved', { wallet, transactions });
});

export const topupWallet = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = topupWalletSchema.parse({ body: req.body });

  // Simulate payment gateway verification
  const result = await WalletService.creditWallet(profile_id, 'CONSUMER', body.amount, 'TOPUP', 'Added funds via Payment Gateway');
  sendSuccess(res, 'Wallet credited successfully', result);
});

export const getWalletStatement = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const owner_type = (req.user!.role === 'chef' ? 'CHEF' : 'CONSUMER') as WalletOwnerType;

  const wallet = await WalletService.getWallet(profile_id, owner_type);
  const ledger = await LedgerRepository.getLedgerEntries(wallet.id);
  sendSuccess(res, 'Wallet Statement retrieved', ledger);
});

export const getMyInvoices = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const invoices = await InvoiceService.getConsumerInvoices(profile_id);
  sendSuccess(res, 'Invoices retrieved', invoices);
});

export const getJournalEntries = asyncHandler(async (req: Request, res: Response) => {
  const journals = await AccountingService.getJournals();
  sendSuccess(res, 'Journals retrieved', journals);
});

export const requestPayout = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = requestPayoutSchema.parse({ body: req.body });

  // kitchen_id and bank_details both used to be read straight off req.user /
  // req.body: req.user.kitchen_id is never set by anything (so this always
  // matched zero orders), and trusting client-submitted bank_details meant any
  // authenticated chef could direct a payout to an arbitrary account. Resolve
  // the kitchen from the authenticated chef, and use only their own saved,
  // previously-verified bank details.
  const kitchen = await KitchenRepository.findByChefUserId(profile_id);
  if (!kitchen) {
    throw new NotFoundError('No kitchen found for this chef account.');
  }
  const bankDetails = KitchenRepository.getBankDetails(kitchen);
  if (!bankDetails) {
    throw new ValidationError('Add your payout bank account before requesting a withdrawal.');
  }

  const request = await PayoutService.requestPayout(kitchen.id, profile_id, body.amount, bankDetails);
  sendSuccess(res, 'Payout requested', request, 201);
});

export const updatePayoutStatus = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updatePayoutStatusSchema.parse({ params: req.params, body: req.body });
  const updated = await PayoutService.updatePayoutStatus(params.id, body.status, body.reference_id);
  sendSuccess(res, 'Payout status updated', updated);
});

export const getFinanceOverview = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, 'Finance Overview', {
    totalRevenue: 0,
    totalSettlements: 0,
    activeWallets: 0
  });
});

export const getChefEarnings = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;

  // Was reading (req.user as any).kitchen_id, which nothing ever populates —
  // this always queried orders for kitchen_id = undefined, silently returning
  // an empty list for every chef. Resolve the kitchen from the chef instead.
  const kitchen = await KitchenRepository.findByChefUserId(profile_id);

  // Previously queried the old Supabase client directly instead of Drizzle —
  // a second database from local Postgres once the two diverge, same bug
  // class as party.controller.ts/verification.service.ts (see memory notes).
  const orders = kitchen ? (await OrderRepository.getKitchenHistory(kitchen.id)).slice(0, 50) : [];

  const wallet = await WalletService.getWallet(profile_id, 'CHEF');

  sendSuccess(res, 'Earnings retrieved', {
    wallet: {
      available_balance: wallet.balance,
      pending_balance: 0
    },
    orders: orders.map((o) => ({
      id: o.id,
      grand_total: o.grand_total,
      platform_commission: o.platform_commission,
      tax_amount: o.tax_amount,
      net_chef_earnings: o.net_chef_earnings,
      created_at: o.created_at,
      status: o.status,
    })),
  });
});

export const getMySettlements = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const kitchen = await KitchenRepository.findByChefUserId(profile_id);
  if (!kitchen) {
    return sendSuccess(res, 'Settlements retrieved', []);
  }
  const settlements = await SettlementService.getSettlementsByKitchen(kitchen.id);
  sendSuccess(res, 'Settlements retrieved', settlements);
});

export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const order_id = req.params.order_id as string;
  const html = await InvoiceService.getHtmlInvoice(order_id);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export const getReconciliationReport = asyncHandler(async (req: Request, res: Response) => {
  // Admin only
  const { ReconciliationEngine } = require('../services/reconciliation.engine');
  const report = await ReconciliationEngine.auditLedger();
  sendSuccess(res, 'Reconciliation Report', report);
});

export const exportFinancialReport = asyncHandler(async (req: Request, res: Response) => {
  const { type, start_date, end_date } = req.query;
  const { ReportService } = require('../services/report.service');
  
  let csv = '';
  if (type === 'settlements') {
    csv = await ReportService.exportSettlements(start_date as string, end_date as string);
  } else {
    csv = await ReportService.exportOrders(start_date as string, end_date as string);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
  res.send(csv);
});
