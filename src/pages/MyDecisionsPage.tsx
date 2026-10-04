import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, List } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui';
import type { Decision } from '@/types';

export function MyDecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('decisions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDecisions((data as Decision[]) || []);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusLabel = (status: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'challenged') return 'Challenged';
    if (status === 'analyzed') return 'Analyzed';
    return 'In progress';
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Decisions</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">All your examined decisions.</p>
        </div>
        <Link to="/dashboard/new" className="btn-primary">
          <Plus size={16} /> New
        </Link>
      </motion.div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg animate-shimmer" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <EmptyState
          icon={<List size={28} />}
          title="No decisions yet"
          description="Start examining a decision to see it here."
          action={<Link to="/dashboard/new" className="btn-primary"><Plus size={16} /> New Decision</Link>}
        />
      ) : (
        <div className="space-y-1">
          {decisions.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                to={`/dashboard/decisions/${d.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 rounded-lg border border-[#27272a] hover:border-[#3f3f46] hover:bg-[#111113] transition-all duration-200 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f4f4f5] truncate group-hover:text-white">{d.decision}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-[#52525b]">{formatDate(d.created_at)}</p>
                    {d.priorities?.length > 0 && (
                      <p className="text-xs text-[#52525b]">· {d.priorities.slice(0, 3).join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    d.status === 'completed' ? 'text-[#86efac] bg-[#86efac]/10' :
                    d.status === 'challenged' ? 'text-[#fcd34d] bg-[#fcd34d]/10' :
                    d.status === 'analyzed' ? 'text-[#7dd3fc] bg-[#7dd3fc]/10' :
                    'text-[#a1a1aa] bg-[#27272a]'
                  }`}>
                    {statusLabel(d.status)}
                  </span>
                  <ArrowRight size={14} className="text-[#52525b] group-hover:text-[#a1a1aa]" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
