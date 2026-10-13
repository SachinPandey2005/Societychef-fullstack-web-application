import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Badge from '../components/Badge';
import {
  useCustomerProfile,
  useUpdateUserStatus,
  useResetUserPassword,
} from '../hooks/useCrmData';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { KeyRound, AlertTriangle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerProfile() {
  const { customerId } = useParams<{ customerId: string }>();

  const { data: customerData, isLoading, isError, refetch } = useCustomerProfile(customerId);
  const updateStatus = useUpdateUserStatus();
  const resetPassword = useResetUserPassword();

  // Modal / UI states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Form states
  const [newPassword, setNewPassword] = useState('');
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

  if (isError || !customerData) {
    return (
      <EmptyState
        title="Customer Profile Not Found"
        description="Could not load consumer profile. Please verify the ID."
        icon={<AlertTriangle className="w-10 h-10 text-rose-500" />}
      />
    );
  }

  const { profile, wallet, orders = [] } = customerData;

  const handleUpdateStatus = (status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') => {
    if (confirm(`Are you sure you want to set status to ${status}?`)) {
      updateStatus.mutate(
        { id: profile.id, type: 'customers', status, reason: 'Ops Action' },
        {
          onSuccess: () => {
            notify(`Customer status updated to ${status}`);
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

      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold flex items-center justify-center text-lg">
              {(profile.name || 'C')?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{profile.name || 'Consumer User'}</h1>
                <Badge label={profile.status || 'ACTIVE'} tone={profile.status === 'ACTIVE' ? 'green' : 'red'} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ID: {profile.id} • Phone: {profile.phone || 'N/A'} • Email: {profile.email || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
              icon={<KeyRound className="w-3.5 h-3.5" />}
            >
              Reset PW
            </Button>
            {(profile.status || '').toUpperCase() === 'ACTIVE' ? (
              <Button size="sm" variant="danger" onClick={() => handleUpdateStatus('SUSPENDED')}>
                Suspend
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={() => handleUpdateStatus('ACTIVE')}>
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <div className="space-y-2 text-xs">
            <div><strong>Role:</strong> {profile.role}</div>
            <div><strong>Joined Date:</strong> {new Date(profile.created_at).toLocaleDateString()}</div>
            <div><strong>Total Orders:</strong> {orders.length}</div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consumer Wallet Balance</CardTitle>
          </CardHeader>
          <div className="text-3xl font-extrabold text-teal-700 dark:text-teal-400">
            ₹{wallet?.balance || 0}
          </div>
        </Card>
      </div>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Reset Consumer Password"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
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
