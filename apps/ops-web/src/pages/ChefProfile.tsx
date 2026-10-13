import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import Table from '../components/Table';
import {
  useChefProfile,
  useUpdateUserStatus,
  useResetUserPassword,
  useSendNotification,
  useUpdateProfile,
  useUpdateKitchen,
  useUpdateVerificationStatus,
} from '../hooks/useCrmData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  ChefHat,
  ShieldCheck,
  Star,
  KeyRound,
  Send,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChefProfile() {
  const { chefId } = useParams<{ chefId: string }>();
  const navigate = useNavigate();

  const { data: chefData, isLoading, isError, refetch } = useChefProfile(chefId);
  const updateStatus = useUpdateUserStatus();
  const resetPassword = useResetUserPassword();
  const sendNotification = useSendNotification();
  const updateProfile = useUpdateProfile();
  const updateKitchen = useUpdateKitchen();
  const updateVerification = useUpdateVerificationStatus();

  // Modal / UI states
  const [activeTab, setActiveTab] = useState<'details' | 'kyc' | 'wallet' | 'menu' | 'orders' | 'reviews'>('details');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingKitchen, setIsEditingKitchen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  // Editing form states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editBio, setEditBio] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !chefData) {
    return (
      <EmptyState
        title="Chef Profile Not Found"
        description="Could not load chef profile details. Please verify the ID."
        icon={<AlertTriangle className="w-10 h-10 text-rose-500" />}
      />
    );
  }

  const { profile, kitchen, verification, wallet, dishes, orders, reviews } = chefData;

  const handleUpdateStatus = (status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') => {
    if (confirm(`Are you sure you want to set status to ${status}?`)) {
      updateStatus.mutate(
        { id: profile.id, type: 'chefs', status, reason: 'Ops Action' },
        {
          onSuccess: () => {
            notify(`Chef status updated to ${status}`);
            refetch();
          },
        }
      );
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    resetPassword.mutate(
      { id: profile.id, password: newPassword },
      {
        onSuccess: () => {
          notify('Password reset successfully');
          setIsPasswordModalOpen(false);
          setNewPassword('');
        },
      }
    );
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    sendNotification.mutate(
      { profile_id: profile.id, title: notifTitle, message: notifMessage },
      {
        onSuccess: () => {
          notify('Notification sent to chef');
          setIsNotificationModalOpen(false);
          setNotifTitle('');
          setNotifMessage('');
        },
      }
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { id: profile.id, updates: { name: editName, phone: editPhone } },
      {
        onSuccess: () => {
          notify('Personal profile updated');
          setIsEditingProfile(false);
          refetch();
        },
      }
    );
  };

  const handleSaveKitchen = (e: React.FormEvent) => {
    e.preventDefault();
    updateKitchen.mutate(
      { id: kitchen.id, updates: { specialty: editSpecialty, bio: editBio } },
      {
        onSuccess: () => {
          notify('Kitchen profile updated');
          setIsEditingKitchen(false);
          refetch();
        },
      }
    );
  };

  const handleKycStatus = (status: 'APPROVED' | 'REJECTED') => {
    if (!verification) {
      alert('No verification request found for this kitchen');
      return;
    }
    updateVerification.mutate(
      { id: verification.id, status, notes: `Reviewed by Ops on ${new Date().toLocaleDateString()}` },
      {
        onSuccess: () => {
          notify(`KYC status updated to ${status}`);
          refetch();
        },
      }
    );
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

      {/* HEADER COCKPIT CARD */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <img
              src={kitchen.profile_image || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120'}
              alt={kitchen.name}
              className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kitchen.name}</h1>
                <Badge
                  label={kitchen.is_verified ? 'Verified Chef' : 'Verification Pending'}
                  tone={kitchen.is_verified ? 'green' : 'gold'}
                  pulse={!kitchen.is_verified}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chef Name: <strong className="text-slate-800 dark:text-slate-200">{profile.name}</strong> • Phone: {profile.phone}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> {kitchen.rating || '5.0'} Avg Rating
                </span>
                <span>Joined {new Date(kitchen.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditName(profile.name || '');
                setEditPhone(profile.phone || '');
                setIsEditingProfile(true);
              }}
              icon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
              icon={<KeyRound className="w-3.5 h-3.5" />}
            >
              Reset PW
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNotificationModalOpen(true)}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Message
            </Button>
            {kitchen.is_active ? (
              <Button size="sm" variant="danger" onClick={() => handleUpdateStatus('SUSPENDED')}>
                Suspend
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={() => handleUpdateStatus('ACTIVE')}>
                Activate
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        {(['details', 'kyc', 'wallet', 'menu', 'orders', 'reviews'] as const).map((tab) => (
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

      {/* TAB CONTENT */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-xs">
              <div><strong>Name:</strong> {profile.name}</div>
              <div><strong>Email:</strong> {profile.email || 'N/A'}</div>
              <div><strong>Phone:</strong> {profile.phone}</div>
              <div><strong>Role:</strong> {profile.role}</div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Profile</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-xs">
              <div><strong>Kitchen Name:</strong> {kitchen.name}</div>
              <div><strong>Specialty:</strong> {kitchen.specialty || 'Home Cooking'}</div>
              <div><strong>Bio:</strong> {kitchen.bio || 'Fresh home cooked food'}</div>
              <div><strong>Address:</strong> {kitchen.address}</div>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(null as any)}
        title="Reset Chef Password"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new secure password"
            icon={<Lock className="w-4 h-4" />}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Reset Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
