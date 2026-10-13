import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import T from '../../tokens';
import Table, { Column } from '../Table';
import Badge from '../Badge';
import { apiClient } from '../../api/axios';

export interface CommissionRule {
  id: string;
  rule_name?: string;
  rule_type: 'CHEF' | 'SOCIETY' | 'PROMOTIONAL' | 'DEFAULT';
  kitchen_id?: string | null;
  society_id?: string | null;
  category?: string | null;
  percentage: number;
  fixed_fee: number;
  active: boolean;
  effective_date?: string | null;
  expiry_date?: string | null;
}

export default function CommissionRulesManager() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<'CHEF' | 'SOCIETY' | 'PROMOTIONAL' | 'DEFAULT'>('DEFAULT');
  const [percentage, setPercentage] = useState<number>(10);
  const [fixedFee, setFixedFee] = useState<number>(0);
  const [targetId, setTargetId] = useState('');
  const [active, setActive] = useState(true);

  const showMsg = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Queries
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['commission_rules'],
    queryFn: async () => {
      const { data } = await apiClient.get('/commission/rules');
      return data.data as CommissionRule[];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/commission/rules', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission_rules'] });
      showMsg('Commission rule created successfully');
      handleCloseModal();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create rule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      await apiClient.put(`/commission/rules/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission_rules'] });
      showMsg('Commission rule updated successfully');
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/commission/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission_rules'] });
      showMsg('Commission rule deleted');
    },
  });

  const handleOpenCreate = () => {
    setEditingRule(null);
    setRuleName('');
    setRuleType('DEFAULT');
    setPercentage(10);
    setFixedFee(0);
    setTargetId('');
    setActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    setRuleName(rule.rule_name || 'Commission Rule');
    setRuleType(rule.rule_type || 'DEFAULT');
    setPercentage(rule.percentage);
    setFixedFee(rule.fixed_fee);
    setTargetId(rule.kitchen_id || rule.society_id || '');
    setActive(rule.active);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      rule_name: ruleName,
      rule_type: ruleType,
      percentage: Number(percentage),
      fixed_fee: Number(fixedFee),
      active,
    };

    if (ruleType === 'CHEF' && targetId) payload.kitchen_id = targetId;
    if (ruleType === 'SOCIETY' && targetId) payload.society_id = targetId;

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getTypeTone = (type: string): 'green' | 'gold' | 'blue' | 'red' | 'default' => {
    switch (type) {
      case 'CHEF': return 'green';
      case 'SOCIETY': return 'blue';
      case 'PROMOTIONAL': return 'gold';
      default: return 'default';
    }
  };

  const COLS: Column[] = [
    {
      key: 'rule_name',
      label: 'Rule Name',
      width: 180,
      render: (v, r: any) => (
        <div>
          <div style={{ fontWeight: 600, color: T.dark }}>{(v as string) || 'Commission Rule'}</div>
          <div style={{ fontSize: 11, color: T.muted }}>
            {r.kitchen_id ? `Kitchen ID: ${(r.kitchen_id as string).substring(0, 8)}` : r.society_id ? `Society ID: ${(r.society_id as string).substring(0, 8)}` : 'Global Platform Standard'}
          </div>
        </div>
      ),
    },
    {
      key: 'rule_type',
      label: 'Rule Type',
      width: 130,
      render: (v) => <Badge label={v as string} tone={getTypeTone(v as string)} />,
    },
    {
      key: 'percentage',
      label: 'Commission Rate',
      width: 140,
      render: (v, r: any) => (
        <span style={{ fontWeight: 700, color: T.primary }}>
          {v as number}% {r.fixed_fee > 0 ? `+ ₹${r.fixed_fee}` : ''}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      width: 100,
      render: (v, r: any) => (
        <button
          onClick={() => updateMutation.mutate({ id: r.id as string, payload: { active: !v } })}
          style={{
            background: v ? T.greenBadge : T.redBadge,
            color: v ? T.primary : T.red,
            border: `1px solid ${v ? T.primary : T.red}`,
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {v ? 'Active' : 'Disabled'}
        </button>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      width: 120,
      render: (_v, row: any) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => handleOpenEdit(row)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${T.border}`,
              background: T.surface,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this commission rule?')) deleteMutation.mutate(row.id);
            }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${T.red}`,
              background: T.redBadge,
              color: T.red,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '24px',
      marginTop: 20,
    }}>
      {notification && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          background: T.primaryDeep, color: T.white,
          padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}>
          {notification}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.dark, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚙️</span> Platform Commission Rules Engine
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>
            Configure database-driven 4-tier priority commission rates (Chef-Specific &gt; Society-Specific &gt; Promotional &gt; Default)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            fontSize: 13,
            fontWeight: 600,
            background: T.primary,
            color: T.white,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          + Add Commission Rule
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Loading commission rules...</div>
      ) : (
        <Table columns={COLS} rows={rules as any} />
      )}

      {/* Modal Form */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90,
        }}>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: 28, width: 450, maxWidth: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: T.dark, marginBottom: 16 }}>
              {editingRule ? 'Edit Commission Rule' : 'Create Commission Rule'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                  Rule Name
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  placeholder="e.g. Premium Chef 8% Rate"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                  Rule Priority Type
                </label>
                <select
                  value={ruleType}
                  onChange={e => setRuleType(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13 }}
                >
                  <option value="DEFAULT">DEFAULT (Tier 4 - Fallback Standard)</option>
                  <option value="PROMOTIONAL">PROMOTIONAL (Tier 3 - Global Promo)</option>
                  <option value="SOCIETY">SOCIETY (Tier 2 - Society-Specific)</option>
                  <option value="CHEF">CHEF (Tier 1 - Chef-Specific)</option>
                </select>
              </div>

              {(ruleType === 'CHEF' || ruleType === 'SOCIETY') && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                    {ruleType === 'CHEF' ? 'Kitchen UUID' : 'Society UUID'}
                  </label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    placeholder="Enter UUID"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13 }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                    Commission %
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={percentage}
                    onChange={e => setPercentage(Number(e.target.value))}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>
                    Fixed Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={fixedFee}
                    onChange={e => setFixedFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: '10px', borderRadius: 6, background: T.primary, color: T.white, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                  }}
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 6, background: T.bg, color: T.dark, fontWeight: 600, fontSize: 13, border: `1px solid ${T.border}`, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
