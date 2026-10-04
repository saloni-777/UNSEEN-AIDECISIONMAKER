import type { AnalysisResult, DecisionInput, Assumption, EvidenceGap, OverlookedFactor, ReasoningTension, PossibleBias, Question, OptionAnalysis, Tradeoff } from '@/types';

const THEME_MAP: Record<string, string[]> = {
  money: ['financial', 'stipend', 'salary', 'cost', 'pay', 'income', 'budget', 'afford', 'price'],
  time: ['time', 'schedule', 'deadline', 'duration', 'weeks', 'months', 'years', 'commitment'],
  risk: ['risk', 'safe', 'danger', 'uncertain', 'bet', 'exposure'],
  learning: ['learn', 'learning', 'skill', 'grow', 'knowledge', 'education', 'academic'],
  career: ['career', 'job', 'work', 'professional', 'industry', 'experience', 'internship'],
  relationships: ['relationship', 'family', 'friends', 'team', 'people', 'social'],
  health: ['health', 'wellness', 'stress', 'sleep', 'burnout', 'mental'],
  convenience: ['convenient', 'close', 'easy', 'commute', 'near', 'home'],
  opportunityCost: ['opportunity', 'miss', 'give up', 'forgo', 'trade', 'alternative'],
  longTermImpact: ['future', 'long-term', 'impact', 'consequence', 'lasting'],
  reversibility: ['reversible', 'irreversible', 'undo', 'permanent', 'commit'],
  uncertainty: ['unclear', 'uncertain', 'unknown', 'maybe', 'might', 'possibly'],
};

const OVERLOOKED_THEMES = [
  { theme: 'opportunityCost', title: 'Opportunity Cost', explanation: 'Every choice you make implicitly closes other doors. What are you giving up by choosing this path?', whyItMatters: 'Understanding what you are forgoing helps you weigh whether the chosen path is truly worth it.' },
  { theme: 'reversibility', title: 'Reversibility', explanation: 'Some decisions are one-way doors. How reversible is this decision if it turns out differently than expected?', whyItMatters: 'Irreversible decisions deserve far more scrutiny than reversible ones, which can be made faster.' },
  { theme: 'longTermImpact', title: 'Long-Term Impact', explanation: 'The immediate benefits may be clear, but how will this decision affect you in 1, 3, or 5 years?', whyItMatters: 'Short-term thinking often overshadows compounding effects that matter more over time.' },
  { theme: 'relationships', title: 'Relationship Dynamics', explanation: 'This decision may affect people around you in ways that are not immediately visible.', whyItMatters: 'Interpersonal consequences are often underestimated and can reshape the decision\'s true cost.' },
  { theme: 'health', title: 'Wellbeing and Stress', explanation: 'The demands of this path may have hidden costs to your physical or mental wellbeing.', whyItMatters: 'Health costs are often invisible until they accumulate, and they compound silently.' },
];

function detectThemes(input: DecisionInput): string[] {
  const fullText = `${input.decision} ${input.options.join(' ')} ${input.context} ${input.reasoning} ${input.concerns} ${input.priorities.join(' ')}`.toLowerCase();
  const detected: string[] = [];
  for (const [theme, keywords] of Object.entries(THEME_MAP)) {
    if (keywords.some((kw) => fullText.includes(kw))) {
      detected.push(theme);
    }
  }
  return detected;
}

function generateOptionsAnalysis(input: DecisionInput): OptionAnalysis[] {
  return input.options.map((option) => {
    const opt = option.toLowerCase();
    const advantages: string[] = [];
    const tradeoffs: string[] = [];
    const risks: string[] = [];
    const unknowns: string[] = [];

    if (opt.includes('accept') || opt.includes('yes') || opt.includes('go')) {
      advantages.push('Provides direct experience in the field');
      advantages.push('Immediate engagement with the opportunity');
      tradeoffs.push('Requires time commitment that may compete with other priorities');
      tradeoffs.push('May limit flexibility during the commitment period');
      risks.push('The experience may not match expectations');
      unknowns.push('Quality of mentorship and day-to-day work');
      unknowns.push('Actual time demands and schedule');
    } else if (opt.includes('reject') || opt.includes('no') || opt.includes('decline')) {
      advantages.push('Preserves full control over your time and priorities');
      advantages.push('Avoids the risks associated with the commitment');
      tradeoffs.push('Forfeits the potential benefits and experience');
      tradeoffs.push('May create regret if the opportunity was valuable');
      risks.push('Missing an opportunity that may not recur');
      unknowns.push('Whether a similar opportunity will arise later');
    } else if (opt.includes('flex') || opt.includes('negotiate') || opt.includes('ask')) {
      advantages.push('Allows you to shape the terms before committing');
      advantages.push('Demonstrates proactive communication');
      tradeoffs.push('May delay the decision or create friction');
      tradeoffs.push('The other party may not accommodate');
      risks.push('Negotiation may change the relationship dynamics');
      unknowns.push('What terms are actually flexible');
    } else {
      advantages.push('Addresses some of your stated priorities');
      tradeoffs.push('Involves trade-offs that need careful examination');
      risks.push('Outcomes depend on factors you may not fully control');
      unknowns.push('Specific conditions and expectations');
    }

    const priorityAlignment = input.priorities.length > 0
      ? `This option's alignment with your stated priorities (${input.priorities.join(', ')}) deserves careful examination — you may want to check whether the benefits map to what you said matters most.`
      : 'You have not specified priorities, so alignment is difficult to assess.';

    return { option, advantages, tradeoffs, risks, unknowns, priorityAlignment };
  });
}

function generateTradeoffs(input: DecisionInput, themes: string[]): Tradeoff[] {
  const tradeoffs: Tradeoff[] = [];
  if (themes.includes('money') && themes.includes('time')) {
    tradeoffs.push({ sideA: 'More money', sideB: 'Less time', explanation: 'The financial benefit may come at the cost of time you could spend on other priorities.' });
  }
  if (themes.includes('career') && themes.includes('learning')) {
    tradeoffs.push({ sideA: 'More experience', sideB: 'Academic impact', explanation: 'Industry experience may compete with academic responsibilities you also value.' });
  }
  if (themes.includes('convenience')) {
    tradeoffs.push({ sideA: 'Convenience', sideB: 'Long-term opportunity', explanation: 'What is convenient now may not be what creates the most long-term value.' });
  }
  if (themes.includes('learning') && themes.includes('money')) {
    tradeoffs.push({ sideA: 'Learning potential', sideB: 'Financial gain', explanation: 'The most financially attractive option may not be the one where you learn the most.' });
  }
  if (themes.includes('stability') || themes.includes('risk')) {
    tradeoffs.push({ sideA: 'Stability', sideB: 'Growth', explanation: 'A stable path may limit growth, while a growth path may introduce instability.' });
  }
  if (tradeoffs.length === 0) {
    tradeoffs.push({ sideA: 'Short-term benefit', sideB: 'Long-term cost', explanation: 'The visible benefits of this decision may carry less visible long-term costs.' });
  }
  return tradeoffs.slice(0, 4);
}

export function generateFallbackAnalysis(input: DecisionInput): AnalysisResult {
  const themes = detectThemes(input);
  const hasMoney = themes.includes('money');
  const hasConvenience = themes.includes('convenience');
  const hasLearning = themes.includes('learning');
  const hasTime = themes.includes('time');
  const hasUncertainty = themes.includes('uncertainty');

  const optionsAnalysis = generateOptionsAnalysis(input);
  const tradeoffs = generateTradeoffs(input, themes);

  const assumptions: Assumption[] = [];
  if (hasMoney) {
    assumptions.push({
      title: 'Financial benefit will outweigh other costs',
      explanation: 'You may be assuming that the financial upside will compensate for any downsides in other areas.',
      whyItMatters: 'If the financial benefit is smaller or shorter-lived than expected, the trade-off may not be favorable.',
      howToTest: 'Estimate the actual financial value over the full duration and compare it against the costs in your other priority areas.',
    });
  }
  if (hasConvenience) {
    assumptions.push({
      title: 'Convenience is a significant factor',
      explanation: 'You may be assuming that proximity or ease of access meaningfully improves the outcome.',
      whyItMatters: 'Convenience can mask deeper issues — a convenient option may also be the less growth-oriented one.',
      howToTest: 'Ask yourself: if this were less convenient but better in other ways, would you still choose it?',
    });
  }
  if (hasLearning || hasTime) {
    assumptions.push({
      title: 'The experience will deliver the growth you expect',
      explanation: 'You may be assuming that time spent in this role or situation will automatically translate into meaningful learning.',
      whyItMatters: 'Not all experience is valuable — learning depends on the quality of mentorship, challenge, and feedback.',
      howToTest: 'Investigate the actual learning conditions: mentorship quality, feedback culture, and project ownership.',
    });
  }
  assumptions.push({
    title: 'Your current priorities will remain stable',
    explanation: 'You may be assuming that what matters to you now will still matter throughout the duration of this commitment.',
    whyItMatters: 'Priorities shift over time, and a decision optimized for today\'s values may not serve tomorrow\'s.',
    howToTest: 'Reflect on how your priorities have changed over the past year and whether this decision remains aligned.',
  });

  if (assumptions.length === 0) {
    assumptions.push({
      title: 'The framing of this decision is complete',
      explanation: 'You may be assuming that the way you have framed this decision captures all the important dimensions.',
      whyItMatters: 'Narrow framing can cause you to miss entire categories of consideration.',
      howToTest: 'Try reframing the decision from the perspective of someone with very different priorities.',
    });
  }

  const overlookedFactors: OverlookedFactor[] = OVERLOOKED_THEMES.filter((t) => {
    if (themes.includes(t.theme)) return false;
    return true;
  }).slice(0, 3);

  if (overlookedFactors.length < 2) {
    overlookedFactors.push({
      title: 'Second-Order Effects',
      explanation: 'This decision may trigger consequences that only become visible after the initial outcome plays out.',
      whyItMatters: 'Second-order effects often dominate first-order effects in long-term impact.',
    });
  }

  const evidenceGaps: EvidenceGap[] = [];
  if (themes.includes('career') || hasLearning) {
    evidenceGaps.push({
      missing: 'Quality of mentorship and project ownership',
      whyItMatters: 'The value of an experience depends heavily on who guides you and what you actually own.',
      howToVerify: 'Ask current or past participants about their day-to-day work and mentor relationships.',
    });
  }
  if (hasUncertainty) {
    evidenceGaps.push({
      missing: 'Specifics behind the uncertain elements you mentioned',
      whyItMatters: 'Vague uncertainty is harder to act on than specific, named unknowns.',
      howToVerify: 'List each uncertain element and find one concrete source that could resolve it.',
    });
  }
  evidenceGaps.push({
    missing: 'What people who chose differently experienced',
    whyItMatters: 'Counterfactual information — what happened to those who declined or chose an alternative — is rarely considered.',
    howToVerify: 'Find someone who turned down a similar opportunity and ask about their reasoning and outcome.',
  });

  const reasoningTensions: ReasoningTension[] = [];
  const reasoningStr = input.reasoning.toLowerCase();
  if (input.priorities.includes('Learning') && (hasMoney || hasConvenience) && !reasoningStr.includes('learn')) {
    reasoningTensions.push({
      description: 'Stated priority vs. actual reasoning',
      conflict: 'You list learning as a top priority, but your reasoning centers on financial benefit and convenience.',
      reflection: 'You may want to examine whether your stated priorities reflect what truly matters to you, or what feels safest to articulate.',
    });
  }
  if (input.priorities.includes('Time') && hasTime) {
    reasoningTensions.push({
      description: 'Time priority vs. time commitment',
      conflict: 'You value time, but this decision involves a significant time commitment that may reduce your control over it.',
      reflection: 'You may want to examine whether the time you are investing aligns with the time you want to protect.',
    });
  }
  if (input.concerns && input.confidence >= 4) {
    reasoningTensions.push({
      description: 'High confidence despite stated concerns',
      conflict: 'You express a high confidence level while also naming meaningful concerns.',
      reflection: 'You may want to examine whether your confidence reflects genuine certainty or a desire for clarity.',
    });
  }
  if (reasoningTensions.length === 0) {
    reasoningTensions.push({
      description: 'Known vs. unknown balance',
      conflict: 'Your reasoning is built on what you know, but the weight of what you do not know is not yet assessed.',
      reflection: 'You may want to examine whether your confidence accounts for the evidence gaps above.',
    });
  }

  const possibleBiases: PossibleBias[] = [];
  if (hasConvenience && hasMoney) {
    possibleBiases.push({
      name: 'Availability bias',
      evidence: 'Your reasoning emphasizes factors that are easy to observe and quantify (money, convenience).',
      reflection: 'You may want to check for whether easily available information is getting disproportionate weight.',
    });
  }
  possibleBiases.push({
    name: 'Anchoring on one option',
    evidence: 'Your reasoning appears to lean toward a specific option early in the process.',
    reflection: 'You may want to check for whether your framing has anchored on one option before fully evaluating others.',
  });

  const alternativePerspectives = {
    optimist: `Consider that this decision could open doors you cannot currently see. The skills, relationships, and reputation built through this path may compound in ways that are not yet visible. Even if the immediate factors are imperfect, the trajectory may matter more than the starting conditions. What would make this the best version of this decision?`,
    skeptic: `Consider that the factors attracting you to this decision may be the ones that are easiest to justify, not the ones that matter most. The stipend, the convenience, the experience — these are all visible and tangible. But the costs — opportunity cost, time cost, academic cost — are invisible until they are paid. What would you discover if you weighted the invisible costs equally with the visible benefits?`,
    futureYou: `Three years from now, you will be a different person with different information. The decision you make today will look different from that vantage point. What would future-you, looking back, wish you had investigated before committing? What would they wish you had not taken for granted?`,
  };

  const questions: Question[] = [
    { question: `If this decision did not offer ${hasMoney ? 'the financial benefit' : 'its primary advantage'}, would you still make the same choice?`, rationale: 'This reveals whether the decision is driven by its headline benefit or by deeper alignment.' },
    { question: 'What is one thing that, if true, would make you reverse this decision?', rationale: 'Identifying reversal conditions clarifies your actual thresholds.' },
    { question: 'Who would you talk to that has made a similar decision, and what would you ask them?', rationale: 'Lived experience from others is often the most underutilized evidence source.' },
    { question: 'What does the version of you who chose differently know that you do not?', rationale: 'This surfaces blind spots by adopting a counterfactual perspective.' },
    { question: 'What would you advise a close friend facing this exact decision?', rationale: 'Advising others often reveals considerations you are overlooking for yourself.' },
  ];

  const evidenceThatCouldChangeMind = [
    { evidence: 'Specific details about mentorship quality and day-to-day project ownership', whyItWouldChange: 'If the learning environment is poor, the experience premium may not materialize.' },
    { evidence: 'A clear picture of the academic impact and whether it is recoverable', whyItWouldChange: 'If the academic cost is significant and lasting, it may outweigh the short-term benefits.' },
    { evidence: 'A conversation with someone who declined a similar opportunity', whyItWouldChange: 'Counterfactual evidence could reveal whether the path you are not taking is better than you assume.' },
  ];

  const reflectionIndicators = {
    assumptions: assumptions.length,
    evidenceGaps: evidenceGaps.length,
    overlookedFactors: overlookedFactors.length,
    tensions: reasoningTensions.length,
    uncertainty: input.confidence <= 2 ? 'High' : input.confidence === 3 ? 'Moderate' : 'Lower than evidence warrants',
  };

  return {
    decisionFraming: `This decision centers on balancing immediate, visible benefits against less visible long-term costs and trade-offs across your stated priorities.`,
    optionsAnalysis,
    tradeoffs,
    assumptions,
    overlookedFactors,
    evidenceGaps,
    reasoningTensions,
    possibleBiases,
    alternativePerspectives,
    questions,
    evidenceThatCouldChangeMind,
    currentThinking: input.reasoning || 'Your current reasoning emphasizes the factors you can see most clearly.',
    remainingUncertainty: hasUncertainty ? 'The specific details behind several uncertain elements remain unresolved.' : 'The gap between what you know and what you need to know has not yet been fully mapped.',
    reflectionIndicators,
  };
}

type DecisionType = 'career' | 'relationship' | 'health' | 'financial' | 'education' | 'lifestyle' | 'critical' | 'general';

const DECISION_TYPE_KEYWORDS: Record<DecisionType, string[]> = {
  career: ['job', 'career', 'work', 'internship', 'offer', 'promotion', 'company', 'startup', 'role', 'position', 'salary', 'quit', 'switch', 'profession', 'interview', 'hire'],
  relationship: ['relationship', 'marriage', 'partner', 'breakup', 'divorce', 'friend', 'family', 'dating', 'move in', 'commit', 'spouse', 'love', 'together'],
  health: ['health', 'surgery', 'treatment', 'medication', 'diet', 'exercise', 'therapy', 'mental', 'stress', 'burnout', 'doctor', 'diagnosis', 'recovery', 'wellness'],
  financial: ['invest', 'buy', 'sell', 'house', 'car', 'loan', 'debt', 'mortgage', 'stock', 'crypto', 'save', 'budget', 'spend', 'rent', 'purchase', 'property'],
  education: ['college', 'university', 'degree', 'course', 'school', 'study', 'academic', 'program', 'major', 'scholarship', 'masters', 'phd', 'enroll', 'exam'],
  lifestyle: ['move', 'relocate', 'city', 'travel', 'lifestyle', 'habit', 'routine', 'where to live', 'apartment', 'hobby'],
  critical: ['emergency', 'urgent', 'deadline', 'critical', 'irreversible', 'permanent', 'surgery', 'legal', 'contract', 'sign'],
  general: [],
};

function detectDecisionType(input: DecisionInput): DecisionType {
  const fullText = `${input.decision} ${input.options.join(' ')} ${input.context} ${input.reasoning} ${input.concerns}`.toLowerCase();
  const scores: Record<DecisionType, number> = { career: 0, relationship: 0, health: 0, financial: 0, education: 0, lifestyle: 0, critical: 0, general: 0 };
  for (const [type, keywords] of Object.entries(DECISION_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (fullText.includes(kw)) scores[type as DecisionType]++;
    }
  }
  let best: DecisionType = 'general';
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = type as DecisionType; }
  }
  return best;
}

const TYPE_SPECIFIC_QUESTIONS: Record<DecisionType, string[]> = {
  career: [
    'You mentioned career-related factors in your reasoning. But what specifically about this role or company would make you grow — or stagnate — two years from now?',
    'If the job title and pay were identical but the day-to-day work was completely different, which version of the work would you actually prefer? What does that tell you about what is driving your choice?',
    'Who in your network has been in a similar role, and what did they wish they had known before accepting? Have you asked them?',
    'If you were turned down for this opportunity, what would your backup plan reveal about what you actually value here?',
    'What would make you leave this role within six months of accepting it — and is that scenario more likely than you are currently assuming?',
  ],
  relationship: [
    'You are weighing a relationship decision. What would the version of you who is happiest in five years say about what matters most in this choice?',
    'If nothing changed about the other person and only your expectations shifted, would this still feel like the same decision? What does that reveal?',
    'What pattern from past relationships are you potentially repeating here — and is this time genuinely different, or does it just feel different?',
    'What are you not saying out loud to the people involved, and what would change if you said it before deciding?',
    'If this decision affected only you and no one else, would you still be weighing it the same way?',
  ],
  health: [
    'You are considering a health-related decision. What is your actual understanding of the alternatives, and where is that understanding coming from — a professional, or your own research?',
    'If the outcome were uncertain either way, which path would leave you with fewer regrets about having tried it?',
    'What would change about your decision if you knew the recovery or adjustment period would take twice as long as expected?',
    'Who has gone through a similar health decision, and what did they learn that you have not yet considered?',
    'What is the one fear driving your reasoning that you have not fully named — and is it based on evidence or anticipation?',
  ],
  financial: [
    'You are weighing a financial decision. What is the actual number behind your reasoning — and have you calculated the worst realistic scenario, or just the best one?',
    'If this investment or purchase lost half its value tomorrow, would your life change in ways you have not yet considered?',
    'What is the opportunity cost you are not counting — what else could this money do that you are not weighing against it?',
    'Are you making this decision based on information you have verified, or based on an assumption about what will happen next?',
    'What would a financially conservative person you respect say is the one thing you are underestimating about this decision?',
  ],
  education: [
    'You are weighing an education decision. What specifically will this program or path give you that you cannot get another way — and how sure are you that you need it?',
    'If the credential or degree were not visible to anyone, would you still choose this path for what you would actually learn?',
    'What is the cost — not just financial, but in time and missed opportunities — that you have not fully calculated?',
    'Who has completed this path and what do they say they wish they had done differently? Have you asked them?',
    'What would you do if this path did not work out as planned — and does that fallback plan make you more or less comfortable committing?',
  ],
  lifestyle: [
    'You are weighing a lifestyle decision. What daily reality would this create — not the idea of it, but the actual Tuesday morning version of it?',
    'What would you be leaving behind, and have you fully reckoned with whether you would miss it or just think you would?',
    'If someone you deeply respect had made this same lifestyle change and regretted it, what do you think would have caused their regret?',
    'Is this decision about gaining something new or escaping something current — and does that distinction change how you should evaluate it?',
    'What would need to be true for this change to feel like a mistake in twelve months? How likely is that?',
  ],
  critical: [
    'This appears to be a high-stakes or time-sensitive decision. What is the actual deadline driving you, and is it external or self-imposed?',
    'If you had one more week to decide, what would you spend that week investigating — and is any of that possible right now?',
    'What is the irreversible element of this decision, and have you separated it from the parts you could change later?',
    'Who has faced a decision with similar stakes, and what did they do that you have not yet considered?',
    'What is the one assumption that, if wrong, would change everything — and how confident are you in it?',
  ],
  general: [
    `You mentioned ${'your reasoning'} as your key factor. What would have to be true for that factor to become less important than it feels right now?`,
    'If you could only learn one more thing before deciding, what would it be, and why that specifically?',
    'What part of your reasoning would the person who disagrees with you most strongly point to first?',
    'When you imagine yourself a year after this decision, what is the scenario you least want to find yourself in?',
    'What is the strongest reason against the option you are leaning toward that you have not yet fully articulated?',
  ],
};

function extractKeyPhrase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'your reasoning';
  const firstClause = trimmed.split(/[,.]/)[0].trim();
  return firstClause.length > 5 ? firstClause.toLowerCase() : 'your reasoning';
}

export function generateFallbackChallenge(
  previousExchanges: { question: string; answer: string }[],
  input: DecisionInput,
  round: number
): { question: string; rationale?: string } {
  const decisionType = detectDecisionType(input);
  const typeQuestions = TYPE_SPECIFIC_QUESTIONS[decisionType];
  const reasoningPhrase = extractKeyPhrase(input.reasoning);

  // For the first question, use the type-specific opener with the user's reasoning woven in
  if (round === 0) {
    if (decisionType === 'general') {
      return { question: typeQuestions[0].replace('${\'your reasoning\'}', reasoningPhrase) };
    }
    return { question: typeQuestions[0] };
  }

  // For subsequent rounds, adapt based on the user's previous answer
  const lastExchange = previousExchanges[previousExchanges.length - 1];
  const lastAnswer = lastExchange?.answer || '';
  const lastAnswerLower = lastAnswer.toLowerCase();

  // Detect what theme the user's answer touched on
  const answerThemes: string[] = [];
  if (/assume|assumption|taking for granted|probably|likely|guess/.test(lastAnswerLower)) answerThemes.push('assumption');
  if (/money|pay|cost|afford|financial|salary|stipend/.test(lastAnswerLower)) answerThemes.push('money');
  if (/time|schedule|busy|commitment|deadline/.test(lastAnswerLower)) answerThemes.push('time');
  if (/learn|grow|skill|experience|development/.test(lastAnswerLower)) answerThemes.push('learning');
  if (/fear|worried|scared|afraid|anxious|concern/.test(lastAnswerLower)) answerThemes.push('fear');
  if (/family|partner|friend|relationship|people/.test(lastAnswerLower)) answerThemes.push('relationships');
  if (/not sure|don't know|uncertain|unclear|maybe/.test(lastAnswerLower)) answerThemes.push('uncertainty');

  // Generate an adaptive follow-up that references what the user just said
  const adaptiveFollowUps: Record<DecisionType, (answer: string) => string[]> = {
    career: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". In your answer, what did you take for granted — and what would change if that assumption turned out to be wrong?`,
      'Given what you just shared, what is the one thing you would want to verify before committing to this career path?',
      'You have now identified a deeper consideration. If a trusted mentor heard your reasoning, what would they challenge first?',
    ],
    relationship: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". Is what you described based on what you know, or what you hope will be true?`,
      'Given what you just shared, what would the other person in this situation say you are not considering?',
      'You have surfaced something important. If this pattern has appeared before in your life, what does that tell you about what is really driving this decision?',
    ],
    health: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". Is your answer based on professional guidance, or on your own assessment — and does that distinction matter here?`,
      'Given what you just shared, what would change if the recovery or outcome took longer than you expect?',
      'You have identified a real consideration. What is the one question you have not yet asked your doctor or advisor?',
    ],
    financial: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". Have you put an actual number to that — or is the reasoning still operating on feelings rather than figures?`,
      'Given what you just shared, what would the worst realistic financial outcome look like, and have you planned for it?',
      'You have surfaced a deeper financial consideration. What would a cautious person you respect say is the one risk you are underestimating?',
    ],
    education: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". Is what you described about the path itself, or about how it will look to others — and does that distinction matter to you?`,
      'Given what you just shared, what would you do if this path did not lead where you expect — and is that fallback realistic?',
      'You have identified something important. What is the one thing a current student or graduate would tell you that you have not yet considered?',
    ],
    lifestyle: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". Is what you described about what you would gain, or what you would leave behind — and which weighs more for you?`,
      'Given what you just shared, what would the daily reality of this change look like in three months, not just the first week?',
      'You have surfaced a deeper consideration. What would make you reverse this lifestyle change within a year, and how likely is that?',
    ],
    critical: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". In a high-stakes decision like this, what is the one thing you cannot undo — and have you separated it from what you can?`,
      'Given what you just shared, is there any part of the urgency driving this decision that is self-imposed rather than real?',
      'You have identified a critical factor. What would you do differently if you had 48 more hours before this decision becomes irreversible?',
    ],
    general: (answer) => [
      `You said "${answer.slice(0, 60)}${answer.length > 60 ? '...' : ''}". What assumption did you rely on to answer that — and what would change if it were wrong?`,
      'Given what you just shared, what would the person who disagrees with you most strongly point to in your reasoning?',
      'You have surfaced something important. What is the one piece of evidence that would most change your thinking here?',
    ],
  };

  const followUps = adaptiveFollowUps[decisionType](lastAnswer);
  const followUpIndex = round - 1;

  // If we have adaptive follow-ups for this round, use them
  if (followUpIndex < followUps.length && lastAnswer.length > 0) {
    return { question: followUps[followUpIndex] };
  }

  // Otherwise, fall back to the next type-specific question
  if (round < typeQuestions.length) {
    return { question: typeQuestions[round] };
  }

  // Final round: synthesize
  return { question: `Looking at everything you have shared across these questions, what is the one thing you now realize you need to investigate before this decision is complete?` };
}

export function generateFallbackShiftSummary(
  exchanges: { question: string; answer: string }[],
  input: DecisionInput
): { originalReasoning: string; newConsideration: string; remainingUncertainty: string; whatToInvestigateNext: string } {
  const answers = exchanges.map((e) => e.answer).join(' ');
  return {
    originalReasoning: input.reasoning || 'Your initial reasoning centered on the factors you could see most clearly.',
    newConsideration: answers
      ? `Through this challenge, you explored dimensions of your reasoning that were not visible in your initial framing — particularly around what you might be taking for granted and what evidence you still need.`
      : 'Consider revisiting this challenge when you have more time to reflect on each question.',
    remainingUncertainty: 'The core uncertainty remains: you have identified what you do not know, but resolving it requires action, not more deliberation.',
    whatToInvestigateNext: 'Start with the single piece of evidence that would most change your reasoning, and find it before committing.',
  };
}
