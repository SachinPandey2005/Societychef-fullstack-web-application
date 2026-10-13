import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import Badge from '../Badge';
import { ShieldCheck, CheckCircle2, XCircle, FileText, Eye, AlertTriangle, User, Phone, Bike, MapPin, AlertCircle } from 'lucide-react';

interface KycReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: any | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string, flaggedDocs: string[]) => void;
  isSubmitting?: boolean;
}

const DOC_LABELS: Record<string, string> = {
  aadhaar_front: 'Aadhaar Front Card',
  aadhaar_back: 'Aadhaar Back Card',
  pan_card: 'PAN Card Details',
  license_front: 'Driving License Front',
  license_back: 'Driving License Back',
  selfie: 'Selfie Face Verification',
};

export const KycReviewModal: React.FC<KycReviewModalProps> = ({
  isOpen,
  onClose,
  partner,
  onApprove,
  onReject,
  isSubmitting = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ title: string; url: string } | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [flaggedDocs, setFlaggedDocs] = useState<string[]>([]);
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!partner) return null;

  const riderName = partner.profiles?.name || partner.profiles?.full_name || 'Delivery Partner';
  const riderPhone = partner.profiles?.phone || 'N/A';
  const vehicleType = partner.vehicle?.vehicle_type || partner.partner?.vehicle_type || partner.vehicle_type || 'SCOOTER';
  const kycStatus = partner.status || partner.partner?.kyc_status || 'UNDER_REVIEW';
  const documents: any[] = partner.documents || [];

  const toggleFlaggedDoc = (docType: string) => {
    if (flaggedDocs.includes(docType)) {
      setFlaggedDocs(flaggedDocs.filter((d) => d !== docType));
    } else {
      setFlaggedDocs([...flaggedDocs, docType]);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionNotes.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    onReject(partner.id || partner.partner_id, rejectionNotes.trim(), flaggedDocs);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Rider KYC Verification Review" maxWidth="2xl">
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* Header Info Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{riderName}</h4>
                <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {riderPhone}</span>
                  <span className="flex items-center gap-1"><Bike className="w-3 h-3" /> {vehicleType}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {partner.society || 'Unassigned'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Badge label={kycStatus} tone={kycStatus === 'APPROVED' ? 'green' : kycStatus === 'REJECTED' ? 'red' : 'gold'} />
              <div className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                {documents.length} Documents Submitted
              </div>
            </div>
          </div>

          {/* Document Verification Cards Grid */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Submitted Identity & Qualification Documents
            </h5>

            {documents.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700">
                No document files uploaded for this rider yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => {
                  const label = DOC_LABELS[doc.document_type] || doc.document_type;
                  const isFlagged = flaggedDocs.includes(doc.document_type);

                  return (
                    <div
                      key={doc.id || doc.document_type}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isFlagged
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{label}</span>
                          <Badge
                            label={doc.status || 'PENDING'}
                            tone={doc.status === 'APPROVED' ? 'green' : doc.status === 'REJECTED' ? 'red' : 'blue'}
                          />
                        </div>

                        {/* Document Image Preview Box */}
                        <div className="relative group w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          {doc.document_url ? (
                            <>
                              <img
                                src={doc.document_url}
                                alt={label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  // Fallback if image path is not direct image
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setSelectedImage({ title: label, url: doc.document_url })}
                                  icon={<Eye className="w-3 h-3" />}
                                >
                                  Inspect Full Image
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                              <FileText className="w-6 h-6" />
                              No Image URL
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Flag Document toggle for Rejection */}
                      {showRejectForm && (
                        <button
                          type="button"
                          onClick={() => toggleFlaggedDoc(doc.document_type)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                            isFlagged
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>{isFlagged ? '✓ Flagged for Rejection' : 'Flag this Document'}</span>
                          <AlertTriangle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejection Form Drawer */}
          {showRejectForm && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900 space-y-3">
              <div className="font-bold text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Specify KYC Rejection Reason & Remarks
              </div>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="E.g., Aadhaar card image is blurry or expired driving license..."
                className="w-full text-xs p-3 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>
                  Cancel Rejection
                </Button>
                <Button size="sm" variant="danger" onClick={handleConfirmReject} isLoading={isSubmitting} icon={<XCircle className="w-3.5 h-3.5" />}>
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          {!showRejectForm && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button size="md" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button size="md" variant="danger" onClick={() => setShowRejectForm(true)} icon={<XCircle className="w-4 h-4" />}>
                Reject KYC
              </Button>
              <Button
                size="md"
                variant="primary"
                onClick={() => onApprove(partner.id || partner.partner_id)}
                isLoading={isSubmitting}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Approve & Grant Duty Access
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Fullscreen Image Preview Zoom Modal */}
      {selectedImage && (
        <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} title={selectedImage.title} maxWidth="2xl">
          <div className="flex flex-col items-center justify-center p-2">
            <img src={selectedImage.url} alt={selectedImage.title} className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800" />
            <div className="mt-4 flex justify-end w-full">
              <Button size="sm" variant="outline" onClick={() => setSelectedImage(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default KycReviewModal;
