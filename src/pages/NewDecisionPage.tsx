import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles, Zap } from 'lucide-react';
import { PRIORITY_OPTIONS, EXAMPLE_DECISION } from '@/lib/exampleData';
import { supabase } from '@/lib/supabase';
import { ButtonSpinner } from '@/components/ui';
import type { DecisionInput } from '@/types';

const STEPS = [
  { title: 'What are you deciding?', hint: 'State the decision as a clear question.', field: 'decision', type: 'text' },
  { title: 'What options are on the table?', hint: 'List the choices you are considering.', field: 'options', type: 'options' },
  { title: 'What do you know?', hint: 'Share the facts and context you have.', field: 'context', type: 'textarea' },
  { title: 'Why are you leaning this way?', hint: 'Explain your current reasoning.', field: 'reasoning', type: 'textarea' },
  { title: 'What are you worried about?', hint: 'Name your concerns and fears.', field: 'concerns', type: 'textarea' },
  { title: 'What matters most?', hint: 'Select your priorities.', field: 'priorities', type: 'priorities' },
  { title: 'How certain do you feel?', hint: 'Rate your confidence level.', field: 'confidence', type: 'confidence' },
];

export function NewDecisionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExample = searchParams.get('example') === 'true';
  const isChallenge = searchParams.get('challenge') === 'true';

  const [step, setStep] = useState(0);
  const [input, setInput] = useState<DecisionInput>({
    decision: '',
    options: [],
    context: '',
    reasoning: '',
    concerns: '',
    priorities: [],
    confidence: 3,
  });
  const [optionText, setOptionText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load example data
  const loadExample = () => {
    setInput(EXAMPLE_DECISION);
    setStep(6);
  };

  // Challenge mode: skip to a quick form
  if (isChallenge && step === 0 && !input.decision) {
    return <ChallengeQuickStart input={input} setInput={setInput} onSave={async (d) => {
      setSaving(true);
      const { data, error: insertError } = await supabase
        .from('decisions')
        .insert({
          decision: d.decision,
          options: d.options,
          context: d.context,
          reasoning: d.reasoning,
          concerns: d.concerns,
          priorities: d.priorities,
          confidence: d.confidence,
          status: 'reflecting',
        })
        .select()
        .single();
      setSaving(false);
      if (insertError) { setError(insertError.message); return; }
      navigate(`/dashboard/challenge/${data.id}`);
    }} saving={saving} error={error} />;
  }

  if (isExample && step === 0 && !input.decision) {
    loadExample();
  }

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const togglePriority = (p: string) => {
    setInput((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter((x) => x !== p)
        : [...prev.priorities, p],
    }));
  };

  const addOption = () => {
    const trimmed = optionText.trim();
    if (trimmed && !input.options.includes(trimmed)) {
      setInput((prev) => ({ ...prev, options: [...prev.options, trimmed] }));
      setOptionText('');
    }
  };

  const removeOption = (opt: string) => {
    setInput((prev) => ({ ...prev, options: prev.options.filter((x) => x !== opt) }));
  };

  const canProceed = () => {
    if (currentStep.field === 'decision') return input.decision.trim().length > 0;
    if (currentStep.field === 'options') return input.options.length > 0;
    if (currentStep.field === 'priorities') return input.priorities.length > 0;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { data, error: insertError } = await supabase
      .from('decisions')
      .insert({
        decision: input.decision,
        options: input.options,
        context: input.context,
        reasoning: input.reasoning,
        concerns: input.concerns,
        priorities: input.priorities,
        confidence: input.confidence,
        status: 'reflecting',
      })
      .select()
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate(`/dashboard/analysis/${data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <Link to="/dashboard" className="text-xs text-[#52525b] hover:text-[#a1a1aa]">Cancel</Link>
          <span className="text-xs text-[#52525b] tabular-nums">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="h-0.5 bg-[#27272a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#7dd3fc]"
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{currentStep.title}</h2>
            <p className="text-sm text-[#a1a1aa] mt-1.5">{currentStep.hint}</p>
          </div>

          {currentStep.type === 'text' && (
            <input
              autoFocus
              type="text"
              value={input.decision}
              onChange={(e) => setInput((prev) => ({ ...prev, decision: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter' && canProceed() && !isLastStep) setStep(step + 1); }}
              className="input-field text-base"
              placeholder="e.g., Should I accept this job offer?"
            />
          )}

          {currentStep.type === 'options' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={optionText}
                  onChange={(e) => setOptionText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                  className="input-field flex-1"
                  placeholder="Type an option and press Enter"
                />
                <button onClick={addOption} className="btn-secondary px-4">Add</button>
              </div>
              {input.options.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {input.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => removeOption(opt)}
                      className="chip chip-active group"
                    >
                      {opt}
                      <span className="text-[#52525b] group-hover:text-[#0a0a0b] transition-colors">✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep.type === 'textarea' && (
            <textarea
              autoFocus
              value={(input as any)[currentStep.field]}
              onChange={(e) => setInput((prev) => ({ ...prev, [currentStep.field]: e.target.value }))}
              className="input-field text-base min-h-[120px] resize-y"
              placeholder={currentStep.field === 'context' ? 'e.g., The role pays well, involves relocation, and requires a 2-year commitment...' : currentStep.field === 'reasoning' ? 'e.g., I am leaning toward accepting because...' : 'e.g., I am worried about...'}
              rows={5}
            />
          )}

          {currentStep.type === 'priorities' && (
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={`chip ${input.priorities.includes(p) ? 'chip-active' : 'chip-default'}`}
                >
                  {input.priorities.includes(p) && <Check size={12} />}
                  {p}
                </button>
              ))}
            </div>
          )}

          {currentStep.type === 'confidence' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setInput((prev) => ({ ...prev, confidence: n }))}
                    className={`flex-1 h-14 rounded-lg border transition-all duration-200 ${
                      input.confidence >= n
                        ? 'bg-[#7dd3fc]/10 border-[#7dd3fc]'
                        : 'bg-[#111113] border-[#27272a] hover:border-[#3f3f46]'
                    }`}
                  >
                    <span className={`text-lg font-semibold ${input.confidence >= n ? 'text-[#7dd3fc]' : 'text-[#52525b]'}`}>{n}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#52525b] text-center">
                1 = completely uncertain · 5 = very confident
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-[#fca5a5]">{error}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="btn-ghost disabled:opacity-30"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {isLastStep ? (
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <ButtonSpinner /> : <>Run reasoning audit <ArrowRight size={16} /></>}
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="btn-primary"
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>

      {step === 0 && !isExample && (
        <div className="mt-6 pt-6 border-t border-[#27272a]/50">
          <button onClick={loadExample} className="text-sm text-[#71717a] hover:text-[#a78bfa] flex items-center gap-2 transition-colors">
            <Sparkles size={14} /> Or try with example data
          </button>
        </div>
      )}
    </div>
  );
}

function ChallengeQuickStart({
  input,
  setInput,
  onSave,
  saving,
  error,
}: {
  input: DecisionInput;
  setInput: React.Dispatch<React.SetStateAction<DecisionInput>>;
  onSave: (d: DecisionInput) => void;
  saving: boolean;
  error: string;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#fcd34d]/20 bg-[#fcd34d]/5 text-xs text-[#fcd34d] mb-4">
            <Zap size={12} /> Challenge Mode
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">What are you examining?</h2>
          <p className="text-sm text-[#a1a1aa] mt-1.5">Tell us about your decision, then we'll challenge your thinking directly.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Decision</label>
            <input
              autoFocus
              type="text"
              value={input.decision}
              onChange={(e) => setInput((prev) => ({ ...prev, decision: e.target.value }))}
              className="input-field text-base"
              placeholder="e.g., Should I accept this job offer?"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Your reasoning</label>
            <textarea
              value={input.reasoning}
              onChange={(e) => setInput((prev) => ({ ...prev, reasoning: e.target.value }))}
              className="input-field min-h-[100px] resize-y"
              placeholder="Why are you leaning this way?"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Priorities (optional)</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput((prev) => ({
                    ...prev,
                    priorities: prev.priorities.includes(p)
                      ? prev.priorities.filter((x) => x !== p)
                      : [...prev.priorities, p],
                  }))}
                  className={`chip ${input.priorities.includes(p) ? 'chip-active' : 'chip-default'}`}
                >
                  {input.priorities.includes(p) && <Check size={12} />}
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[#fca5a5]">{error}</p>}

        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="btn-ghost">Cancel</Link>
          <button
            onClick={() => onSave(input)}
            disabled={!input.decision.trim() || saving}
            className="btn-primary"
          >
            {saving ? <ButtonSpinner /> : <>Start challenge <ArrowRight size={16} /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
