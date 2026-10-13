import { create } from 'zustand';
import { partnerApi } from '../api/partner.api';
import { walletFinanceApi } from '../api';

export interface BankDetails {
  bank_name: string;
  account_number: string;
  account_number_masked: string;
  ifsc_code: string;
  upi_id: string;
  holder_name: string;
  verification_status: 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | 'APPROVED';
  status?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | 'APPROVED';
  cheque_url?: string;
}

interface BankState {
  bankDetails: BankDetails;
  bank: BankDetails;
  isUpdating: boolean;
  error: string | null;

  updateBankDetails: (details: Partial<BankDetails>) => Promise<void>;
  updateBank: (details: Partial<BankDetails>) => Promise<void>;
  loadBank: () => Promise<void>;
}

export const useBankStore = create<BankState>((set, get) => ({
  bankDetails: {
    bank_name: '',
    account_number: '',
    account_number_masked: '',
    ifsc_code: '',
    upi_id: '',
    holder_name: '',
    verification_status: 'UNVERIFIED' as const,
  },
  get bank() {
    return this.bankDetails;
  },
  isUpdating: false,
  error: null,

  loadBank: async () => {
    set({ isUpdating: true, error: null });
    try {
      const data = await partnerApi.getProfile();
      if (data?.bank) {
        set({
          bankDetails: {
            bank_name: data.bank.bank_name || '',
            account_number: data.bank.account_number || '',
            account_number_masked: data.bank.account_number ? `••••${data.bank.account_number.slice(-4)}` : '',
            ifsc_code: data.bank.ifsc_code || '',
            upi_id: data.bank.upi_id || '',
            holder_name: data.bank.holder_name || '',
            verification_status: (data.bank.status as any) || 'PENDING',
            cheque_url: data.bank.cheque_url || '',
          },
        });
      }
    } catch (e: any) {
      console.warn('[useBankStore] Load bank details error:', e.message);
    } finally {
      set({ isUpdating: false });
    }
  },

  updateBank: async (details) => get().updateBankDetails(details),

  updateBankDetails: async (details) => {
    set({ isUpdating: true, error: null });
    try {
      const current = get().bankDetails;
      const payload = {
        holder_name: details.holder_name || current.holder_name || 'Rider Partner',
        bank_name: (details.bank_name || current.bank_name).trim(),
        account_number: (details.account_number || current.account_number).replace(/\s/g, ''),
        ifsc_code: (details.ifsc_code || current.ifsc_code).trim().toUpperCase(),
        upi_id: details.upi_id || current.upi_id || '',
        cheque_url: details.cheque_url || current.cheque_url || '',
      };

      const data = await partnerApi.updateBank(payload);

      set({
        bankDetails: {
          ...current,
          ...details,
          holder_name: data.holder_name || payload.holder_name,
          bank_name: data.bank_name || payload.bank_name,
          account_number: data.account_number || payload.account_number,
          account_number_masked: data.account_number ? `••••${data.account_number.slice(-4)}` : `••••${payload.account_number.slice(-4)}`,
          ifsc_code: data.ifsc_code || payload.ifsc_code,
          verification_status: (data.status as any) || 'PENDING',
        },
      });
    } catch (e: any) {
      console.warn('[useBankStore] Update bank details error:', e.message);
      set({ error: e.message });
      throw e;
    } finally {
      set({ isUpdating: false });
    }
  },
}));

export default useBankStore;
