import { supabase } from '@/lib/supabase';
import type { AnalysisResult, DecisionInput, ChallengeExchange } from '@/types';
import { generateFallbackAnalysis, generateFallbackChallenge, generateFallbackShiftSummary } from '@/lib/fallbackEngine';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reasoning-audit`;

interface AuditResponse {
  analysis?: AnalysisResult;
  error?: string;
  fallback?: boolean;
}

export async function runReasoningAudit(input: DecisionInput): Promise<{ analysis: AnalysisResult; fallback: boolean }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action: 'audit', input }),
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const data: AuditResponse = await response.json();

    if (data.analysis) {
      return { analysis: data.analysis, fallback: data.fallback ?? false };
    }

    throw new Error(data.error || 'No analysis returned');
  } catch {
    const analysis = generateFallbackAnalysis(input);
    return { analysis, fallback: true };
  }
}

interface ChallengeResponse {
  question?: string;
  rationale?: string;
  shiftSummary?: {
    originalReasoning: string;
    newConsideration: string;
    remainingUncertainty: string;
    whatToInvestigateNext: string;
  };
  error?: string;
  fallback?: boolean;
}

export async function runChallengeRound(
  input: DecisionInput,
  exchanges: ChallengeExchange[],
  round: number,
  analysis: AnalysisResult
): Promise<{ question: string; fallback: boolean }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action: 'challenge', input, exchanges, round, analysis }),
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const data: ChallengeResponse = await response.json();

    if (data.question) {
      return { question: data.question, fallback: data.fallback ?? false };
    }

    throw new Error(data.error || 'No question returned');
  } catch {
    const result = generateFallbackChallenge(exchanges, input, round);
    return { question: result.question, fallback: true };
  }
}

export async function runChallengeSummary(
  input: DecisionInput,
  exchanges: ChallengeExchange[],
  analysis: AnalysisResult
): Promise<{ summary: NonNullable<ChallengeResponse['shiftSummary']>; fallback: boolean }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action: 'challenge_summary', input, exchanges, analysis }),
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const data: ChallengeResponse = await response.json();

    if (data.shiftSummary) {
      return { summary: data.shiftSummary, fallback: false };
    }

    throw new Error(data.error || 'No summary returned');
  } catch {
    const summary = generateFallbackShiftSummary(exchanges, input);
    return { summary, fallback: true };
  }
}
