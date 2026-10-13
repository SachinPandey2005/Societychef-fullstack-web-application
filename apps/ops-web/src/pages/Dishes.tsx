import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { UtensilsCrossed } from 'lucide-react';

export default function Dishes() {
  const [search, setSearch] = useState('');

  const { data: dishes = [], isLoading, isError } = useQuery({
    queryKey: ['dishes'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/dishes');
        if (data?.data && Array.isArray(data.data)) return data.data;
        if (Array.isArray(data)) return data;
      } catch (err) {
        // Fallback to /menu if /dishes encounters any network issue
      }
      const res = await apiClient.get('/menu');
      return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    },
  });

  const filtered = dishes.filter((d: any) =>
    !search || (d.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const COLS: Column[] = [
    {
      key: 'name',
      label: 'Dish Name',
      width: 280,
      render: (v: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{v}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      width: 120,
      render: (v: any) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{v}</span>,
    },
    {
      key: 'is_available',
      label: 'Available',
      width: 140,
      render: (v: any) => <Badge label={v ? 'AVAILABLE' : 'UNAVAILABLE'} tone={v ? 'green' : 'red'} />,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dishes Catalog"
        description="Global menu dishes catalog across all registered home kitchens"
        actions={
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search dishes by name..."
          />
        }
      />

      {isLoading ? (
        <Table columns={COLS} rows={[]} isLoading={true} />
      ) : isError ? (
        <EmptyState
          title="Failed to Load Dishes"
          description="Error fetching dishes catalog from backend."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Dishes Found"
          description="No dishes match your search query."
          icon={<UtensilsCrossed className="w-10 h-10 text-orange-600" />}
        />
      ) : (
        <Table columns={COLS} rows={filtered} />
      )}
    </div>
  );
}
