import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function VerifyEmailPage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;
  const exampleMode = (location.state as { exampleMode?: boolean })?.exampleMode;

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
          className="w-full max-w-sm text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/5 mb-6">
            <MailCheck size={24} className="text-[#7dd3fc]" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight mb-3">Check your email</h1>

          <p className="text-sm text-[#a1a1aa] leading-relaxed">
            {email ? (
              <>We sent a confirmation link to <span className="text-[#f4f4f5] font-medium">{email}</span>.</>
            ) : (
              'We sent a confirmation link to your email.'
            )}
            {' '}Click the link to verify your account, then sign in.
          </p>

          <div className="mt-8 space-y-3">
            <Link to="/login" className="btn-primary w-full py-3 inline-flex">
              Go to sign in
              <ArrowRight size={16} />
            </Link>
            {exampleMode && (
              <p className="text-xs text-[#71717a]">
                After verifying, sign in and click "Try Example" on your dashboard.
              </p>
            )}
          </div>

          <p className="text-xs text-[#52525b] mt-6">
            Didn't get an email? Check your spam folder or{' '}
            <Link to="/signup" className="text-[#7dd3fc] hover:underline">try again</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
