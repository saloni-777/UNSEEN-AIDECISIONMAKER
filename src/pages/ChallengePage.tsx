import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Send, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { runChallengeRound, runChallengeSummary } from '@/lib/aiEngine';
import { ButtonSpinner, ErrorBanner } from '@/components/ui';
import type { ChallengeExchange, AnalysisResult, Decision, DecisionInput } from '@/types';

const MAX_ROUNDS = 5;

export function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState<ChallengeExchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [round, setRound] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<{
    originalReasoning: string;
    newConsideration: string;
    remainingUncertainty: string;
    whatToInvestigateNext: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  // Load decision
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

        // Restore existing challenge data if present
        if (d.challenge_data?.exchanges?.length > 0) {
          setExchanges(d.challenge_data.exchanges);
          setRound(d.challenge_data.exchanges.length);
          if (d.challenge_data.shiftSummary) {
            setShiftSummary(d.challenge_data.shiftSummary);
            setCompleted(true);
          } else if (d.challenge_data.exchanges.length >= MAX_ROUNDS) {
            setCompleted(true);
          } else {
            // Last question was already asked, waiting for answer
            const lastExchange = d.challenge_data.exchanges[d.challenge_data.exchanges.length - 1];
            if (lastExchange && !lastExchange.answer) {
              setCurrentQuestion(lastExchange.question);
            }
          }
        }
        setLoading(false);
      });
  }, [id]);

  const getInput = (): DecisionInput => {
    if (!decision) return { decision: '', options: [], context: '', reasoning: '', concerns: '', priorities: [], confidence: 3 };
    return {
      decision: decision.decision,
      options: decision.options || [],
      context: decision.context || '',
      reasoning: decision.reasoning || '',
      concerns: decision.concerns || '',
      priorities: decision.priorities || [],
      confidence: decision.confidence || 3,
    };
  };

  const getAnalysis = (): AnalysisResult => {
    return (decision?.analysis as AnalysisResult) || {} as AnalysisResult;
  };

  // Fetch first question
  const fetchQuestion = useCallback(async (currentExchanges: ChallengeExchange[], currentRound: number) => {
    setThinking(true);
    setError('');
    const { question, fallback } = await runChallengeRound(
      getInput(),
      currentExchanges,
      currentRound,
      getAnalysis()
    );
    setThinking(false);
    setIsFallback(fallback);
    setCurrentQuestion(question);

    // Save partial state
    const newExchanges = [...currentExchanges, { question, answer: '' }];
    setExchanges(newExchanges);
    await supabase
      .from('decisions')
      .update({ challenge_data: { exchanges: newExchanges, shiftSummary: null }, status: 'challenged' })
      .eq('id', id!);
  }, [decision, id]);

  // Auto-start: fetch first question if no exchanges
  useEffect(() => {
    if (decision && !loading && exchanges.length === 0 && !thinking && !completed && !error) {
      fetchQuestion([], 0);
    }
  }, [decision, loading, exchanges.length, thinking, completed, error, fetchQuestion]);

  const handleAnswer = async () => {
    if (!answer.trim() || thinking) return;
    setError('');

    const updatedExchanges = [...exchanges];
    updatedExchanges[round] = { ...updatedExchanges[round], answer: answer.trim() };
    setExchanges(updatedExchanges);
    setAnswer('');

    // Save
    await supabase
      .from('decisions')
      .update({ challenge_data: { exchanges: updatedExchanges, shiftSummary: null }, status: 'challenged' })
      .eq('id', id!);

    const nextRound = round + 1;

    if (nextRound >= MAX_ROUNDS) {
      // Generate summary
      setThinking(true);
      const { summary, fallback } = await runChallengeSummary(getInput(), updatedExchanges, getAnalysis());
      setThinking(false);
      setIsFallback(fallback);
      setShiftSummary(summary);
      setCompleted(true);

      await supabase
        .from('decisions')
        .update({
          challenge_data: { exchanges: updatedExchanges, shiftSummary: summary },
          status: 'challenged',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!);
    } else {
      setRound(nextRound);
      fetchQuestion(updatedExchanges, nextRound);
    }
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
        <ErrorBanner message={error} onRetry={() => navigate('/dashboard')} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link to={`/dashboard/analysis/${id}`} className="text-xs text-[#52525b] hover:text-[#a1a1aa] mb-3 inline-block">← Back to analysis</Link>
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#fcd34d]/20 bg-[#fcd34d]/5 text-xs text-[#fcd34d]">
            <Zap size={12} /> Challenge My Thinking
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{decision?.decision}</h1>
        <p className="text-sm text-[#a1a1aa] mt-2">One question at a time. No verdicts.</p>
      </motion.div>

      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-8">
        {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
              i < round ? 'bg-[#7dd3fc]' : i === round && !completed ? 'bg-[#7dd3fc]/50' : 'bg-[#27272a]'
            }`}
          />
        ))}
      </div>

      {/* Exchanges */}
      <div className="space-y-6 mb-6">
        <AnimatePresence>
          {exchanges.map((exchange, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Question */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/5 flex items-center justify-center shrink-0">
                  <Zap size={14} className="text-[#7dd3fc]" />
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Question {i + 1}</p>
                  <p className="text-sm text-[#f4f4f5] leading-relaxed">{exchange.question}</p>
                </div>
              </div>

              {/* Answer */}
              {exchange.answer && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 pl-11"
                >
                  <div className="flex-1 p-4 rounded-lg border border-[#27272a] bg-[#111113]">
                    <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Your answer</p>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">{exchange.answer}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Thinking indicator */}
      {thinking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 py-4"
        >
          <div className="w-8 h-8 rounded-full border border-[#27272a] bg-[#111113] flex items-center justify-center shrink-0">
            <Zap size={14} className="text-[#7dd3fc] animate-pulse" />
          </div>
          <p className="text-sm text-[#71717a]">UNSEEN is formulating its next question...</p>
        </motion.div>
      )}

      {/* Answer input */}
      {!completed && !thinking && currentQuestion && !exchanges[round]?.answer && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <textarea
            ref={inputRef}
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnswer(); }}
            className="input-field min-h-[100px] resize-y"
            placeholder="Take your time. What do you think?"
            rows={4}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#52525b]">⌘+Enter to send</p>
            <button
              onClick={handleAnswer}
              disabled={!answer.trim()}
              className="btn-primary"
            >
              {round + 1 >= MAX_ROUNDS ? <>See what shifted <ArrowRight size={16} /></> : <>Answer <Send size={14} /></>}
            </button>
          </div>
        </motion.div>
      )}

      {/* Completion: What Shifted? */}
      {completed && shiftSummary && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="surface-elevated p-6 md:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Check size={16} className="text-[#86efac]" />
              <h2 className="text-lg font-semibold tracking-tight">What Shifted?</h2>
            </div>
            <p className="text-xs text-[#71717a] mb-6">A reflection on how your thinking may have moved.</p>

            <div className="space-y-5">
              <ShiftBlock label="Original reasoning" value={shiftSummary.originalReasoning} />
              <div className="flex justify-center"><ArrowRight size={16} className="text-[#52525b]" /></div>
              <ShiftBlock label="New consideration" value={shiftSummary.newConsideration} />
              <div className="flex justify-center"><ArrowRight size={16} className="text-[#52525b]" /></div>
              <ShiftBlock label="Remaining uncertainty" value={shiftSummary.remainingUncertainty} />
              <div className="flex justify-center"><ArrowRight size={16} className="text-[#52525b]" /></div>
              <ShiftBlock label="What to investigate next" value={shiftSummary.whatToInvestigateNext} highlight />
            </div>
          </div>

          {isFallback && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#fcd34d]/20 bg-[#fcd34d]/5 text-xs text-[#fcd34d]">
              <AlertCircle size={12} /> AI-assisted reflection (fallback mode)
            </div>
          )}

          <div className="text-center pt-4">
            <p className="text-sm text-[#a1a1aa] mb-4 italic">UNSEEN doesn't choose your path. It helps you see the path more clearly.</p>
            <Link to={`/dashboard/analysis/${id}`} className="btn-secondary mr-3">
              Back to analysis
            </Link>
            <Link to="/dashboard/new" className="btn-primary">
              Save & reflect <ArrowRight size={16} />
            </Link>
          </div>

          <div className="pt-4 border-t border-[#27272a]/50">
            <p className="text-xs text-[#52525b] italic text-center">Your decision stays yours.</p>
          </div>
        </motion.div>
      )}

      {!completed && (
        <div className="pt-4 border-t border-[#27272a]/50 mt-8">
          <p className="text-xs text-[#52525b] italic text-center">Round {Math.min(round + 1, MAX_ROUNDS)} of {MAX_ROUNDS} · No verdicts. No recommendations.</p>
        </div>
      )}
    </div>
  );
}

function ShiftBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'border-[#7dd3fc]/20 bg-[#7dd3fc]/5' : 'border-[#27272a] bg-[#0a0a0b]/50'}`}>
      <p className="text-[10px] uppercase tracking-wider text-[#52525b] mb-2">{label}</p>
      <p className={`text-sm leading-relaxed ${highlight ? 'text-[#f4f4f5]' : 'text-[#a1a1aa]'}`}>{value}</p>
    </div>
  );
}
