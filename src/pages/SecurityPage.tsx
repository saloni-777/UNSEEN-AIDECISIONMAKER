import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ButtonSpinner } from '@/components/ui';

export function SecurityPage() {
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }

    setPasswordSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');

    // Delete all user's decisions first
    const { error: dataError } = await supabase.from('decisions').delete().eq('user_id', user?.id);
    if (dataError) {
      setDeleteError('Could not delete your data. Please try again.');
      setDeleteLoading(false);
      return;
    }

    // Sign out
    await signOut();

    // Note: Supabase doesn't allow self-deleting auth accounts from the client.
    // The user should contact support or use the Supabase dashboard.
    setDeleteLoading(false);
    setDeleteError('Your decisions have been deleted. To fully delete your account, please contact support.');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-[#7dd3fc]" />
          <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        </div>
        <p className="text-sm text-[#a1a1aa]">Manage your password and account security.</p>
      </motion.div>

      {/* Session info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="surface-card p-6"
      >
        <h2 className="text-sm font-medium text-[#f4f4f5] mb-4">Current session</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#52525b]" />
              <span className="text-sm text-[#a1a1aa]">Email</span>
            </div>
            <span className="text-sm text-[#f4f4f5]">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-[#52525b]" />
              <span className="text-sm text-[#a1a1aa]">User ID</span>
            </div>
            <span className="text-xs text-[#52525b] font-mono">{user?.id?.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-[#52525b]" />
              <span className="text-sm text-[#a1a1aa]">Auth method</span>
            </div>
            <span className="text-sm text-[#f4f4f5]">Email & password</span>
          </div>
        </div>
      </motion.div>

      {/* RLS info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="surface-card p-6"
      >
        <h2 className="text-sm font-medium text-[#f4f4f5] mb-3">Data isolation</h2>
        <p className="text-sm text-[#a1a1aa] leading-relaxed">
          Your decisions are protected by Row Level Security (RLS). Only you can read, modify, or delete your own data. No other user can access your reasoning.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#86efac]" />
          <span className="text-xs text-[#86efac]">RLS enabled on all tables</span>
        </div>
      </motion.div>

      {/* Change password */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="surface-card p-6"
      >
        <h2 className="text-sm font-medium text-[#f4f4f5] mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field"
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </div>
          {passwordError && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-[#fca5a5]/20 bg-[#fca5a5]/5">
              <AlertCircle size={16} className="text-[#fca5a5] shrink-0 mt-0.5" />
              <p className="text-sm text-[#fca5a5]">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-[#86efac]/20 bg-[#86efac]/5">
              <CheckCircle2 size={16} className="text-[#86efac]" />
              <p className="text-sm text-[#86efac]">Password updated successfully.</p>
            </div>
          )}
          <button type="submit" disabled={passwordLoading} className="btn-primary">
            {passwordLoading ? <ButtonSpinner /> : 'Update password'}
          </button>
        </form>
      </motion.div>

      {/* Delete account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="surface-card p-6 border-[#fca5a5]/20"
      >
        <h2 className="text-sm font-medium text-[#fca5a5] mb-3">Delete account data</h2>
        <p className="text-sm text-[#a1a1aa] leading-relaxed mb-4">
          This will permanently delete all your saved decisions and reflections. This action cannot be undone.
        </p>
        {deleteError && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-lg border border-[#fcd34d]/20 bg-[#fcd34d]/5">
            <AlertCircle size={16} className="text-[#fcd34d] shrink-0 mt-0.5" />
            <p className="text-sm text-[#fcd34d]">{deleteError}</p>
          </div>
        )}
        {deleteConfirm ? (
          <div className="flex items-center gap-3">
            <button onClick={handleDeleteAccount} disabled={deleteLoading} className="text-sm text-[#fca5a5] underline hover:no-underline">
              {deleteLoading ? 'Deleting...' : 'Yes, delete all my data'}
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)} className="text-sm text-[#fca5a5] underline hover:no-underline">
            Delete all my data
          </button>
        )}
      </motion.div>

      <div className="pt-4 border-t border-[#27272a]/50">
        <p className="text-xs text-[#52525b]">UNSEEN does not claim to be unhackable. Security is layered, not absolute.</p>
      </div>
    </div>
  );
}
