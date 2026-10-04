import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, Sparkles, Zap, List } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui';
import type { Decision } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDecisions() {
      const { data } = await supabase
        .from('decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setDecisions((data as Decision[]) || []);
      setLoading(false);
    }
    loadDecisions();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = user?.user_metadata?.name?.split(' ')[0] || 'there';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statusLabel = (status: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'challenged') return 'Challenged';
    if (status === 'analyzed') return 'Analyzed';
    return 'In progress';
  };

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-[#71717a] mb-1">{greeting}, {name}.</p>
        <h1 className="text-3xl font-semibold tracking-tight">What decision are you examining?</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid sm:grid-cols-3 gap-3"
      >
        <Link to="/dashboard/new" className="surface-card p-5 group hover:border-[#3f3f46] transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-[#7dd3fc]" />
            <span className="text-sm font-medium text-[#f4f4f5]">New Decision</span>
          </div>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">Start a guided reflection and get an AI reasoning audit.</p>
        </Link>

        <Link to="/dashboard/new?example=true" className="surface-card p-5 group hover:border-[#3f3f46] transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#a78bfa]" />
            <span className="text-sm font-medium text-[#f4f4f5]">Try Example</span>
          </div>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">Experience the full audit with a sample internship decision.</p>
        </Link>

        <Link to="/dashboard/new?challenge=true" className="surface-card p-5 group hover:border-[#3f3f46] transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#fcd34d]" />
            <span className="text-sm font-medium text-[#f4f4f5]">Challenge Mode</span>
          </div>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">Jump straight into adaptive questioning that tests your reasoning.</p>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#a1a1aa]">Recent decisions</h2>
          {decisions.length > 0 && (
            <Link to="/dashboard/decisions" className="text-xs text-[#7dd3fc] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg animate-shimmer" />
            ))}
          </div>
        ) : decisions.length === 0 ? (
          <EmptyState
            icon={<List size={28} />}
            title="No decisions yet"
            description="Your examined decisions will appear here. Start by examining a new decision."
            action={
              <Link to="/dashboard/new" className="btn-primary">
                <Plus size={16} /> New Decision
              </Link>
            }
          />
        ) : (
          <div className="space-y-1">
            {decisions.map((decision, i) => (
              <motion.div
                key={decision.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  to={`/dashboard/decisions/${decision.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-lg border border-[#27272a] hover:border-[#3f3f46] hover:bg-[#111113] transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f4f4f5] truncate group-hover:text-white">
                      {decision.decision}
                    </p>
                    <p className="text-xs text-[#52525b] mt-0.5">{formatDate(decision.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      decision.status === 'completed' ? 'text-[#86efac] bg-[#86efac]/10' :
                      decision.status === 'challenged' ? 'text-[#fcd34d] bg-[#fcd34d]/10' :
                      decision.status === 'analyzed' ? 'text-[#7dd3fc] bg-[#7dd3fc]/10' :
                      'text-[#a1a1aa] bg-[#27272a]'
                    }`}>
                      {statusLabel(decision.status)}
                    </span>
                    <ArrowRight size={14} className="text-[#52525b] group-hover:text-[#a1a1aa]" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="pt-6 border-t border-[#27272a]/50">
        <p className="text-xs text-[#52525b] italic">UNSEEN challenges your reasoning, not your autonomy.</p>
      </div>
    </div>
  );
}
