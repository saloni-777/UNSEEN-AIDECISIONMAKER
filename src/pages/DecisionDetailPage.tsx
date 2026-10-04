import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Plus, Eye, Zap, Check, AlertCircle, Trash2,
  Brain, Search, GitBranch, Lightbulb, HelpCircle, Sparkles, List, Scale
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ButtonSpinner, ErrorBanner } from '@/components/ui';
import { BlindSpotMap, NODE_TYPES } from '@/components/BlindSpotMap';
import { useAuth } from '@/context/AuthContext';
import type { Decision, AnalysisResult } from '@/types';

export function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('decisions')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Could not load this decision.');
          setLoading(false);
          return;
        }
        const d = data as Decision;
        setDecision(d);
        setReflection(d.reflection || '');
        if (d.status === 'completed') setSaved(true);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!decision) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from('decisions')
      .update({
        reflection,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', decision.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    setDecision({ ...decision, reflection, status: 'completed' });
  };

  const handleDelete = async () => {
    if (!decision) return;
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from('decisions')
      .delete()
      .eq('id', decision.id);

    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    navigate('/dashboard/decisions');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ButtonSpinner />
      </div>
    );
  }

  if (error && !decision) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorBanner message={error} onRetry={() => navigate('/dashboard/decisions')} />
      </div>
    );
  }

  if (!decision) return null;

  const analysis = decision.analysis as AnalysisResult;
  const hasAnalysis = analysis && analysis.assumptions;

  const counts: Record<string, number> = {
    options: (analysis as any)?.optionsAnalysis?.length || 0,
    tradeoffs: (analysis as any)?.tradeoffs?.length || 0,
    assumptions: analysis?.assumptions?.length || 0,
    evidenceGaps: analysis?.evidenceGaps?.length || 0,
    overlookedFactors: analysis?.overlookedFactors?.length || 0,
    reasoningTensions: analysis?.reasoningTensions?.length || 0,
    possibleBiases: analysis?.possibleBiases?.length || 0,
    perspectives: analysis?.alternativePerspectives ? 3 : 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/dashboard/decisions" className="text-xs text-[#52525b] hover:text-[#a1a1aa] mb-3 inline-block">← My decisions</Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{decision.decision}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {hasAnalysis && (
              <Link to={`/dashboard/analysis/${decision.id}`} className="btn-ghost text-xs">
                <Eye size={14} /> View audit
              </Link>
            )}
            {decision.status === 'analyzed' || decision.status === 'challenged' ? (
              <Link to={`/dashboard/challenge/${decision.id}`} className="btn-ghost text-xs">
                <Zap size={14} /> Challenge
              </Link>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-[#52525b] mt-2">
          {new Date(decision.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Your input summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="surface-card p-6"
      >
        <h2 className="text-sm font-medium text-[#f4f4f5] mb-4">Your reasoning</h2>
        <div className="space-y-4">
          {decision.options?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1.5">Options</p>
              <div className="flex flex-wrap gap-1.5">
                {decision.options.map((o) => (
                  <span key={o} className="chip chip-default text-[10px] py-1 px-2">{o}</span>
                ))}
              </div>
            </div>
          )}
          {decision.context && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Context</p>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">{decision.context}</p>
            </div>
          )}
          {decision.reasoning && (
            <div>
              <span className="label-badge label-user">User provided</span>
              <p className="text-sm text-[#a1a1aa] leading-relaxed mt-1.5">{decision.reasoning}</p>
            </div>
          )}
          {decision.concerns && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Concerns</p>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">{decision.concerns}</p>
            </div>
          )}
          {decision.priorities?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1.5">Priorities</p>
              <div className="flex flex-wrap gap-1.5">
                {decision.priorities.map((p) => (
                  <span key={p} className="chip chip-default text-[10px] py-1 px-2">{p}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Confidence</p>
            <p className="text-sm text-[#a1a1aa]">{decision.confidence}/5</p>
          </div>
        </div>
      </motion.div>

      {/* Blind Spot Map */}
      {hasAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="surface-card p-6"
        >
          <h2 className="text-sm font-medium text-[#a1a1aa] uppercase tracking-wider mb-4">Blind Spot Map</h2>
          <BlindSpotMap counts={counts} activeNode={activeNode} onSelect={(k) => setActiveNode(k || null)} />
        </motion.div>
      )}

      {/* Analysis summary */}
      {hasAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="surface-card p-6"
        >
          <h2 className="text-sm font-medium text-[#f4f4f5] mb-4">Audit findings</h2>
          <div className="space-y-4">
            <SummaryRow icon={List} label="Options Analysis" count={counts.options} items={(analysis as any)?.optionsAnalysis?.map((o: any) => o.option)} />
            <SummaryRow icon={Scale} label="Trade-offs" count={counts.tradeoffs} items={(analysis as any)?.tradeoffs?.map((t: any) => `${t.sideA} vs ${t.sideB}`)} />
            <SummaryRow icon={Brain} label="Assumptions" count={counts.assumptions} items={analysis.assumptions?.map((a) => a.title)} />
            <SummaryRow icon={Eye} label="Outside the Frame" count={counts.overlookedFactors} items={analysis.overlookedFactors?.map((f) => f.title)} />
            <SummaryRow icon={Search} label="Evidence Gaps" count={counts.evidenceGaps} items={analysis.evidenceGaps?.map((g) => g.missing)} />
            <SummaryRow icon={GitBranch} label="Tensions" count={counts.reasoningTensions} items={analysis.reasoningTensions?.map((t) => t.description)} />
            <SummaryRow icon={AlertCircle} label="Possible Biases" count={counts.possibleBiases} items={analysis.possibleBiases?.map((b) => b.name)} />
            <SummaryRow icon={Sparkles} label="Perspectives" count={3} items={['The Optimist', 'The Skeptic', 'Future You']} />
            <SummaryRow icon={HelpCircle} label="Questions" count={analysis.questions?.length || 0} items={analysis.questions?.map((q) => q.question)} />
            <SummaryRow icon={Lightbulb} label="Could Change Your Mind" count={analysis.evidenceThatCouldChangeMind?.length || 0} items={analysis.evidenceThatCouldChangeMind?.map((e) => e.evidence)} />
          </div>
          <div className="mt-4 pt-4 border-t border-[#27272a]">
            <Link to={`/dashboard/analysis/${decision.id}`} className="text-xs text-[#7dd3fc] hover:underline">
              View full audit →
            </Link>
          </div>
        </motion.div>
      )}

      {/* Challenge summary */}
      {decision.challenge_data?.exchanges?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="surface-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-[#fcd34d]" />
            <h2 className="text-sm font-medium text-[#f4f4f5]">Challenge My Thinking</h2>
          </div>
          <div className="space-y-3">
            {decision.challenge_data.exchanges.map((e, i) => (
              <div key={i} className="border-l-2 border-[#27272a] pl-4">
                <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-0.5">Q{i + 1}</p>
                <p className="text-sm text-[#f4f4f5]">{e.question}</p>
                {e.answer && <p className="text-sm text-[#a1a1aa] mt-1.5 pl-3 border-l border-[#27272a]">{e.answer}</p>}
              </div>
            ))}
          </div>
          {decision.challenge_data.shiftSummary && (
            <div className="mt-4 pt-4 border-t border-[#27272a] space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-[#52525b]">What shifted</p>
              <p className="text-sm text-[#a1a1aa]">{decision.challenge_data.shiftSummary.newConsideration}</p>
              <p className="text-sm text-[#71717a]">{decision.challenge_data.shiftSummary.whatToInvestigateNext}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* YOU DECIDE / Reflection */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="surface-elevated p-8"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">YOU DECIDE.</h2>
          <p className="text-sm text-[#a1a1aa] mt-2 italic font-serif text-base">
            UNSEEN doesn't choose your path. It helps you see the path more clearly.
          </p>
          <p className="text-xs text-[#86efac] mt-3 uppercase tracking-wider">Your decision stays yours.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-medium text-[#a1a1aa]">Your reflection (optional)</label>
          <textarea
            value={reflection}
            onChange={(e) => { setReflection(e.target.value); setSaved(false); }}
            className="input-field min-h-[120px] resize-y"
            placeholder="What did you learn? What will you investigate? What feels clearer now?"
            rows={5}
          />

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-[#86efac]"
            >
              <Check size={14} /> Reflection saved.
            </motion.div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link to="/dashboard/new" className="btn-secondary">
              <Plus size={16} /> Examine another
            </Link>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <ButtonSpinner /> : <><Save size={16} /> Save reflection</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete */}
      <div className="pt-4 border-t border-[#27272a]/50">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-[#fca5a5]/20 bg-[#fca5a5]/5">
            <p className="text-sm text-[#fca5a5]">Delete this decision permanently?</p>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-xs">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs text-[#fca5a5] underline hover:no-underline">
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-[#52525b] hover:text-[#fca5a5] flex items-center gap-1.5 transition-colors">
            <Trash2 size={12} /> Delete this decision
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, count, items }: { icon: typeof Brain; label: string; count: number; items?: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (count === 0) return null;

  return (
    <div>
      <button
        onClick={() => items && setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-[#52525b]" />
          <span className="text-sm text-[#a1a1aa]">{label}</span>
        </div>
        <span className="text-xs text-[#52525b] tabular-nums">{count}</span>
      </button>
      {expanded && items && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 pl-6 space-y-1.5"
        >
          {items.map((item, i) => (
            <p key={i} className="text-xs text-[#71717a] leading-relaxed">· {item}</p>
          ))}
        </motion.div>
      )}
    </div>
  );
}
