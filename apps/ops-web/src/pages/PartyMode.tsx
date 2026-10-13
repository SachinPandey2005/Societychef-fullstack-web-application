import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import Table from '../components/Table';
import { usePartyBookings, useUpdatePartyBookingStatus, useChefs } from '../hooks/useCrmData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { PartyPopper, Users, IndianRupee, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'dashboard' | 'bookings' | 'kitchens';

export default function PartyMode() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = usePartyBookings();
  const { data: chefs = [], isLoading: chefsLoading } = useChefs();
  const updateBookingStatus = useUpdatePartyBookingStatus();

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  // Filter bookings
  const pendingBookings = bookings.filter((b: any) => b.status === 'placed' || b.status === 'accepted');

  // Stats calculation
  const totalBookings = bookings.length;
  const activeBookings = pendingBookings.length;
  const totalRevenue = bookings
    .filter((b: any) => b.status !== 'cancelled')
    .reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0);

  const avgGuests = bookings.length > 0
    ? Math.round(bookings.reduce((sum: number, b: any) => sum + (b.guest_count || 0), 0) / bookings.length)
    : 0;

  // Dynamic Sales Mix calculation across packages
  const validBookings = bookings.filter((b: any) => b.status !== 'cancelled');
  const totalValidBookings = validBookings.length;

  const dawaatCount = validBookings.filter(
    (b: any) => (b.selected_pack_name || b.package_name || '').toLowerCase().includes('dawaat')
  ).length;

  const jalsaCount = validBookings.filter(
    (b: any) => (b.selected_pack_name || b.package_name || '').toLowerCase().includes('jalsa')
  ).length;

  const dawaatPct = totalValidBookings > 0 ? Math.round((dawaatCount / totalValidBookings) * 100) : 0;
  const jalsaPct = totalValidBookings > 0 ? Math.round((jalsaCount / totalValidBookings) * 100) : 0;

  const handleUpdateStatus = (id: string, status: string) => {
    if (confirm(`Set party booking status to ${status}?`)) {
      updateBookingStatus.mutate(
        { id, status, reason: 'Ops Action' },
        {
          onSuccess: () => {
            notify(`Booking status updated to ${status}`);
            setSelectedBooking(null);
            refetchBookings();
          },
        }
      );
    }
  };

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
        title="Party Mode & Combos Control Panel"
        description="Configure party packages, review guest selections, and manage large-scale catering bookings"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        {(['dashboard', 'bookings', 'kitchens'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all capitalize whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Party Bookings</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{activeBookings}</div>
              <div className="text-xs text-slate-400 mt-1">Awaiting preparation/delivery</div>
            </Card>
            <Card>
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider">Total Party Revenue</div>
              <div className="text-2xl font-bold text-teal-600 mt-2">₹{totalRevenue.toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-400 mt-1">Live sales metrics</div>
            </Card>
            <Card>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Average Guest Count</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{avgGuests} heads</div>
              <div className="text-xs text-slate-400 mt-1">Per booking average</div>
            </Card>
            <Card>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalBookings}</div>
              <div className="text-xs text-slate-400 mt-1">All-time bookings count</div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Party Package Sales Mix</CardTitle>
                <CardDescription>Performance distribution across Dawaat & Jalsa party combos</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Dawaat Package ({dawaatCount} bookings)</span>
                  <span className="font-bold text-teal-600">{dawaatPct}% of sales</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dawaatPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Jalsa Package ({jalsaCount} bookings)</span>
                  <span className="font-bold text-blue-600">{jalsaPct}% of sales</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${jalsaPct}%` }}
                  />
                </div>
              </div>
              {totalValidBookings === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center pt-1">
                  No party sales recorded yet. Percentages will update dynamically as bookings arrive.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          {bookingsLoading ? (
            <Table columns={[]} rows={[]} isLoading={true} />
          ) : bookings.length === 0 ? (
            <EmptyState
              title="No Party Bookings Found"
              description="No large-scale catering party bookings registered."
              icon={<PartyPopper className="w-10 h-10 text-teal-600" />}
            />
          ) : (
            <Table
              columns={[
                { key: 'id', label: 'Booking ID', render: (v) => <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">#{(v as string).slice(0, 8)}</span> },
                { key: 'profiles.name', label: 'Customer', render: (_, r: any) => <span className="font-medium text-slate-900 dark:text-slate-100">{r.profiles?.name || 'Customer'}</span> },
                { key: 'kitchens.name', label: 'Kitchen', render: (_, r: any) => <span className="text-slate-700 dark:text-slate-300">{r.kitchens?.name || 'Chef Kitchen'}</span> },
                { key: 'selected_pack_name', label: 'Package' },
                { key: 'guest_count', label: 'Guests', render: (v: any) => <span className="font-semibold">{v} heads</span> },
                { key: 'total_amount', label: 'Amount', render: (v: any) => <span className="font-bold">₹{v}</span> },
                { key: 'status', label: 'Status', render: (v: any) => <Badge label={String(v)} tone={v === 'delivered' ? 'green' : v === 'cancelled' ? 'red' : 'blue'} /> },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'right',
                  render: (_, r: any) => (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBooking(r)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View Details
                    </Button>
                  ),
                },
              ]}
              rows={bookings}
            />
          )}
        </div>
      )}

      {activeTab === 'kitchens' && (
        <div>
          {chefsLoading ? (
            <Table columns={[]} rows={[]} isLoading={true} />
          ) : (
            <Table
              columns={[
                { key: 'name', label: 'Kitchen Name', render: (v: any) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
                { key: 'chef_name', label: 'Chef' },
                { key: 'society', label: 'Society' },
                { key: 'specialty', label: 'Specialty' },
              ]}
              rows={chefs}
            />
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={`Party Booking Details • #${selectedBooking?.id?.substring(0, 8)}`}
      >
        {selectedBooking && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div><strong>Customer:</strong> {selectedBooking.profiles?.name || 'Customer'}</div>
              <div><strong>Kitchen:</strong> {selectedBooking.kitchens?.name || 'Kitchen'}</div>
              <div><strong>Package:</strong> {selectedBooking.selected_pack_name}</div>
              <div><strong>Guest Count:</strong> {selectedBooking.guest_count} heads</div>
              <div><strong>Total Amount:</strong> ₹{selectedBooking.total_amount}</div>
              <div><strong>Status:</strong> {selectedBooking.status}</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelled')}>
                Cancel Booking
              </Button>
              <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(selectedBooking.id, 'accepted')}>
                Accept Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
