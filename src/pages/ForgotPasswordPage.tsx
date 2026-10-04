import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ButtonSpinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center px-6">
        <Logo />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-[#86efac]/20 bg-[#86efac]/5 mb-6">
                <CheckCircle2 size={24} className="text-[#86efac]" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight mb-3">Check your email</h1>
              <p className="text-sm text-[#a1a1aa] leading-relaxed mb-6">
                We sent a password reset link to <span className="text-[#f4f4f5] font-medium">{email}</span>.
              </p>
              <Link to="/login" className="btn-secondary">Back to sign in</Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
                <p className="text-sm text-[#a1a1aa] mt-2">We'll send a reset link to your email.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-field pl-10"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-[#fca5a5]/20 bg-[#fca5a5]/5">
                    <AlertCircle size={16} className="text-[#fca5a5] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#fca5a5]">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <ButtonSpinner /> : <>Send reset link <ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="text-sm text-[#a1a1aa] mt-6 text-center">
                Remembered your password?{' '}
                <Link to="/login" className="text-[#7dd3fc] hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
