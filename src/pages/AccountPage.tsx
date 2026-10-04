import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ButtonSpinner } from '@/components/ui';

export function AccountPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { name },
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  };

  const initials = name
    ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <User size={20} className="text-[#7dd3fc]" />
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        </div>
        <p className="text-sm text-[#a1a1aa]">Manage your profile information.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="surface-card p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#27272a] flex items-center justify-center text-xl font-medium text-[#a1a1aa]">
            {initials}
          </div>
          <div>
            <p className="text-base font-medium text-[#f4f4f5]">{name || 'User'}</p>
            <p className="text-sm text-[#52525b]">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSuccess(false); }}
              className="input-field"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field pl-10 opacity-50"
              />
            </div>
            <p className="text-xs text-[#52525b] mt-1">Email cannot be changed here.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-[#fca5a5]/20 bg-[#fca5a5]/5">
              <AlertCircle size={16} className="text-[#fca5a5] shrink-0 mt-0.5" />
              <p className="text-sm text-[#fca5a5]">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-[#86efac]/20 bg-[#86efac]/5">
              <CheckCircle2 size={16} className="text-[#86efac]" />
              <p className="text-sm text-[#86efac]">Profile updated.</p>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <ButtonSpinner /> : 'Save changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
