import { useState } from 'react';
import Badge from '../components/Badge';
import { useVerifications, useUpdateVerificationStatus, useChefs, useComplaints } from '../hooks/useCrmData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, Clock, AlertCircle, Eye, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHECKLIST_ITEMS = [
  { id: 1, item: 'Kitchen area is clean and free from visible contaminants', category: 'Hygiene' },
  { id: 2, item: 'Chef holds valid FSSAI registration or license', category: 'Compliance' },
  { id: 3, item: 'Food stored at appropriate temperatures (cold chain intact)', category: 'Safety' },
  { id: 4, item: 'Packaging materials are food-grade and sealed properly', category: 'Packaging' },
  { id: 5, item: 'No pests observed in cooking area during inspection', category: 'Hygiene' },
];

export default function Trust() {
  const [notification, setNotification] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [flaggedDocs, setFlaggedDocs] = useState<string[]>([]);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const { data: verifications = [], isLoading, isError: verificationsError } = useVerifications();
  const { data: chefs = [] } = useChefs();
  const { data: complaints = [], isLoading: complaintsLoading, isError: complaintsError } = useComplaints();
  const updateVerification = useUpdateVerificationStatus();

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }

  const handleApprove = (id: string, name: string) => {
    updateVerification.mutate({ id, status: 'APPROVED', notes: 'Approved by Ops' }, {
      onSuccess: () => notify(`Approved ${name}`)
    });
  };

  const handleReject = (id: string, name: string) => {
    updateVerification.mutate({ id, status: 'REJECTED', notes: 'Rejected by Ops' }, {
      onSuccess: () => notify(`Rejected ${name}`)
    });
  };

  const handlePartnerApprove = (id: string, name: string) => {
    updateVerification.mutate({ id, status: 'APPROVED', notes: 'Approved by Ops' }, {
      onSuccess: () => {
        notify(`Approved Partner ${name}`);
        setSelectedPartner(null);
      },
      onError: (err: any) => {
        notify(`Failed to approve partner: ${err?.response?.data?.message || err?.message || 'Error occurred'}`);
      }
    });
  };

  const handlePartnerReject = (id: string, name: string) => {
    if (!rejectionNotes.trim()) {
      alert('Please enter a rejection comment.');
      return;
    }
    const payloadNotes = JSON.stringify({ flaggedDocs, notes: rejectionNotes });
    updateVerification.mutate({ id, status: 'REJECTED', notes: payloadNotes }, {
      onSuccess: () => {
        notify(`Rejected Partner ${name}`);
        setSelectedPartner(null);
      },
      onError: (err: any) => {
        notify(`Failed to reject partner: ${err?.response?.data?.message || err?.message || 'Error occurred'}`);
      }
    });
  };

  const pendingKitchens = verifications.filter((v: any) => v.type === 'KITCHEN' && v.status === 'PENDING');
  const pendingPartners = verifications.filter((v: any) => v.type === 'PARTNER' && v.status === 'PENDING');
  const reportedFiltered = complaints.filter((c: any) => !dismissed.includes(c.id));

  const totalChefs = chefs.length || 1;
  const verifiedCount = chefs.filter((c: any) => c.status === 'ACTIVE').length;
  const fssaiCount = verifications.filter((v: any) => v.type === 'KITCHEN' && v.status === 'APPROVED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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
        title="Trust, Safety & Quality Assurance"
        description="Kitchen FSSAI verification, delivery fleet KYC compliance, and hygiene inspections"
      />

      {/* Compliance Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">% Verified Chefs</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
            {Math.round((verifiedCount / totalChefs) * 100)}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">FSSAI Approved</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100">{fssaiCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/60">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending KYC</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
            {pendingKitchens.length + pendingPartners.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/60">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Reports Open</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900 dark:text-rose-100">{reportedFiltered.length}</div>
        </div>
      </div>

      {/* Pending Kitchen Verification Queue */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Pending Kitchen Verification ({pendingKitchens.length})
        </h2>

        {isLoading ? (
          <Card><p className="text-center text-slate-400 py-4">Loading verification queue...</p></Card>
        ) : verificationsError ? (
          <Card><p className="text-center text-rose-500 py-4">Failed to load verifications.</p></Card>
        ) : pendingKitchens.length === 0 ? (
          <EmptyState
            title="All Kitchens Reviewed"
            description="No kitchen verifications pending in queue."
          />
        ) : (
          <div className="space-y-3">
            {pendingKitchens.map((k: any) => (
              <Card key={k.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {k.kitchen_profiles?.name || 'Chef ID: ' + k.chef_id}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">• {k.document_type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <button
                        onClick={() => notify('Opening document viewer...')}
                        className="text-teal-700 dark:text-teal-400 font-semibold underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Document
                      </button>
                      <span>Submitted {new Date(k.created_at).toLocaleDateString()}</span>
                      <Badge label="Pending Review" tone="gold" pulse />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(k.id, k.kitchen_profiles?.name || 'Chef')}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(k.id, k.kitchen_profiles?.name || 'Chef')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pending Delivery Partner KYC Verification Queue */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Pending Delivery Fleet KYC ({pendingPartners.length})
        </h2>

        {pendingPartners.length === 0 ? (
          <EmptyState
            title="All Delivery Fleet Reviewed"
            description="No delivery partner KYC submissions pending."
          />
        ) : (
          <div className="space-y-3">
            {pendingPartners.map((p: any) => {
              const name = p.profiles?.name || `Partner ${p.partner_id.substring(0, 8)}`;
              const phone = p.profiles?.phone || 'No phone';

              return (
                <Card key={p.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{name}</span>
                        <span className="text-xs text-slate-500 font-mono">(ID: {p.partner_id.substring(0, 8)})</span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">📞 {phone}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>Society: <strong className="text-slate-800 dark:text-slate-200">{p.society}</strong></span>
                        <span>Vehicle: <strong className="text-slate-800 dark:text-slate-200">{p.vehicle?.vehicle_type || 'WALKING'}</strong></span>
                        <button
                          onClick={() => {
                            setSelectedPartner(p);
                            setFlaggedDocs([]);
                            setRejectionNotes('');
                          }}
                          className="text-teal-700 dark:text-teal-400 font-bold underline flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Documents ({p.documents?.length || 0})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handlePartnerApprove(p.id, name)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 border-rose-200 dark:border-rose-800 hover:bg-rose-50"
                        onClick={() => {
                          setSelectedPartner(p);
                          setFlaggedDocs([]);
                          setRejectionNotes('');
                        }}
                      >
                        Reject...
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Hygiene Inspection Checklist */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Standard Operations Hygiene & Compliance Checklist</CardTitle>
            <CardDescription>Required verification standards during physical and virtual kitchen audits</CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs">
                  {item.id}
                </span>
                <span>{item.item}</span>
              </div>
              <Badge label={item.category} tone={item.category === 'Hygiene' ? 'green' : item.category === 'Compliance' ? 'blue' : 'gold'} />
            </div>
          ))}
        </div>
      </Card>

      {/* Document Review Modal */}
      <Modal
        isOpen={Boolean(selectedPartner)}
        onClose={() => setSelectedPartner(null)}
        title={`Review Partner Documents • ${selectedPartner?.profiles?.name || 'Partner'}`}
        maxWidth="xl"
      >
        {selectedPartner && (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs border border-slate-200 dark:border-slate-800">
              <div><strong>Partner ID:</strong> {selectedPartner.partner_id}</div>
              <div><strong>Phone:</strong> {selectedPartner.profiles?.phone || 'N/A'}</div>
              <div><strong>Society:</strong> {selectedPartner.society}</div>
              <div><strong>Vehicle:</strong> {selectedPartner.vehicle?.vehicle_type || 'WALKING'}</div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Uploaded Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedPartner.documents?.map((doc: any) => {
                  const isFlagged = flaggedDocs.includes(doc.document_type);
                  return (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isFlagged
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold capitalize">{doc.document_type.replace('_', ' ')}</span>
                        <Badge label={doc.status} tone={doc.status === 'APPROVED' ? 'green' : doc.status === 'REJECTED' ? 'red' : 'gold'} />
                      </div>
                      <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                        {doc.document_url ? (
                          <img src={doc.document_url} alt={doc.document_type} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">No Document Preview</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <a href={doc.document_url} target="_blank" rel="noreferrer" download className="text-teal-700 dark:text-teal-400 font-semibold underline flex items-center gap-1">
                          <Download className="w-3 h-3" /> Download
                        </a>
                        <label className="flex items-center gap-1.5 text-rose-600 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isFlagged}
                            onChange={() => {
                              if (isFlagged) {
                                setFlaggedDocs((prev) => prev.filter((t) => t !== doc.document_type));
                              } else {
                                setFlaggedDocs((prev) => [...prev, doc.document_type]);
                              }
                            }}
                          />
                          Flag Reject
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verification Feedback Notes</label>
              <textarea
                placeholder="Enter rejection rationale or feedback notes..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="w-full h-20 p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" onClick={() => setSelectedPartner(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handlePartnerReject(selectedPartner.id, selectedPartner.profiles?.name || 'Partner')}>
                Reject KYC ({flaggedDocs.length} Flagged)
              </Button>
              <Button variant="primary" onClick={() => handlePartnerApprove(selectedPartner.id, selectedPartner.profiles?.name || 'Partner')}>
                Approve KYC (All Verified)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
