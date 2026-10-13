import { useState } from 'react';
import T from '../../tokens';
import { DateRangeOption, DateFilterParams } from '../../hooks/useDashboardData';

interface GlobalDateFilterProps {
  value: DateFilterParams;
  onChange: (filter: DateFilterParams) => void;
}

const OPTIONS: { key: DateRangeOption; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7days', label: 'Last 7 Days' },
  { key: '30days', label: 'Last 30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'custom', label: 'Custom Range' },
];

export default function GlobalDateFilter({ value, onChange }: GlobalDateFilterProps) {
  const [customStart, setCustomStart] = useState(value.startDate || '');
  const [customEnd, setCustomEnd] = useState(value.endDate || '');

  const handleSelect = (key: DateRangeOption) => {
    if (key === 'custom') {
      onChange({ range: 'custom', startDate: customStart, endDate: customEnd });
    } else {
      onChange({ range: key });
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onChange({ range: 'custom', startDate: customStart, endDate: customEnd });
    }
  };

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>📅</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>Date Range:</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {OPTIONS.map(opt => {
          const isActive = value.range === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              style={{
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                padding: '6px 12px',
                borderRadius: 20,
                border: isActive ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                background: isActive ? T.primary : T.surface,
                color: isActive ? T.white : T.dark,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {value.range === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: 12,
              borderRadius: 6,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: T.dark,
            }}
          />
          <span style={{ fontSize: 12, color: T.muted }}>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: 12,
              borderRadius: 6,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: T.dark,
            }}
          />
          <button
            onClick={handleApplyCustom}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              background: T.primary,
              color: T.white,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
