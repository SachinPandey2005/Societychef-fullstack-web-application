import React, { useState } from 'react';
import Table, { Column } from '../components/Table';
import { useSocieties, useCreateSociety, useUpdateSociety } from '../hooks/useCrmData';
import { useDashboardStore } from '../store/useDashboardStore';
import Badge from '../components/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Building2, Plus, Edit2, MapPin, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocietyItem {
  id: string;
  name?: string;
  full_name?: string;
  city?: string;
  area?: string;
  delivery_radius_km?: number;
  radius?: number;
  is_active?: boolean;
  status?: string;
  created_at?: string;
}

export default function Societies() {
  const { searchQuery, setSearchQuery } = useDashboardStore();
  const [notification, setNotification] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSociety, setEditingSociety] = useState<SocietyItem | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formRadius, setFormRadius] = useState<number>(2.5);
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: societies = [], isLoading } = useSocieties();
  const createSociety = useCreateSociety();
  const updateSociety = useUpdateSociety();

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  const openAddModal = () => {
    setEditingSociety(null);
    setFormName('');
    setFormCity('Metro City');
    setFormRadius(2.5);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (society: SocietyItem) => {
    setEditingSociety(society);
    setFormName(society.name || society.full_name || '');
    setFormCity(society.city || society.area || 'Metro City');
    setFormRadius(society.delivery_radius_km ?? society.radius ?? 2.5);
    setFormIsActive(society.is_active ?? (society.status === 'ACTIVE'));
    setIsModalOpen(true);
  };

  const handleSaveSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingSociety) {
      updateSociety.mutate(
        {
          id: editingSociety.id,
          name: formName.trim(),
          city: formCity.trim(),
          delivery_radius_km: Number(formRadius) || 2.5,
          is_active: formIsActive,
        },
        {
          onSuccess: () => {
            showNotification(`Successfully updated society: ${formName}`);
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            showNotification(`Failed to update society: ${err?.response?.data?.message || err?.message || 'Error'}`);
          },
        }
      );
    } else {
      createSociety.mutate(
        {
          name: formName.trim(),
          city: formCity.trim(),
          delivery_radius_km: Number(formRadius) || 2.5,
          is_active: formIsActive,
        },
        {
          onSuccess: () => {
            showNotification(`Successfully added new society: ${formName}`);
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            showNotification(`Failed to add society: ${err?.response?.data?.message || err?.message || 'Error'}`);
          },
        }
      );
    }
  };

  const filtered = (societies as SocietyItem[]).filter((s) => {
    const nameStr = (s.name || s.full_name || '').toLowerCase();
    const cityStr = (s.city || s.area || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return !searchQuery || nameStr.includes(q) || cityStr.includes(q);
  });

  const COLS: Column[] = [
    {
      key: 'name',
      label: 'Society Name',
      width: 260,
      render: (v, row: any) => {
        const name = (v as string) || row.name || row.full_name || 'Housing Society';
        const city = row.city || row.area || 'Metro Zone';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{city}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'delivery_radius_km',
      label: 'Delivery Radius',
      width: 160,
      render: (v, row: any) => {
        const radius = v ?? row.delivery_radius_km ?? row.radius ?? 2.5;
        return <span className="font-semibold text-slate-800 dark:text-slate-200">{radius} km</span>;
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      width: 130,
      render: (v, row: any) => {
        const active = v !== undefined ? Boolean(v) : (row.status === 'ACTIVE' || row.is_active === true);
        return <Badge label={active ? 'Active' : 'Inactive'} tone={active ? 'green' : 'red'} />;
      },
    },
    {
      key: 'created_at',
      label: 'Added Date',
      width: 150,
      render: (v) => <span className="text-slate-500 dark:text-slate-400">{v ? new Date(v as string).toLocaleDateString() : 'N/A'}</span>,
    },
    {
      key: 'id',
      label: 'Actions',
      width: 180,
      align: 'right',
      render: (_v, row: any) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditModal(row as SocietyItem)}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Society
          </Button>
        </div>
      ),
    },
  ];

  const isSaving = createSociety.isPending || updateSociety.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xl border border-slate-800 dark:border-slate-200"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Housing Societies"
        description="Manage onboarded housing societies, geo-fencing, and delivery boundaries"
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search societies by name, city..."
            />
            <Button
              variant="primary"
              onClick={openAddModal}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Society
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Table columns={COLS} rows={[]} isLoading={true} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Societies Found"
          description="No housing societies match your search query."
          icon={<Building2 className="w-10 h-10 text-teal-600" />}
        />
      ) : (
        <Table
          columns={COLS}
          rows={filtered as unknown as Record<string, unknown>[]}
        />
      )}

      {/* Add / Edit Society Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSociety ? `Edit ${editingSociety.name || 'Society'}` : 'Add Housing Society'}
      >
        <form onSubmit={handleSaveSociety} className="space-y-4">
          <Input
            label="Society Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Prestige Falcon City"
            required
            icon={<Building2 className="w-4 h-4" />}
          />

          <Input
            label="City / Location"
            value={formCity}
            onChange={(e) => setFormCity(e.target.value)}
            placeholder="e.g. Bangalore South"
            required
            icon={<MapPin className="w-4 h-4" />}
          />

          <Input
            label="Delivery Radius (km)"
            type="number"
            step="0.1"
            value={formRadius}
            onChange={(e) => setFormRadius(parseFloat(e.target.value) || 2.5)}
            placeholder="e.g. 2.5"
            icon={<Compass className="w-4 h-4" />}
          />

          <div className="flex items-center gap-3 pt-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Operational Status:
            </label>
            <button
              type="button"
              onClick={() => setFormIsActive((v) => !v)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                formIsActive
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
              }`}
            >
              {formIsActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingSociety ? 'Update Society' : 'Create Society'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
