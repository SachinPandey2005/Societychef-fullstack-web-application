import T from '../tokens';

interface ActivityItem {
  id: string;
  status: string;
  created_at: string;
  grand_total: number;
  profiles?: { full_name: string };
}

export default function ActivityTimeline({ data }: { data: ActivityItem[] }) {
  if (!data || data.length === 0) {
    return <div style={{ color: T.muted, fontSize: 14 }}>No recent activity.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {data.map((item, idx) => (
        <div key={item.id} style={{ display: 'flex', gap: 12 }}>
          <div style={{
            width: 2,
            background: idx === data.length - 1 ? 'transparent' : T.border,
            position: 'relative',
            marginTop: 20,
            marginLeft: 4,
          }}>
            <div style={{
              position: 'absolute',
              top: -20, left: -4,
              width: 10, height: 10,
              borderRadius: '50%',
              background: T.primary,
              border: `2px solid ${T.white}`,
            }} />
          </div>
          <div style={{ paddingBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: T.dark }}>
              Order {item.status.toLowerCase()} 
              {item.profiles?.full_name ? ` by ${item.profiles.full_name}` : ''}
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              {new Date(item.created_at).toLocaleString()} • ₹{item.grand_total}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
