// UNSEEN reasoning-audit edge function v2
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DecisionInput {
  decision: string;
  options: string[];
  context: string;
  reasoning: string;
  concerns: string;
  priorities: string[];
  confidence: number;
}

const SYSTEM_PROMPT = `You are UNSEEN, a reasoning assistant.

Your purpose is to help a person examine their reasoning, not make their decision.

Never recommend an option.
Never rank options.
Never tell the user what they should do.
Never fabricate facts.
Separate user-provided information from inference.
Identify assumptions carefully.
Surface missing information.
Identify reasoning tensions.
Suggest alternative perspectives.
Ask high-value questions.
Use respectful uncertainty.
Do not diagnose psychological conditions.
Do not manipulate the user's decision.
The user remains the final decision-maker.

Always use phrases like "You may want to examine whether..." or "You may be assuming..." — never assert.

You MUST respond with valid JSON only, no markdown, no commentary outside the JSON.`;

const AUDIT_PROMPT = `Analyze the following decision reasoning and produce a comprehensive reasoning audit. Return ONLY valid JSON matching this schema exactly:

{
  "decisionFraming": "string — a concise 1-2 sentence reframing of the decision that captures its essential tension",
  "optionsAnalysis": [{"option": string, "advantages": string[], "tradeoffs": string[], "risks": string[], "unknowns": string[], "priorityAlignment": string}],
  "tradeoffs": [{"sideA": string, "sideB": string, "explanation": string}],
  "assumptions": [{"title": string, "explanation": string, "whyItMatters": string, "howToTest": string}],
  "overlookedFactors": [{"title": string, "explanation": string, "whyItMatters": string}],
  "evidenceGaps": [{"missing": string, "whyItMatters": string, "howToVerify": string}],
  "reasoningTensions": [{"description": string, "conflict": string, "reflection": string}],
  "possibleBiases": [{"name": string, "evidence": string, "reflection": string}],
  "alternativePerspectives": {"optimist": string, "skeptic": string, "futureYou": string},
  "questions": [{"question": string, "rationale": string}],
  "evidenceThatCouldChangeMind": [{"evidence": string, "whyItWouldChange": string}],
  "currentThinking": "string — a concise summary of what the user's current reasoning seems to emphasize",
  "remainingUncertainty": "string — the most significant unresolved uncertainty in the decision",
  "reflectionIndicators": {"assumptions": number, "evidenceGaps": number, "overlookedFactors": number, "tensions": number, "uncertainty": string}
}

Rules:
- Analyze each option listed by the user. For each, identify 2-3 advantages, 2-3 tradeoffs, 1-2 risks, 1-2 unknowns, and a priorityAlignment note.
- Generate 2-4 tradeoffs as contrasting pairs (e.g., "More money" vs "Less time"). Only use tradeoffs supported by the user's information.
- Generate 3-5 assumptions, 3-5 overlooked factors, 3-5 evidence gaps, 2-4 tensions, 1-3 biases
- Generate exactly 5 questions specific to THIS decision
- Generate exactly 3 pieces of evidence that could change mind
- Use "You may want to..." language throughout
- Never recommend any option or rank them
- Keep each text field concise (1-3 sentences)
- The uncertainty field in reflectionIndicators should describe the user's confidence level vs evidence quality
- The priorityAlignment should note how well the option aligns with the user's stated priorities — without recommending`;

const CHALLENGE_PROMPT = `You are in Challenge My Thinking mode. You ask ONE high-value question at a time to help the user examine their reasoning. Never provide a verdict or recommendation. Adapt your question based on the user's previous answer.

First, identify what TYPE of decision this is (career, relationship, health, financial, education, lifestyle, critical/irreversible, or general). Then generate questions that are SPECIFIC to that decision type.

For example:
- CAREER decisions: ask about growth trajectory, mentorship, day-to-day reality, exit options
- RELATIONSHIP decisions: ask about patterns, communication, long-term compatibility, what remains unsaid
- HEALTH decisions: ask about professional guidance vs self-assessment, recovery expectations, alternatives
- FINANCIAL decisions: ask about actual numbers, worst-case scenarios, opportunity cost, verified vs assumed returns
- EDUCATION decisions: ask about credential vs learning, opportunity cost, what graduates wish they knew
- CRITICAL decisions: ask about real vs self-imposed deadlines, irreversible elements, what 48 more hours would change

Return ONLY valid JSON: {"question": string}

The question must:
- Be specific to the user's reasoning, the decision type, AND their previous answer
- Directly reference what the user said in their last answer when possible
- Challenge an assumption, surface a blind spot, or reframe the problem in a way that fits this decision type
- Never tell them what to do
- Be 1-2 sentences max
- Feel like it comes from someone who understands THIS type of decision, not a generic question generator`;

const SUMMARY_PROMPT = `Based on the challenge conversation, produce a reflection summary. Return ONLY valid JSON:

{
  "originalReasoning": string,
  "newConsideration": string,
  "remainingUncertainty": string,
  "whatToInvestigateNext": string
}

Never provide a recommendation. Focus on what shifted in their thinking and what remains unknown.`;

function safeParseJSON(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function validateAnalysis(data: any): boolean {
  return data &&
    typeof data.decisionFraming === 'string' &&
    Array.isArray(data.optionsAnalysis) &&
    Array.isArray(data.tradeoffs) &&
    Array.isArray(data.assumptions) &&
    Array.isArray(data.overlookedFactors) &&
    Array.isArray(data.evidenceGaps) &&
    Array.isArray(data.reasoningTensions) &&
    data.alternativePerspectives &&
    typeof data.alternativePerspectives.optimist === 'string' &&
    Array.isArray(data.questions) &&
    Array.isArray(data.evidenceThatCouldChangeMind) &&
    data.reflectionIndicators;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, input, exchanges, round, analysis } = body as {
      action: string;
      input: DecisionInput;
      exchanges?: { question: string; answer: string }[];
      round?: number;
      analysis?: any;
    };

    if (!input || !input.decision) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured', fallback: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPayload = `Decision: ${input.decision}
Options: ${input.options.join(', ')}
Context: ${input.context}
Reasoning: ${input.reasoning}
Concerns: ${input.concerns}
Priorities: ${input.priorities.join(', ')}
Confidence: ${input.confidence}/5`;

    let systemPrompt = SYSTEM_PROMPT;
    let userPrompt = '';

    if (action === 'audit') {
      userPrompt = `${AUDIT_PROMPT}\n\n---\n\nUser's decision reasoning:\n${userPayload}`;
    } else if (action === 'challenge') {
      const exchangeHistory = (exchanges || [])
        .map((e, i) => `Q${i + 1}: ${e.question}\nA${i + 1}: ${e.answer}`)
        .join('\n\n');
      const lastAnswer = exchanges && exchanges.length > 0 ? exchanges[exchanges.length - 1]?.answer : '';
      userPrompt = `${CHALLENGE_PROMPT}\n\n---\n\nUser's decision reasoning:\n${userPayload}\n\nPrevious exchanges:\n${exchangeHistory}\n\nRound: ${(round ?? 0) + 1} of 5. ${lastAnswer ? `The user's last answer was: "${lastAnswer}". Your next question MUST directly build on what they just said and be specific to this type of decision.` : 'Ask the first question, tailored to the type of decision this is.'} Ask the next adaptive question.`;
    } else if (action === 'challenge_summary') {
      const exchangeHistory = (exchanges || [])
        .map((e, i) => `Q${i + 1}: ${e.question}\nA${i + 1}: ${e.answer}`)
        .join('\n\n');
      userPrompt = `${SUMMARY_PROMPT}\n\n---\n\nUser's decision reasoning:\n${userPayload}\n\nChallenge conversation:\n${exchangeHistory}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Unknown action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: action === 'audit' ? 4000 : 800,
      }),
    });

    if (!aiResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'AI service error', fallback: true }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    const parsed = safeParseJSON(content);

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Could not parse AI response', fallback: true }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'audit') {
      if (!validateAnalysis(parsed)) {
        return new Response(
          JSON.stringify({ error: 'Invalid analysis structure', fallback: true }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ analysis: parsed, fallback: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'challenge') {
      if (!parsed.question || typeof parsed.question !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid challenge response', fallback: true }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ question: parsed.question, fallback: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'challenge_summary') {
      if (!parsed.originalReasoning) {
        return new Response(
          JSON.stringify({ error: 'Invalid summary response', fallback: true }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ shiftSummary: parsed, fallback: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', fallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
