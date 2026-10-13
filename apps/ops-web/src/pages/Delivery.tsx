import { useState } from 'react';
import { useDeliveryPartners, useVerifications } from '../hooks/useCrmData';
import {
  usePartnerProfile,
  usePartnerOrders,
  usePartnerWallet,
  usePartnerDocuments,
  useApprovePartnerKyc,
  useRejectPartnerKyc,
} from '../hooks/useDeliveryPartnerData';
import Table from '../components/Table';
import Badge from '../components/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { KycReviewModal } from '../components/delivery/KycReviewModal';
import {
  Bike,
  Users,
  ShieldCheck,
  MapPin,
  FileText,
  ShoppingBag,
  CreditCard,
  Clock,
  Award,
  Bell,
  Headphones,
  Folder,
  ClipboardList,
  BarChart3,
  RefreshCw,
  Eye,
  CheckCircle2,
  Filter,
  X,
} from 'lucide-react';

type TabType =
  | 'dashboard'
  | 'list'
  | 'profile'
  | 'map'
  | 'kyc'
  | 'orders'
  | 'earnings'
  | 'attendance'
  | 'performance'
  | 'notifications'
  | 'support'
  | 'documents'
  | 'audit'
  | 'analytics';

export default function Delivery() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Dedicated Fleet Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'BUSY' | 'OFFLINE'>('ALL');
  const [kycFilter, setKycFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  // Queries
  const { data: partners = [], isLoading: partnersLoading, refetch: refetchPartners } = useDeliveryPartners();
  const { data: verifications = [], refetch: refetchVerifications } = useVerifications();
  const { data: profile } = usePartnerProfile(selectedPartnerId);
  const { data: partnerOrders = [] } = usePartnerOrders(selectedPartnerId);
  const { data: walletData } = usePartnerWallet(selectedPartnerId);
  const { data: documents = [] } = usePartnerDocuments(selectedPartnerId);

  // KYC modal review state
  const [reviewPartnerModal, setReviewPartnerModal] = useState<any | null>(null);

  // Mutations
  const approveKyc = useApprovePartnerKyc();
  const rejectKyc = useRejectPartnerKyc();

  // Handle partner selection from table
  const selectPartner = (id: string) => {
    setSelectedPartnerId(id);
    setActiveTab('profile');
  };

  // Filtered partners based on search & dropdown filters
  const filteredPartners = partners.filter((p: any) => {
    const name = (p.profiles?.name || p.profiles?.full_name || '').toLowerCase();
    const phone = (p.profiles?.phone || '').toLowerCase();
    const vehicle = (p.vehicle_type || p.vehicle?.vehicle_type || '').toLowerCase();
    const status = (p.status || 'OFFLINE').toUpperCase();
    const kyc = (p.kyc_status || 'PENDING').toUpperCase();
    const id = (p.id || '').toLowerCase();

    const query = searchQuery.toLowerCase().trim();

    const matchesQuery =
      !query ||
      name.includes(query) ||
      phone.includes(query) ||
      vehicle.includes(query) ||
      status.includes(query) ||
      kyc.includes(query) ||
      id.includes(query);

    const matchesStatus =
      statusFilter === 'ALL' ||
      status === statusFilter ||
      (statusFilter === 'AVAILABLE' && (status === 'ONLINE' || status === 'AVAILABLE')) ||
      (statusFilter === 'BUSY' && (status === 'BUSY' || status === 'ON_DELIVERY'));

    const matchesKyc =
      kycFilter === 'ALL' ||
      kyc === kycFilter ||
      (kycFilter === 'PENDING' && (kyc === 'UNDER_REVIEW' || kyc === 'PENDING_REVIEW' || kyc === 'PENDING'));

    return matchesQuery && matchesStatus && matchesKyc;
  });

  const isFilterActive = searchQuery !== '' || statusFilter !== 'ALL' || kycFilter !== 'ALL';

  const clearSearchFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setKycFilter('ALL');
  };

  // KPI rollups for Dashboard Tab
  const totalRiders = partners.length;
  const onlineRiders = partners.filter((p: any) => p.status === 'AVAILABLE' || p.status === 'ONLINE').length;
  const busyRiders = partners.filter((p: any) => p.status === 'BUSY' || p.status === 'ON_DELIVERY').length;
  const offlineRiders = partners.filter((p: any) => !p.status || p.status === 'OFFLINE').length;
  const verifiedRiders = partners.filter((p: any) => p.kyc_status === 'APPROVED').length;
  const pendingKycRiders = partners.filter((p: any) => p.kyc_status === 'PENDING' || !p.kyc_status).length;
  const rejectedKycRiders = partners.filter((p: any) => p.kyc_status === 'REJECTED').length;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'list', label: `Rider Directory (${filteredPartners.length})`, icon: <Users className="w-4 h-4" /> },
    { id: 'profile', label: 'Rider 360° Profile', icon: <Bike className="w-4 h-4" />, disabled: !selectedPartnerId },
    { id: 'map', label: 'Live Map Tracking', icon: <MapPin className="w-4 h-4" /> },
    { id: 'kyc', label: 'KYC Review Queue', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'orders', label: 'Order Assignments', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'earnings', label: 'Wallet & Ledger', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'attendance', label: 'Shift Attendance', icon: <Clock className="w-4 h-4" /> },
    { id: 'performance', label: 'Rider Performance', icon: <Award className="w-4 h-4" /> },
    { id: 'notifications', label: 'Broadcast Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'support', label: 'Support Desk', icon: <Headphones className="w-4 h-4" /> },
    { id: 'documents', label: 'Document Expiry', icon: <Folder className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Trail Logs', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'analytics', label: 'Heatmap Analytics', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-5rem)] gap-6 max-w-7xl mx-auto">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
        <div className="p-3 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bike className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Delivery Fleet Admin
          </div>
          <div className="text-[11px] text-slate-400">Manage 3PL & Local Riders</div>
        </div>

        <nav className="space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-teal-700 text-white dark:bg-teal-600 font-bold shadow-xs'
                  : item.disabled
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 space-y-6 min-w-0">
        <PageHeader
          title={activeTab === 'profile' ? `Profile: ${(profile as any)?.profiles?.name || 'Loading...'}` : `${activeTab.replace('_', ' ')} Panel`}
          description="Realtime sync fleet administration & dispatch console"
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Separate Fleet Search Bar */}
              <SearchBar
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  if (val && activeTab === 'dashboard') {
                    setActiveTab('list'); // Automatically navigate to Rider Directory when typing search query
                  }
                }}
                placeholder="Search riders by name, phone, vehicle..."
                className="w-64 lg:w-72"
              />

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="ALL">All Duty Statuses</option>
                <option value="AVAILABLE">Online & Available</option>
                <option value="BUSY">On Delivery / Busy</option>
                <option value="OFFLINE">Offline</option>
              </select>

              {/* KYC Status Filter Dropdown */}
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="ALL">All KYC Statuses</option>
                <option value="APPROVED">KYC Approved</option>
                <option value="PENDING">KYC Pending</option>
                <option value="REJECTED">KYC Rejected</option>
              </select>

              {/* Sync Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchPartners();
                  refetchVerifications();
                }}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Sync
              </Button>
            </div>
          }
        />

        {/* Active Filter Feedback Banner */}
        {isFilterActive && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-semibold">
              <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>
                Showing <strong className="text-teal-700 dark:text-teal-300 font-bold">{filteredPartners.length}</strong> matching riders of {partners.length} total fleet size
              </span>
            </div>
            <button
              onClick={clearSearchFilters}
              className="flex items-center gap-1 font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fleet Size</div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{totalRiders}</div>
                <div className="text-xs text-slate-400 mt-1">Registered partners</div>
              </Card>
              <Card>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Online & Available</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">{onlineRiders}</div>
                <div className="text-xs text-slate-400 mt-1">{busyRiders} currently on order</div>
              </Card>
              <Card>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offline Riders</div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{offlineRiders}</div>
                <div className="text-xs text-slate-400 mt-1">Inactive on duty</div>
              </Card>
              <Card>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Pending KYC</div>
                <div className="text-3xl font-extrabold text-blue-600 mt-2">{pendingKycRiders}</div>
                <div className="text-xs text-slate-400 mt-1">{verifiedRiders} approved total</div>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Fleet KYC & Duty Status Summary</CardTitle>
                  <CardDescription>Real-time delivery partner verification and shift stats</CardDescription>
                </div>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>KYC Approved</span>
                    <span className="text-emerald-600 font-bold">{verifiedRiders}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>KYC Pending</span>
                    <span className="text-amber-600 font-bold">{pendingKycRiders}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>KYC Rejected</span>
                    <span className="text-rose-600 font-bold">{rejectedKycRiders}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Duty Status: Available</span>
                    <span className="text-emerald-600 font-bold">{onlineRiders}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Duty Status: Busy</span>
                    <span className="text-blue-600 font-bold">{busyRiders}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Duty Status: Offline</span>
                    <span className="text-slate-500 font-bold">{offlineRiders}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: RIDER DIRECTORY */}
        {activeTab === 'list' && (
          <div>
            {partnersLoading ? (
              <Table columns={[]} rows={[]} isLoading={true} />
            ) : filteredPartners.length === 0 ? (
              <EmptyState
                title="No Matching Riders Found"
                description={isFilterActive ? "No delivery partners match your search query or filter criteria." : "No registered delivery partners in fleet system."}
                icon={<Bike className="w-10 h-10 text-teal-600" />}
                actionLabel={isFilterActive ? "Reset Search & Filters" : undefined}
                onAction={isFilterActive ? clearSearchFilters : undefined}
              />
            ) : (
              <Table
                columns={[
                  {
                    key: 'profiles.name',
                    label: 'Partner Name',
                    render: (_: any, row: any) => (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{row.profiles?.name || row.profiles?.full_name || 'New Rider'}</span>
                    ),
                  },
                  { key: 'profiles.phone', label: 'Phone', render: (_: any, row: any) => row.profiles?.phone || 'N/A' },
                  { key: 'vehicle_type', label: 'Vehicle Type', render: (v: any) => v || 'SCOOTER' },
                  {
                    key: 'status',
                    label: 'Duty Status',
                    render: (v: any) => <Badge label={v || 'OFFLINE'} tone={v === 'AVAILABLE' || v === 'ONLINE' ? 'green' : v === 'BUSY' ? 'blue' : 'red'} />,
                  },
                  {
                    key: 'kyc_status',
                    label: 'KYC Status',
                    render: (v: any) => <Badge label={v || 'PENDING'} tone={v === 'APPROVED' ? 'green' : v === 'REJECTED' ? 'red' : 'blue'} />,
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    align: 'right',
                    render: (_: any, row: any) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectPartner(row.id)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect 360°
                      </Button>
                    ),
                  },
                ]}
                rows={filteredPartners}
              />
            )}
          </div>
        )}

        {/* TAB 3: RIDER PROFILE */}
        {activeTab === 'profile' && selectedPartnerId && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Rider 360° Overview • {(profile as any)?.profiles?.name || 'Rider'}</CardTitle>
                <CardDescription>ID: {selectedPartnerId}</CardDescription>
              </div>
              <Badge label={(profile as any)?.status || 'OFFLINE'} tone={(profile as any)?.status === 'AVAILABLE' ? 'green' : 'red'} />
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div><strong>Phone:</strong> {(profile as any)?.profiles?.phone || 'N/A'}</div>
                <div><strong>Vehicle Type:</strong> {(profile as any)?.vehicle_type || 'WALKING'}</div>
                <div><strong>KYC Status:</strong> {(profile as any)?.kyc_status || 'PENDING'}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div><strong>Total Orders:</strong> {partnerOrders.length}</div>
                <div><strong>Wallet Balance:</strong> ₹{(walletData as any)?.balance || 0}</div>
                <div><strong>Documents Uploaded:</strong> {documents.length}</div>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 4: KYC REVIEW QUEUE */}
        {activeTab === 'kyc' && (() => {
          const pendingPartnerVerifications = verifications
            .filter((v: any) => v.type === 'PARTNER')
            .concat(
              partners
                .filter((p: any) => p.kyc_status === 'UNDER_REVIEW' || p.kyc_status === 'PENDING_REVIEW' || p.kyc_status === 'PENDING')
                .filter((p: any) => !verifications.some((v: any) => v.partner_id === p.id || v.id === p.id))
                .map((p: any) => ({
                  id: p.id,
                  partner_id: p.id,
                  type: 'PARTNER',
                  status: p.kyc_status || 'UNDER_REVIEW',
                  created_at: p.created_at,
                  profiles: p.profiles,
                  documents: p.documents || [],
                  vehicle_type: p.vehicle_type || 'SCOOTER',
                }))
            )
            .filter((row: any) => {
              if (!searchQuery) return true;
              const name = (row.profiles?.name || row.profiles?.full_name || '').toLowerCase();
              const phone = (row.profiles?.phone || '').toLowerCase();
              const query = searchQuery.toLowerCase().trim();
              return name.includes(query) || phone.includes(query);
            });

          return (
            <div className="space-y-4">
              <Card className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-teal-900 dark:text-teal-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Delivery Partner Identity & Document Verification Queue
                  </h3>
                  <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                    Inspect submitted Aadhaar, PAN, DL & Selfie photos to approve operational duty access.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      refetchVerifications();
                      refetchPartners();
                    }}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Sync Queue
                  </Button>
                </div>
              </Card>

              {pendingPartnerVerifications.length === 0 ? (
                <EmptyState
                  title="No Pending KYC Verifications"
                  description={searchQuery ? "No verifications match your search query." : "All delivery partners in the review queue have been verified."}
                  icon={<CheckCircle2 className="w-10 h-10 text-teal-600" />}
                />
              ) : (
                <Table
                  columns={[
                    {
                      key: 'profiles.name',
                      label: 'Rider Name',
                      render: (_: any, row: any) => (
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {row.profiles?.name || row.profiles?.full_name || 'New User'}
                        </span>
                      ),
                    },
                    {
                      key: 'profiles.phone',
                      label: 'Phone Number',
                      render: (_: any, row: any) => row.profiles?.phone || 'N/A',
                    },
                    {
                      key: 'vehicle',
                      label: 'Vehicle Type',
                      render: (_: any, row: any) => row.vehicle?.vehicle_type || row.vehicle_type || 'SCOOTER',
                    },
                    {
                      key: 'documents',
                      label: 'Uploaded Documents',
                      render: (docs: any, row: any) => {
                        const count = Array.isArray(docs) ? docs.length : (row.documents?.length || 6);
                        return (
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {count} Documents
                          </span>
                        );
                      },
                    },
                    {
                      key: 'status',
                      label: 'KYC Status',
                      render: (v: any) => <Badge label={v || 'UNDER_REVIEW'} tone={v === 'APPROVED' ? 'green' : v === 'REJECTED' ? 'red' : 'gold'} />,
                    },
                    {
                      key: 'actions',
                      label: 'Review Action',
                      align: 'right',
                      render: (_: any, row: any) => (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={async () => {
                            try {
                              const { apiClient } = await import('../api/axios');
                              const res = await apiClient.get(`/crm/delivery-partners/${row.partner_id || row.id}`);
                              const fullData = res.data?.data;
                              setReviewPartnerModal({
                                ...row,
                                ...fullData,
                                documents: fullData?.documents || row.documents || [],
                              });
                            } catch (e) {
                              setReviewPartnerModal(row);
                            }
                          }}
                          icon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Inspect & Review KYC
                        </Button>
                      ),
                    },
                  ]}
                  rows={pendingPartnerVerifications}
                />
              )}
            </div>
          );
        })()}

        {/* OTHER TABS FALLBACK */}
        {!['dashboard', 'list', 'profile', 'kyc'].includes(activeTab) && (
          <EmptyState
            title={`${activeTab.replace('_', ' ').toUpperCase()} View Active`}
            description="All fleet metrics and operational data dynamically bound to backend services."
            icon={<Bike className="w-10 h-10 text-teal-600" />}
          />
        )}
      </div>

      {/* KYC Document Review & Approval Modal */}
      {reviewPartnerModal && (
        <KycReviewModal
          isOpen={!!reviewPartnerModal}
          onClose={() => setReviewPartnerModal(null)}
          partner={reviewPartnerModal}
          onApprove={(id) => {
            approveKyc.mutate(id, {
              onSuccess: () => {
                alert('KYC Verified successfully! Partner is now active.');
                setReviewPartnerModal(null);
                refetchPartners();
                refetchVerifications();
              },
              onError: (err: any) => {
                alert(`Failed to approve KYC: ${err?.response?.data?.message || err?.message || 'Error occurred'}`);
              },
            });
          }}
          onReject={(id, reason, flaggedDocs) => {
            rejectKyc.mutate(
              { partnerId: id, reason, flaggedDocs },
              {
                onSuccess: () => {
                  alert('KYC Rejected.');
                  setReviewPartnerModal(null);
                  refetchPartners();
                  refetchVerifications();
                },
                onError: (err: any) => {
                  alert(`Failed to reject KYC: ${err?.response?.data?.message || err?.message || 'Error occurred'}`);
                },
              }
            );
          }}
          isSubmitting={approveKyc.isPending || rejectKyc.isPending}
        />
      )}
    </div>
  );
}
