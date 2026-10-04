import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Brain, Search, GitBranch, Eye, Zap, ChevronDown, ChevronUp,
  Lightbulb, HelpCircle, AlertCircle, Quote, Sparkles, Scale, List, TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { runReasoningAudit } from '@/lib/aiEngine';
import { BlindSpotMap, NODE_TYPES } from '@/components/BlindSpotMap';
import { ErrorBanner, ButtonSpinner } from '@/components/ui';
import type { AnalysisResult, Decision, DecisionInput } from '@/types';

const LOADING_STEPS = [
  'Reading your reasoning...',
  'Mapping assumptions...',
  'Looking for missing pieces...',
  'Testing tensions...',
  'Changing the lens...',
];

export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['assumptions']));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!id) return;
    supabase
      .from('decisions')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoadError('Could not load this decision.');
          setLoading(false);
          return;
        }
        const d = data as Decision;
        setDecision(d);
        if (d.analysis && (d.analysis as any).assumptions) {
          setAnalysis(d.analysis as AnalysisResult);
          setIsFallback(false);
        }
        setLoading(false);
      });
  }, [id]);

  const runAudit = useCallback(async () => {
    if (!decision) return;
    setAuditLoading(true);
    setAuditError('');
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 800);

    const input: DecisionInput = {
      decision: decision.decision,
      options: decision.options || [],
      context: decision.context || '',
      reasoning: decision.reasoning || '',
      concerns: decision.concerns || '',
      priorities: decision.priorities || [],
      confidence: decision.confidence || 3,
    };

    const { analysis: result, fallback } = await runReasoningAudit(input);

    clearInterval(stepInterval);
    setAnalysis(result);
    setIsFallback(fallback);
    setAuditLoading(false);

    await supabase
      .from('decisions')
      .update({ analysis: result as any, status: 'analyzed', updated_at: new Date().toISOString() })
      .eq('id', decision.id);
  }, [decision]);

  useEffect(() => {
    if (decision && !analysis && !auditLoading && !loadError) {
      runAudit();
    }
  }, [decision, analysis, auditLoading, loadError, runAudit]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorBanner message={loadError} onRetry={() => navigate('/dashboard')} />
      </div>
    );
  }

  if (loading || !decision) {
    return (
      <div className="flex items-center justify-center py-20">
        <ButtonSpinner />
      </div>
    );
  }

  if (auditLoading || (!analysis && !auditError)) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-[#27272a] bg-[#111113] mb-8 relative"
          >
            <Eye size={28} className="text-[#7dd3fc]" strokeWidth={1.2} />
            <div className="absolute inset-0 rounded-2xl border border-[#7dd3fc]/20 animate-pulse-slow" />
          </motion.div>

          <h2 className="text-xl font-semibold tracking-tight mb-2">THE UNSEEN</h2>
          <p className="text-sm text-[#71717a] mb-10">Analyzing your reasoning without making your decision.</p>

          <div className="space-y-3 max-w-xs mx-auto">
            {LOADING_STEPS.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= loadingStep ? 1 : 0.3, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 text-sm"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${i < loadingStep ? 'bg-[#86efac]' : i === loadingStep ? 'bg-[#7dd3fc] animate-pulse' : 'bg-[#27272a]'}`} />
                <span className={i <= loadingStep ? 'text-[#a1a1aa]' : 'text-[#52525b]'}>{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (auditError && !analysis) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <ErrorBanner message={auditError} onRetry={runAudit} />
      </div>
    );
  }

  if (!analysis) return null;

  const counts: Record<string, number> = {
    options: analysis.optionsAnalysis?.length || 0,
    tradeoffs: analysis.tradeoffs?.length || 0,
    assumptions: analysis.assumptions?.length || 0,
    evidenceGaps: analysis.evidenceGaps?.length || 0,
    overlookedFactors: analysis.overlookedFactors?.length || 0,
    reasoningTensions: analysis.reasoningTensions?.length || 0,
    possibleBiases: analysis.possibleBiases?.length || 0,
    perspectives: analysis.alternativePerspectives ? 3 : 0,
  };

  const sections: { key: string; label: string; icon: typeof Brain; items: any[]; render: (item: any, i: number) => React.ReactNode }[] = [
    {
      key: 'assumptions',
      label: 'Assumptions',
      icon: Brain,
      items: analysis.assumptions || [],
      render: (a, i) => (
        <FindingCard key={i}>
          <FindingLabel label="AI INFERENCE" type="ai" />
          <FindingTitle>{a.title}</FindingTitle>
          <FindingText>{a.explanation}</FindingText>
          <FindingMeta label="Why it matters" value={a.whyItMatters} />
          <FindingMeta label="How to test" value={a.howToTest} />
        </FindingCard>
      ),
    },
    {
      key: 'overlookedFactors',
      label: 'Outside the Frame',
      icon: Eye,
      items: analysis.overlookedFactors || [],
      render: (f, i) => (
        <FindingCard key={i}>
          <FindingLabel label="AI INFERENCE" type="ai" />
          <FindingTitle>{f.title}</FindingTitle>
          <FindingText>{f.explanation}</FindingText>
          <FindingMeta label="Why it matters" value={f.whyItMatters} />
        </FindingCard>
      ),
    },
    {
      key: 'evidenceGaps',
      label: 'Evidence Gaps',
      icon: Search,
      items: analysis.evidenceGaps || [],
      render: (g, i) => (
        <FindingCard key={i}>
          <FindingLabel label="UNCERTAINTY" type="uncertain" />
          <FindingTitle>{g.missing}</FindingTitle>
          <FindingMeta label="Why it matters" value={g.whyItMatters} />
          <FindingMeta label="How to verify" value={g.howToVerify} />
        </FindingCard>
      ),
    },
    {
      key: 'reasoningTensions',
      label: 'Reasoning Tensions',
      icon: GitBranch,
      items: analysis.reasoningTensions || [],
      render: (t, i) => (
        <FindingCard key={i}>
          <FindingLabel label="AI INFERENCE" type="ai" />
          <FindingTitle>{t.description}</FindingTitle>
          <FindingText>{t.conflict}</FindingText>
          <FindingMeta label="Reflection" value={t.reflection} />
        </FindingCard>
      ),
    },
    {
      key: 'possibleBiases',
      label: 'Possible Biases',
      icon: AlertCircle,
      items: analysis.possibleBiases || [],
      render: (b, i) => (
        <FindingCard key={i}>
          <FindingLabel label="AI INFERENCE" type="ai" />
          <FindingTitle>{b.name}</FindingTitle>
          <FindingText>{b.evidence}</FindingText>
          <FindingMeta label="Reflection" value={b.reflection} />
        </FindingCard>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/dashboard" className="text-xs text-[#52525b] hover:text-[#a1a1aa] mb-3 inline-block">← Back to dashboard</Link>
        <h1 className="text-2xl font-semibold tracking-tight">{decision.decision}</h1>
        {isFallback && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#fcd34d]/20 bg-[#fcd34d]/5 text-xs text-[#fcd34d]">
            <AlertCircle size={12} /> AI-assisted reflection (fallback mode) · <button onClick={runAudit} className="underline hover:no-underline">Retry AI</button>
          </div>
        )}
      </motion.div>

      {/* Decision Framing */}
      {analysis.decisionFraming && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="surface-card p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-[#7dd3fc]" />
            <h2 className="text-sm font-medium text-[#f4f4f5]">How UNSEEN frames this</h2>
            <span className="label-badge label-ai ml-1">AI INFERENCE</span>
          </div>
          <p className="text-base text-[#a1a1aa] leading-relaxed font-serif italic text-lg">{analysis.decisionFraming}</p>
        </motion.div>
      )}

      {/* What Matters + Before/After */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="surface-card p-6"
      >
        <h2 className="text-sm font-medium text-[#f4f4f5] mb-4">What matters to you</h2>
        {decision.priorities?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {decision.priorities.map((p) => (
              <span key={p} className="chip chip-default text-xs">{p}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#71717a]">No priorities selected.</p>
        )}
        <div className="mt-6 pt-6 border-t border-[#27272a] grid sm:grid-cols-2 gap-4">
          <div>
            <span className="label-badge label-user">Your reasoning</span>
            <p className="mt-2 text-sm text-[#a1a1aa] leading-relaxed">{decision.reasoning || 'Not provided.'}</p>
          </div>
          {analysis.currentThinking && (
            <div>
              <span className="label-badge label-ai">What it emphasizes</span>
              <p className="mt-2 text-sm text-[#a1a1aa] leading-relaxed">{analysis.currentThinking}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Blind Spot Map */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="surface-card p-6 md:p-8"
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <BlindSpotMap counts={counts} activeNode={activeNode} onSelect={(k) => {
            setActiveNode(k || null);
            if (k) {
              setExpandedSections(new Set([k]));
              setTimeout(() => {
                document.getElementById(`section-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          }} />
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-[#a1a1aa] uppercase tracking-wider">Blind Spot Map</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Each node represents a dimension of your reasoning. Click any node to focus on that analysis.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {NODE_TYPES.map((node) => (
                <button
                  key={node.key}
                  onClick={() => {
                    setActiveNode(node.key);
                    setExpandedSections(new Set([node.key]));
                    document.getElementById(`section-${node.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                    activeNode === node.key
                      ? 'border-[#7dd3fc]/30 bg-[#7dd3fc]/5 text-[#f4f4f5]'
                      : 'border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-[#f4f4f5]'
                  }`}
                >
                  <span>{node.label}</span>
                  <span className="font-mono tabular-nums text-[#52525b]">{counts[node.key] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Options Analysis */}
      {analysis.optionsAnalysis && analysis.optionsAnalysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          id="section-options"
          className={`surface-card overflow-hidden transition-all duration-300 ${activeNode === 'options' ? 'border-[#7dd3fc]/30' : ''}`}
        >
          <button
            onClick={() => toggleSection('options')}
            className="w-full flex items-center justify-between p-5 hover:bg-[#18181b]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <List size={16} className={activeNode === 'options' ? 'text-[#7dd3fc]' : 'text-[#a1a1aa]'} />
              <span className="text-sm font-medium text-[#f4f4f5]">Options Analysis</span>
              <span className="text-xs text-[#52525b] tabular-nums">({analysis.optionsAnalysis.length})</span>
            </div>
            {expandedSections.has('options') ? <ChevronUp size={16} className="text-[#52525b]" /> : <ChevronDown size={16} className="text-[#52525b]" />}
          </button>
          <AnimatePresence>
            {expandedSections.has('options') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4">
                  {analysis.optionsAnalysis.map((opt, i) => (
                    <div key={i} className="p-4 rounded-lg border border-[#27272a] bg-[#0a0a0b]/50">
                      <h3 className="text-sm font-medium text-[#f4f4f5] mb-3">{opt.option}</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#86efac] mb-1.5">Potential advantages</p>
                          <ul className="space-y-1">
                            {opt.advantages?.map((a, j) => <li key={j} className="text-xs text-[#a1a1aa] leading-relaxed">· {a}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#fcd34d] mb-1.5">Trade-offs</p>
                          <ul className="space-y-1">
                            {opt.tradeoffs?.map((t, j) => <li key={j} className="text-xs text-[#a1a1aa] leading-relaxed">· {t}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#fca5a5] mb-1.5">Risks</p>
                          <ul className="space-y-1">
                            {opt.risks?.map((r, j) => <li key={j} className="text-xs text-[#a1a1aa] leading-relaxed">· {r}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#7dd3fc] mb-1.5">Unknowns</p>
                          <ul className="space-y-1">
                            {opt.unknowns?.map((u, j) => <li key={j} className="text-xs text-[#a1a1aa] leading-relaxed">· {u}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#27272a]/50">
                        <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Priority alignment</p>
                        <p className="text-sm text-[#a1a1aa] leading-relaxed">{opt.priorityAlignment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Trade-offs */}
      {analysis.tradeoffs && analysis.tradeoffs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          id="section-tradeoffs"
          className={`surface-card p-6 transition-all duration-300 ${activeNode === 'tradeoffs' ? 'border-[#7dd3fc]/30' : ''}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Scale size={16} className="text-[#fcd34d]" />
            <h2 className="text-sm font-medium text-[#f4f4f5]">Trade-offs</h2>
          </div>
          <p className="text-xs text-[#71717a] mb-5">Competing tensions in your decision. Neither side is right — the point is to see both.</p>
          <div className="space-y-4">
            {analysis.tradeoffs.map((t, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-6">
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-[#f4f4f5]">{t.sideA}</p>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <Scale size={18} className="text-[#52525b]" />
                  <span className="text-[9px] text-[#52525b] uppercase tracking-wider">vs</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#f4f4f5]">{t.sideB}</p>
                </div>
              </div>
            ))}
          </div>
          {analysis.tradeoffs[0]?.explanation && (
            <p className="mt-4 pt-4 border-t border-[#27272a]/50 text-xs text-[#71717a] leading-relaxed">{analysis.tradeoffs[0].explanation}</p>
          )}
        </motion.div>
      )}

      {/* Evidence: What you know / don't know / should verify */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-card p-6"
      >
        <h2 className="text-sm font-medium text-[#f4f4f5] mb-4">What you know · What you don't</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <span className="label-badge label-user mb-2 inline-block">What you know</span>
            <p className="text-sm text-[#a1a1aa] leading-relaxed mt-2">{decision.context || 'You did not share specific context.'}</p>
          </div>
          <div>
            <span className="label-badge label-uncertain mb-2 inline-block">What you don't know</span>
            <ul className="mt-2 space-y-1.5">
              {analysis.evidenceGaps?.slice(0, 3).map((g, i) => (
                <li key={i} className="text-sm text-[#a1a1aa] leading-relaxed">· {g.missing}</li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Thinking Landscape */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-card p-6"
      >
        <h2 className="text-sm font-medium text-[#f4f4f5] mb-1">Thinking Landscape</h2>
        <p className="text-xs text-[#71717a] mb-4">AI-generated reflection indicators — not objective measurements.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Assumptions', value: analysis.reflectionIndicators?.assumptions ?? 0 },
            { label: 'Evidence Gaps', value: analysis.reflectionIndicators?.evidenceGaps ?? 0 },
            { label: 'Overlooked', value: analysis.reflectionIndicators?.overlookedFactors ?? 0 },
            { label: 'Tensions', value: analysis.reflectionIndicators?.tensions ?? 0 },
            { label: 'Uncertainty', value: analysis.reflectionIndicators?.uncertainty ?? '—', isText: true },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-lg border border-[#27272a]">
              <p className={`font-semibold ${item.isText ? 'text-xs' : 'text-xl'} ${item.isText ? 'text-[#fcd34d]' : 'text-[#f4f4f5]'}`}>{item.value}</p>
              <p className="text-[10px] text-[#52525b] mt-1 uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Findings sections */}
      {sections.map((section) => (
        <motion.div
          key={section.key}
          id={`section-${section.key}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`surface-card overflow-hidden transition-all duration-300 ${activeNode === section.key ? 'border-[#7dd3fc]/30' : ''}`}
        >
          <button
            onClick={() => toggleSection(section.key)}
            className="w-full flex items-center justify-between p-5 hover:bg-[#18181b]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <section.icon size={16} className={activeNode === section.key ? 'text-[#7dd3fc]' : 'text-[#a1a1aa]'} />
              <span className="text-sm font-medium text-[#f4f4f5]">{section.label}</span>
              <span className="text-xs text-[#52525b] tabular-nums">({section.items.length})</span>
            </div>
            {expandedSections.has(section.key) ? <ChevronUp size={16} className="text-[#52525b]" /> : <ChevronDown size={16} className="text-[#52525b]" />}
          </button>
          <AnimatePresence>
            {expandedSections.has(section.key) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
                  {section.items.length === 0 ? (
                    <p className="text-sm text-[#71717a] py-4">No findings in this category.</p>
                  ) : (
                    section.items.map((item, i) => section.render(item, i))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Change the Lens */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        id="section-perspectives"
        className="surface-card p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-[#a78bfa]" />
          <h2 className="text-sm font-medium text-[#f4f4f5]">Change the Lens</h2>
        </div>
        <p className="text-xs text-[#71717a] mb-5">Three perspectives that challenge your framing differently.</p>
        <div className="space-y-4">
          {[
            { name: 'THE OPTIMIST', text: analysis.alternativePerspectives?.optimist, color: '#86efac' },
            { name: 'THE SKEPTIC', text: analysis.alternativePerspectives?.skeptic, color: '#fca5a5' },
            { name: 'FUTURE YOU', text: analysis.alternativePerspectives?.futureYou, color: '#a78bfa' },
          ].map((p) => (
            <div key={p.name} className="border-l-2 pl-4" style={{ borderColor: `${p.color}40` }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: p.color }}>{p.name}</span>
              <p className="mt-1.5 text-sm text-[#a1a1aa] leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Questions Worth Asking */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        id="section-questions"
        className="surface-card p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={16} className="text-[#7dd3fc]" />
          <h2 className="text-sm font-medium text-[#f4f4f5]">Questions Worth Asking</h2>
        </div>
        <p className="text-xs text-[#71717a] mb-5">Five high-value questions surfaced by the analysis.</p>
        <div className="space-y-3">
          {analysis.questions?.map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-xs text-[#52525b] font-mono tabular-nums shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="text-sm text-[#f4f4f5]">{q.question}</p>
                <p className="text-xs text-[#71717a] mt-1">{q.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* What Could Change Your Mind */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-card p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={16} className="text-[#fcd34d]" />
          <h2 className="text-sm font-medium text-[#f4f4f5]">What Could Change Your Mind?</h2>
        </div>
        <p className="text-xs text-[#71717a] mb-5">Three pieces of evidence that could materially shift your reasoning.</p>
        <div className="space-y-3">
          {analysis.evidenceThatCouldChangeMind?.map((e, i) => (
            <div key={i} className="flex gap-3">
              <Quote size={14} className="text-[#52525b] shrink-0 mt-1" />
              <div>
                <p className="text-sm text-[#f4f4f5]">{e.evidence}</p>
                <p className="text-xs text-[#71717a] mt-1">{e.whyItWouldChange}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Before → After */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-elevated p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-[#7dd3fc]" />
          <h2 className="text-sm font-medium text-[#f4f4f5]">How your thinking expanded</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <span className="label-badge label-user mb-2 inline-block">Before</span>
            <p className="mt-2 text-sm text-[#a1a1aa] leading-relaxed">{analysis.currentThinking || decision.reasoning || 'Your initial reasoning'}</p>
          </div>
          <div>
            <span className="label-badge label-ai mb-2 inline-block">Now visible</span>
            <p className="mt-2 text-sm text-[#a1a1aa] leading-relaxed">
              {analysis.remainingUncertainty || 'Additional considerations have surfaced that warrant investigation.'}
            </p>
          </div>
        </div>
        <p className="mt-4 pt-4 border-t border-[#27272a]/50 text-xs text-[#71717a] italic">
          UNSEEN does not claim to have improved your decision. It helped surface additional considerations.
        </p>
      </motion.div>

      {/* Challenge CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-elevated p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-[#fcd34d]/20 bg-[#fcd34d]/5 mb-4">
          <Zap size={20} className="text-[#fcd34d]" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">Challenge My Thinking</h2>
        <p className="text-sm text-[#a1a1aa] max-w-sm mx-auto mb-6">
          One question at a time. No verdicts. The AI adapts to your answers.
        </p>
        <button
          onClick={() => navigate(`/dashboard/challenge/${decision.id}`)}
          className="btn-primary"
        >
          Start challenge <ArrowRight size={16} />
        </button>
      </motion.div>

      <div className="pt-4 border-t border-[#27272a]/50">
        <p className="text-xs text-[#52525b] italic text-center">UNSEEN challenges your reasoning, not your autonomy.</p>
      </div>
    </div>
  );
}

function FindingCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 rounded-lg border border-[#27272a] bg-[#0a0a0b]/50"
    >
      {children}
    </motion.div>
  );
}

function FindingLabel({ label, type }: { label: string; type: 'ai' | 'uncertain' }) {
  return (
    <span className={`label-badge ${type === 'ai' ? 'label-ai' : 'label-uncertain'}`}>{label}</span>
  );
}

function FindingTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-medium text-[#f4f4f5] mt-2">{children}</h3>;
}

function FindingText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#a1a1aa] mt-1.5 leading-relaxed">{children}</p>;
}

function FindingMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-[#27272a]/50">
      <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">{label}</p>
      <p className="text-sm text-[#a1a1aa] leading-relaxed">{value}</p>
    </div>
  );
}
