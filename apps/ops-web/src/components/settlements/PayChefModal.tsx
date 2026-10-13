import { useState } from 'react';
import T from '../../tokens';
import { usePayChef } from '../../hooks/useSettlementData';

interface PayChefModalProps {
  settlement: any;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export default function PayChefModal({ settlement, onClose, onSuccess }: PayChefModalProps) {
  const payChefMutation = usePayChef();

  const [mode, setMode] = useState<'AUTOMATIC' | 'MANUAL'>('AUTOMATIC');
  const [utrNumber, setUtrNumber] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [notes, setNotes] = useState('');

  if (!settlement) return null;

  const kitchen = settlement.kitchens || {};
  const netAmount = Number(settlement.net_payable || 0);
  const bankDetails = kitchen.kitchen_info?.bank_details || {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    payChefMutation.mutate({
      id: settlement.id,
      mode,
      manual_details: mode === 'MANUAL' ? {
        utr_number: utrNumber || undefined,
        bank_reference: bankRef || undefined,
        payment_notes: notes || undefined,
      } : undefined,
    }, {
      onSuccess: (data: any) => {
        onSuccess?.(`Payout of ₹${netAmount.toLocaleString('en-IN')} released to ${kitchen.chef_name || 'Chef'} (Ref: ${data.payout_reference})`);
        onClose();
      },
      onError: (err: any) => {
        alert(err.response?.data?.message || 'Failed to process payout');
      }
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        padding: 28, width: 480, maxWidth: '92%', boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.dark, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💸</span> Confirm Chef Payout Release
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: T.muted }}>✕</button>
        </div>

        {/* Chef Summary Box */}
        <div style={{ background: T.bg, padding: 14, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.muted }}>Chef Name:</span>
            <strong style={{ fontSize: 13, color: T.dark }}>{kitchen.chef_name || 'Chef'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.muted }}>Kitchen Name:</span>
            <strong style={{ fontSize: 13, color: T.dark }}>{kitchen.name || 'Kitchen'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.muted }}>Registered Bank/UPI:</span>
            <span style={{ fontSize: 12, color: T.secondary, fontFamily: 'monospace' }}>
              {bankDetails.upi_id || bankDetails.account_number ? `${bankDetails.upi_id || bankDetails.account_number}` : 'Verified Gateway Account'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
            <strong style={{ fontSize: 13, color: T.dark }}>Net Payable Amount:</strong>
            <strong style={{ fontSize: 18, color: T.primaryDeep }}>₹{netAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>
              Select Payout Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setMode('AUTOMATIC')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${mode === 'AUTOMATIC' ? T.primary : T.border}`,
                  background: mode === 'AUTOMATIC' ? T.greenBadge : T.surface,
                  color: mode === 'AUTOMATIC' ? T.primary : T.secondary,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ⚡ Automatic Gateway Payout
              </button>

              <button
                type="button"
                onClick={() => setMode('MANUAL')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${mode === 'MANUAL' ? T.primary : T.border}`,
                  background: mode === 'MANUAL' ? T.goldBadge : T.surface,
                  color: mode === 'MANUAL' ? T.gold : T.secondary,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                📝 Record Manual Transfer
              </button>
            </div>
          </div>

          {/* Manual Input Fields */}
          {mode === 'MANUAL' && (
            <div style={{ background: T.surface, padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                  UTR / Bank Reference Number *
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={e => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR9876543210"
                  required
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${T.border}` }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                  Bank Reference / Txn ID
                </label>
                <input
                  type="text"
                  value={bankRef}
                  onChange={e => setBankRef(e.target.value)}
                  placeholder="e.g. BANK_REF_10293"
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${T.border}` }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                  Payment Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Transferred via HDFC NetBanking"
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${T.border}` }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: 6, background: T.bg, color: T.dark, fontWeight: 600, fontSize: 13, border: `1px solid ${T.border}`, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payChefMutation.isPending}
              style={{
                flex: 1, padding: '10px', borderRadius: 6, background: T.primary, color: T.white, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', opacity: payChefMutation.isPending ? 0.7 : 1,
              }}
            >
              {payChefMutation.isPending ? 'Processing Payout...' : `Confirm & Pay ₹${netAmount.toLocaleString('en-IN')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
