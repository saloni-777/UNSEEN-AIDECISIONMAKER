export interface DecisionInput {
  decision: string;
  options: string[];
  context: string;
  reasoning: string;
  concerns: string;
  priorities: string[];
  confidence: number;
}

export interface OptionAnalysis {
  option: string;
  advantages: string[];
  tradeoffs: string[];
  risks: string[];
  unknowns: string[];
  priorityAlignment: string;
}

export interface Tradeoff {
  sideA: string;
  sideB: string;
  explanation: string;
}

export interface Assumption {
  title: string;
  explanation: string;
  whyItMatters: string;
  howToTest: string;
}

export interface OverlookedFactor {
  title: string;
  explanation: string;
  whyItMatters: string;
}

export interface EvidenceGap {
  missing: string;
  whyItMatters: string;
  howToVerify: string;
}

export interface ReasoningTension {
  description: string;
  conflict: string;
  reflection: string;
}

export interface PossibleBias {
  name: string;
  evidence: string;
  reflection: string;
}

export interface AlternativePerspectives {
  optimist: string;
  skeptic: string;
  futureYou: string;
}

export interface Question {
  question: string;
  rationale: string;
}

export interface EvidenceThatCouldChangeMind {
  evidence: string;
  whyItWouldChange: string;
}

export interface ReflectionIndicators {
  assumptions: number;
  evidenceGaps: number;
  overlookedFactors: number;
  tensions: number;
  uncertainty: string;
}

export interface AnalysisResult {
  decisionFraming: string;
  optionsAnalysis: OptionAnalysis[];
  tradeoffs: Tradeoff[];
  assumptions: Assumption[];
  overlookedFactors: OverlookedFactor[];
  evidenceGaps: EvidenceGap[];
  reasoningTensions: ReasoningTension[];
  possibleBiases: PossibleBias[];
  alternativePerspectives: AlternativePerspectives;
  questions: Question[];
  evidenceThatCouldChangeMind: EvidenceThatCouldChangeMind[];
  currentThinking: string;
  remainingUncertainty: string;
  reflectionIndicators: ReflectionIndicators;
}

export interface ChallengeExchange {
  question: string;
  answer: string;
}

export interface ChallengeData {
  exchanges: ChallengeExchange[];
  shiftSummary: {
    originalReasoning: string;
    newConsideration: string;
    remainingUncertainty: string;
    whatToInvestigateNext: string;
  } | null;
}

export interface Decision {
  id: string;
  user_id: string;
  decision: string;
  options: string[];
  context: string;
  reasoning: string;
  concerns: string;
  priorities: string[];
  confidence: number;
  analysis: AnalysisResult;
  challenge_data: ChallengeData;
  reflection: string;
  status: string;
  created_at: string;
  updated_at: string;
}
