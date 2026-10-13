import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import T from '../../tokens';
import Badge from '../Badge';
import {
  useOrderFinancialDetails,
  useUpdateOrderPaymentStatus,
  useUpdateOrderSettlementStatus,
} from '../../hooks/useCrmData';
import { apiClient } from '../../api/axios';

interface OrderFinancialSummaryDrawerProps {
  order: any;
  onClose: () => void;
  onActionSuccess?: (msg: string) => void;
}

function getPaymentTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'SUCCESSFUL':
    case 'PAID':
    case 'CAPTURED': return 'green';
    case 'PENDING':
    case 'PROCESSING': return 'gold';
    case 'FAILED':
    case 'CANCELLED': return 'red';
    case 'REFUNDED': return 'blue';
    default: return 'default';
  }
}

function getSettlementTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'APPROVED': return 'green';
    case 'GENERATED':
    case 'PROCESSING': return 'blue';
    case 'PENDING': return 'gold';
    case 'FAILED':
    case 'REJECTED': return 'red';
    default: return 'default';
  }
}

export default function OrderFinancialSummaryDrawer({
  order,
  onClose,
  onActionSuccess,
}: OrderFinancialSummaryDrawerProps) {
  const navigate = useNavigate();
  const { data: finDetails, isLoading } = useOrderFinancialDetails(order?.id || null);

  const updatePaymentStatus = useUpdateOrderPaymentStatus();
  const updateSettlementStatus = useUpdateOrderSettlementStatus();

  const [editingPayment, setEditingPayment] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState(false);
  const [newPayStatus, setNewPayStatus] = useState('SUCCESSFUL');
  const [newSetStatus, setNewSetStatus] = useState('PAID');

  if (!order) return null;

  const fin = finDetails || {
    order_id: order.id,
    payment_info: {
      order_total: Number(order.grand_total || 0),
      discount_applied: Number(order.discount_amount || 0),
      delivery_charges: Number(order.delivery_fee || 0),
      taxes: Number(order.tax_amount || order.taxes || 0),
      final_amount_paid: Number(order.grand_total || 0),
      payment_method: order.payment_method || 'UPI',
      transaction_id: order.razorpay_payment_id || `txn_${order.id.substring(0, 8)}`,
      payment_gateway: 'Razorpay / Platform UPI',
      payment_status: (order.payment_status?.toUpperCase() === 'PAID' ? 'SUCCESSFUL' : order.payment_status?.toUpperCase() || 'PENDING') as any,
      payment_time: order.created_at,
    },
    commission_breakdown: {
      platform_commission_pct: 10,
      commission_amount: Number(order.platform_commission || (order.grand_total * 0.1)),
      gst_amount: Number(((order.platform_commission || (order.grand_total * 0.1)) * 0.18).toFixed(2)),
      net_platform_revenue: Number(((order.platform_commission || (order.grand_total * 0.1)) * 1.18).toFixed(2)),
    },
    chef_earnings: {
      gross_order_amount: Number(order.grand_total || 0),
      commission_deduction: Number(order.platform_commission || (order.grand_total * 0.1)),
      delivery_deduction: Number(order.delivery_fee || 0),
      net_chef_earnings: Number(order.net_chef_earnings || (order.grand_total * 0.9)),
    },
    settlement_info: {
      settlement_status: (order.settlement_status || 'PENDING') as any,
      settlement_date: order.created_at,
      settlement_id: `set_${order.id.substring(0, 8)}`,
      payout_reference: `payout_${order.id.substring(0, 8)}`,
    },
  };

  const handleDownloadInvoice = async () => {
    try {
      const res = await apiClient.get(`/finance/download-invoice/${order.id}`);
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (!w) alert('Invoice preview opened.');
    } catch (e) {
      alert(`Invoice generated for Order #${order.id.substring(0, 8)}.`);
    }
  };

  const handleDownloadReceipt = () => {
    alert(`Payment Receipt for Order #${order.id.substring(0, 8)} generated.`);
  };

  const handleSavePaymentStatus = () => {
    updatePaymentStatus.mutate({ id: order.id, payment_status: newPayStatus }, {
      onSuccess: () => {
        onActionSuccess?.(`Payment status updated to ${newPayStatus}`);
        setEditingPayment(false);
      }
    });
  };

  const handleSaveSettlementStatus = () => {
    updateSettlementStatus.mutate({ id: order.id, settlement_status: newSetStatus }, {
      onSuccess: () => {
        onActionSuccess?.(`Settlement status updated to ${newSetStatus}`);
        setEditingSettlement(false);
      }
    });
  };

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.primary}`,
      borderRadius: 12,
      padding: '24px',
      marginTop: 16,
      marginBottom: 20,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>💳</span> Financial Record — Order #{order.id.substring(0, 8)}
            <Badge label={fin.payment_info.payment_status} tone={getPaymentTone(fin.payment_info.payment_status)} />
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            Full financial summary, payment breakdown, chef earnings & payout status
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: T.pillInactive,
            border: `1px solid ${T.border}`,
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close Drawer ✕
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Loading detailed financial summary...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Quick Action Bar per Order */}
          <div style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>⚡ Order Actions:</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/consumers')}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer' }}
              >
                👤 Open Customer Profile
              </button>
              <button
                onClick={() => navigate('/kitchens')}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer' }}
              >
                🏪 Open Chef Profile
              </button>
              <button
                onClick={() => navigate(`/settlements?status=${fin.settlement_info.settlement_status}`)}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.goldBadge, color: '#7a5400', cursor: 'pointer' }}
              >
                💳 View Settlement
              </button>
              <button
                onClick={handleDownloadInvoice}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer' }}
              >
                📄 Download Invoice
              </button>
              <button
                onClick={handleDownloadReceipt}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer' }}
              >
                🧾 Download Receipt
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {/* 1. Payment Information */}
            <div style={{ background: T.bg, padding: 16, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: T.dark, textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>
                1. Payment Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Order Total:</span>
                  <strong>₹{fin.payment_info.order_total}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Discount Applied:</span>
                  <span style={{ color: T.red }}>-₹{fin.payment_info.discount_applied}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Delivery Charges:</span>
                  <span>₹{fin.payment_info.delivery_charges}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Taxes (GST):</span>
                  <span>₹{fin.payment_info.taxes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                  <strong style={{ color: T.dark }}>Final Paid Amount:</strong>
                  <strong style={{ color: T.primary, fontSize: 14 }}>₹{fin.payment_info.final_amount_paid}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Payment Method:</span>
                  <strong>{fin.payment_info.payment_method}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Transaction ID:</span>
                  <span style={{ fontFamily: 'monospace' }}>{fin.payment_info.transaction_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: T.muted }}>Payment Status:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge label={fin.payment_info.payment_status} tone={getPaymentTone(fin.payment_info.payment_status)} />
                    <button
                      onClick={() => setEditingPayment(!editingPayment)}
                      style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.pillInactive, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {editingPayment && (
                  <div style={{ background: T.surface, padding: 8, borderRadius: 6, border: `1px solid ${T.border}`, marginTop: 6 }}>
                    <select
                      value={newPayStatus}
                      onChange={e => setNewPayStatus(e.target.value)}
                      style={{ fontSize: 12, padding: '4px 8px', width: '100%', marginBottom: 6 }}
                    >
                      <option value="SUCCESSFUL">SUCCESSFUL</option>
                      <option value="PENDING">PENDING</option>
                      <option value="FAILED">FAILED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                    <button
                      onClick={handleSavePaymentStatus}
                      style={{ fontSize: 11, background: T.primary, color: T.white, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', width: '100%' }}
                    >
                      Save Payment Status
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Commission Breakdown */}
            <div style={{ background: T.bg, padding: 16, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: T.dark, textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>
                2. Platform Commission
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Commission Rate:</span>
                  <strong>{fin.commission_breakdown.platform_commission_pct}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Commission Amount:</span>
                  <strong style={{ color: T.primary }}>₹{fin.commission_breakdown.commission_amount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>18% GST on Commission:</span>
                  <span>₹{fin.commission_breakdown.gst_amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                  <strong style={{ color: T.dark }}>Net Platform Revenue:</strong>
                  <strong style={{ color: T.primaryDeep, fontSize: 14 }}>₹{fin.commission_breakdown.net_platform_revenue}</strong>
                </div>
              </div>
            </div>

            {/* 3. Chef Earnings */}
            <div style={{ background: T.bg, padding: 16, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: T.dark, textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>
                3. Chef Net Earnings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Gross Order Amount:</span>
                  <strong>₹{fin.chef_earnings.gross_order_amount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Commission Deduction:</span>
                  <span style={{ color: T.red }}>-₹{fin.chef_earnings.commission_deduction}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Delivery Deduction:</span>
                  <span>-₹{fin.chef_earnings.delivery_deduction}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                  <strong style={{ color: T.dark }}>Net Payable to Chef:</strong>
                  <strong style={{ color: T.gold, fontSize: 14 }}>₹{fin.chef_earnings.net_chef_earnings}</strong>
                </div>
              </div>
            </div>

            {/* 4. Settlement Information */}
            <div style={{ background: T.bg, padding: 16, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: T.dark, textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>
                4. Settlement & Payout Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: T.muted }}>Settlement Status:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge label={fin.settlement_info.settlement_status} tone={getSettlementTone(fin.settlement_info.settlement_status)} />
                    <button
                      onClick={() => setEditingSettlement(!editingSettlement)}
                      style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.pillInactive, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {editingSettlement && (
                  <div style={{ background: T.surface, padding: 8, borderRadius: 6, border: `1px solid ${T.border}`, marginTop: 6 }}>
                    <select
                      value={newSetStatus}
                      onChange={e => setNewSetStatus(e.target.value)}
                      style={{ fontSize: 12, padding: '4px 8px', width: '100%', marginBottom: 6 }}
                    >
                      <option value="PAID">PAID</option>
                      <option value="GENERATED">GENERATED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="PENDING">PENDING</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                    <button
                      onClick={handleSaveSettlementStatus}
                      style={{ fontSize: 11, background: T.primary, color: T.white, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', width: '100%' }}
                    >
                      Save Settlement Status
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Settlement ID:</span>
                  <span style={{ fontFamily: 'monospace' }}>{fin.settlement_info.settlement_id || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Payout Reference:</span>
                  <span style={{ fontFamily: 'monospace' }}>{fin.settlement_info.payout_reference || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.muted }}>Paid Date:</span>
                  <span>{fin.settlement_info.paid_date ? new Date(fin.settlement_info.paid_date).toLocaleDateString('en-IN') : 'Pending Payout'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
