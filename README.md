# UNSEEN

**AI for the things your reasoning missed.**

UNSEEN is an AI reasoning auditor that helps people discover assumptions, missing evidence, overlooked factors, and tensions in their reasoning — without making the decision for them.

> Your decision stays yours.

## Problem

People make decisions from visible information while overlooking assumptions, evidence gaps, hidden trade-offs, and contradictions in their own reasoning. Most decision tools ask "What should I choose?" UNSEEN asks "What might I be missing?"

## Solution

UNSEEN performs a **reasoning audit** — not a recommendation. It analyzes the user's reasoning and surfaces:

- **Assumptions** — what you're taking for granted, why it matters, how to test it
- **Outside the Frame** — important factors that may have been overlooked
- **Evidence Gaps** — what you don't actually know and how to verify it
- **Reasoning Tensions** — conflicts between stated priorities and actual reasoning
- **Possible Biases** — patterns that may be distorting your judgment
- **Alternative Perspectives** — The Optimist, The Skeptic, and Future You
- **Questions Worth Asking** — five high-value, specific questions
- **What Could Change Your Mind** — three pieces of evidence that could shift your reasoning

## What Makes It Different

UNSEEN **never** recommends, ranks, or chooses an option. It challenges reasoning without taking away user autonomy. The AI identifies blind spots; the user makes the decision.

## AI Reasoning Architecture

### Server-side AI

AI calls are made through a Supabase Edge Function (`reasoning-audit`) — API keys are never exposed to the frontend. The edge function:

1. Receives the user's decision input (authenticated via JWT)
2. Calls the AI API with a carefully crafted system prompt
3. Parses and validates the structured JSON response
4. Returns the analysis to the frontend

### System Prompt Principles

The AI is instructed to:
- Never recommend an option
- Never rank options
- Never tell the user what to do
- Separate user-provided information from inference
- Use respectful uncertainty ("You may want to examine whether...")
- Never diagnose psychological conditions
- Never fabricate facts

### Fallback Reliability

If the AI service is unavailable, UNSEEN uses a deterministic local fallback engine that analyzes reasoning based on detected themes (money, time, risk, learning, career, convenience, opportunity cost, reversibility, etc.). The fallback is labeled "AI-assisted reflection" and offers a "Retry AI" option.

### Challenge My Thinking

An adaptive one-question-at-a-time dialogue where the AI asks a high-value question, the user responds, and the AI adapts its next question based on the answer. Maximum 5 rounds. At completion, it shows "What Shifted?" — original reasoning, new consideration, remaining uncertainty, and what to investigate next. Never provides a recommendation.

## Features

- **Landing page** with animated reasoning constellation visualization
- **Guided reflection** — 7-step decision input with progress tracking
- **AI reasoning audit** with progressive reveal of findings
- **Blind Spot Map** — interactive SVG visualization with clickable nodes
- **Thinking Landscape** — reflection indicators (not fake scores)
- **Fact vs Inference** — visible trust labels (USER PROVIDED / AI INFERENCE / UNCERTAINTY)
- **Change the Lens** — three alternative perspectives
- **Challenge My Thinking** — adaptive questioning with shift summary
- **You Decide** — final reflection screen that reinforces user autonomy
- **Save & History** — all decisions saved to the database with RLS
- **Example Mode** — one-click demo with internship decision
- **Challenge Mode** — quick-start for direct questioning
- **Security page** — password management, data deletion, RLS info
- **Account page** — profile management

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Supabase (Auth + PostgreSQL + Edge Functions + RLS)
- Framer Motion (animations)
- Lucide React (icons)
- React Router (routing)

## Architecture

```
src/
├── components/
│   ├── BlindSpotMap.tsx      # Interactive SVG reasoning visualization
│   ├── Logo.tsx
│   └── ui.tsx                 # Shared UI components
├── context/
│   └── AuthContext.tsx        # Supabase auth state management
├── lib/
│   ├── aiEngine.ts            # Frontend AI call wrapper with fallback
│   ├── fallbackEngine.ts      # Deterministic local fallback analysis
│   ├── exampleData.ts         # Example decision for demos
│   └── supabase.ts            # Supabase client singleton
├── pages/
│   ├── LandingPage.tsx
│   ├── SignUpPage.tsx
│   ├── LoginPage.tsx
│   ├── VerifyEmailPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── DashboardLayout.tsx
│   ├── DashboardPage.tsx
│   ├── NewDecisionPage.tsx
│   ├── AnalysisPage.tsx
│   ├── ChallengePage.tsx
│   ├── MyDecisionsPage.tsx
│   ├── DecisionDetailPage.tsx
│   ├── SecurityPage.tsx
│   └── AccountPage.tsx
├── types/
│   └── index.ts               # TypeScript interfaces for all data
├── App.tsx                    # Router + auth-gated routes
└── index.css                  # Theme + design system

supabase/
├── config.toml
└── functions/
    └── reasoning-audit/
        └── index.ts           # Edge function: AI calls + fallback
```

## Database

### decisions table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Unique identifier |
| user_id | uuid (FK → auth.users) | Owner, defaults to auth.uid() |
| decision | text | The decision being examined |
| options | text[] | Options on the table |
| context | text | What the user knows |
| reasoning | text | Why they are leaning this way |
| concerns | text | What they are worried about |
| priorities | text[] | Selected priority chips |
| confidence | integer (1-5) | How certain they feel |
| analysis | jsonb | AI reasoning audit result |
| challenge_data | jsonb | Challenge conversation + shift summary |
| reflection | text | User's final reflection |
| status | text | Workflow stage |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own decisions (4 separate policies: SELECT, INSERT, UPDATE, DELETE)
- `user_id` defaults to `auth.uid()` so inserts work without client-side threading
- AI API calls go through an Edge Function — no API keys in frontend
- JWT verification on edge function (`verify_jwt = true`)
- Password handling via Supabase Auth (never stored manually)
- Email verification flow
- Password reset via email link
- Account data deletion
- Safe AI output rendering (no arbitrary HTML execution)
- Input validation on all forms
- Safe error messages (no raw stack traces exposed to users)

## Environment Variables

All Supabase environment variables are pre-populated:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

Server-side (edge function):
- `OPENAI_API_KEY` — OpenAI API key (if configured, enables AI-powered analysis)

If `OPENAI_API_KEY` is not set, the app uses the deterministic fallback engine.

## Setup

```bash
npm install
npm run dev
```

## Deployment

The app deploys automatically on Bolt. The Supabase edge function deploys via the Supabase MCP tool.

## Limitations

- No SMS/mobile OTP verification (no SMS provider configured)
- No MFA/TOTP (would require additional Supabase configuration)
- AI analysis quality depends on the configured AI API key; fallback is deterministic
- Account deletion removes user data but the auth account itself requires Supabase dashboard or support intervention

## Future Improvements

- MFA/TOTP support
- Decision comparison view
- Export reflection as PDF
- Collaborative reasoning (invite others to examine your decision)
- Historical reasoning pattern analysis
- Custom priority definitions
- Voice-to-text for guided reflection
