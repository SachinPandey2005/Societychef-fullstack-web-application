import T from '../../tokens';

export function CardSkeleton() {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, background: T.pillInactive, borderRadius: 8 }} className="animate-pulse" />
        <div style={{ width: 60, height: 20, background: T.pillInactive, borderRadius: 20 }} className="animate-pulse" />
      </div>
      <div style={{ width: '60%', height: 28, background: T.pillInactive, borderRadius: 6 }} className="animate-pulse" />
      <div style={{ width: '40%', height: 14, background: T.pillInactive, borderRadius: 4 }} className="animate-pulse" />
    </div>
  );
}

export function WidgetSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '24px',
      height,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ width: '40%', height: 16, background: T.pillInactive, borderRadius: 4 }} className="animate-pulse" />
      <div style={{ width: '80%', height: 32, background: T.pillInactive, borderRadius: 6 }} className="animate-pulse" />
      <div style={{ width: '60%', height: 14, background: T.pillInactive, borderRadius: 4 }} className="animate-pulse" />
    </div>
  );
}
