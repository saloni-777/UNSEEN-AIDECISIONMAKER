import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ButtonSpinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const exampleMode = (location.state as { exampleMode?: boolean })?.exampleMode;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate(exampleMode ? '/dashboard/new?example=true' : '/dashboard');
    } else {
      navigate('/verify', { state: { email, exampleMode } });
    }
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
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-[#a1a1aa] mt-2">Start examining your reasoning.</p>
          </div>

          {exampleMode && (
            <div className="mb-6 p-3 rounded-lg border border-[#7dd3fc]/20 bg-[#7dd3fc]/5 text-sm text-[#7dd3fc]">
              Sign up to try the example decision audit.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            </div>

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

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-field pl-10"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
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
              {loading ? <ButtonSpinner /> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-sm text-[#a1a1aa] mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[#7dd3fc] hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
