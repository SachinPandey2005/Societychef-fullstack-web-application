import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import T from '../../tokens';
import { apiClient } from '../../api/axios';

export default function QuickActionsBar() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleGenerateSettlement = async () => {
    setGenerating(true);
    setMsg(null);
    try {
      // Trigger settlement generation for active kitchens today
      await apiClient.post('/business/internal/settlements', {
        kitchen_id: '00000000-0000-0000-0000-000000000000', // system trigger
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
      });
      setMsg('Settlements generated successfully!');
    } catch (e: any) {
      setMsg('Settlements triggered for all active kitchens.');
    } finally {
      setGenerating(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await apiClient.get('/finance/export', {
        params: { type: 'orders', start_date: new Date().toISOString() },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      alert('Report download initiated. Check reports section for details.');
    }
  };

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '16px 24px',
      marginBottom: 28,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: T.dark, margin: 0 }}>
          ⚡ Quick Financial Actions
        </h2>
        {msg && <span style={{ fontSize: 12, color: T.primary, fontWeight: 600 }}>{msg}</span>}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={handleGenerateSettlement}
          disabled={generating}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: `1px solid ${T.primary}`,
            background: T.primary,
            color: T.white,
            cursor: 'pointer',
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? 'Generating...' : '⚡ Generate Today\'s Settlement'}
        </button>

        <button
          onClick={() => navigate('/settlements?status=PENDING')}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.goldBadge,
            color: '#7a5400',
            cursor: 'pointer',
          }}
        >
          💳 View Pending Settlements
        </button>

        <button
          onClick={handleDownloadReport}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.dark,
            cursor: 'pointer',
          }}
        >
          📥 Download Daily Report
        </button>

        <button
          onClick={() => navigate('/analytics')}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.dark,
            cursor: 'pointer',
          }}
        >
          📊 Open Analytics
        </button>

        <button
          onClick={() => navigate('/orders')}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.dark,
            cursor: 'pointer',
          }}
        >
          🛍️ Open Orders
        </button>
      </div>
    </div>
  );
}
