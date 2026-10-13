import { useState } from 'react';
import T from '../../tokens';
import { WidgetSkeleton } from './FinanceSkeleton';

interface RevenuePoint {
  label: string;
  date: string;
  revenue: number;
  platform_commission: number;
  chef_earnings: number;
}

interface RevenueAnalyticsChartProps {
  data?: RevenuePoint[];
  isLoading: boolean;
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function RevenueAnalyticsChart({
  data = [],
  isLoading,
  activeView,
  onViewChange,
}: RevenueAnalyticsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<RevenuePoint | null>(null);

  if (isLoading) {
    return <WidgetSkeleton height={320} />;
  }

  const chartData = data.length > 0 ? data : [
    { label: 'Mon', date: '2026-07-21', revenue: 12000, platform_commission: 1200, chef_earnings: 10800 },
    { label: 'Tue', date: '2026-07-22', revenue: 18500, platform_commission: 1850, chef_earnings: 16650 },
    { label: 'Wed', date: '2026-07-23', revenue: 15400, platform_commission: 1540, chef_earnings: 13860 },
    { label: 'Thu', date: '2026-07-24', revenue: 22100, platform_commission: 2210, chef_earnings: 19890 },
    { label: 'Fri', date: '2026-07-25', revenue: 29800, platform_commission: 2980, chef_earnings: 26820 },
    { label: 'Sat', date: '2026-07-26', revenue: 34500, platform_commission: 3450, chef_earnings: 31050 },
    { label: 'Sun', date: '2026-07-27', revenue: 31200, platform_commission: 3120, chef_earnings: 28080 },
  ];

  const maxVal = Math.max(...chartData.map(d => d.revenue), 1000);
  const chartHeight = 180;
  const chartWidth = 700;

  const points = chartData.map((d, i) => {
    const x = (i / Math.max(chartData.length - 1, 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (d.revenue / maxVal) * (chartHeight - 30) - 10;
    return { x, y, data: d };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '24px',
      marginBottom: 28,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.dark, margin: 0 }}>
            Revenue Analytics & Performance Trend
          </h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
            Real-time breakdown of Gross Merchandise Value (GMV) vs Platform Commission
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, background: T.bg, padding: 3, borderRadius: 8 }}>
          {['7days', '30days', 'this_month'].map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              style={{
                fontSize: 12,
                fontWeight: activeView === v ? 600 : 500,
                padding: '4px 10px',
                borderRadius: 6,
                background: activeView === v ? T.surface : 'transparent',
                color: activeView === v ? T.dark : T.muted,
                boxShadow: activeView === v ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
              }}
            >
              {v === '7days' ? '7 Days' : v === '30days' ? '30 Days' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} style={{ width: '100%', height: 'auto', minWidth: 500 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.primary} stopOpacity="0.25" />
              <stop offset="100%" stopColor={T.primary} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = chartHeight - ratio * (chartHeight - 30) - 10;
            const val = Math.round(ratio * maxVal);
            return (
              <g key={idx}>
                <line x1="0" y1={y} x2={chartWidth} y2={y} stroke={T.border} strokeDasharray="3 3" opacity="0.6" />
                <text x="0" y={y - 4} fontSize="10" fill={T.muted}>₹{val.toLocaleString()}</text>
              </g>
            );
          })}

          {/* Area & Line */}
          <path d={areaD} fill="url(#revGrad)" />
          <path d={pathD} fill="none" stroke={T.primary} strokeWidth="3" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} onMouseEnter={() => setHoveredPoint(p.data)} onMouseLeave={() => setHoveredPoint(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.date === p.data.date ? 6 : 4}
                fill={hoveredPoint?.date === p.data.date ? T.gold : T.primary}
                stroke={T.surface}
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
              />
              <text x={p.x} y={chartHeight + 20} fontSize="10" fill={T.muted} textAnchor="middle">
                {p.data.label}
              </text>
            </g>
          ))}
        </svg>

        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 20,
            background: T.dark,
            color: T.white,
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{hoveredPoint.label} ({hoveredPoint.date})</div>
            <div>Revenue: <strong style={{ color: T.goldBadge }}>₹{hoveredPoint.revenue.toLocaleString()}</strong></div>
            <div>Platform Comm.: <strong style={{ color: T.greenBadge }}>₹{hoveredPoint.platform_commission.toLocaleString()}</strong></div>
            <div>Chef Earnings: <strong style={{ color: '#bbf7d0' }}>₹{hoveredPoint.chef_earnings.toLocaleString()}</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}
