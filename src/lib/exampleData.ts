import type { DecisionInput } from '@/types';

export const EXAMPLE_DECISION: DecisionInput = {
  decision: 'Should I accept a 6-month software internship?',
  options: ['Accept', 'Reject', 'Ask for flexibility'],
  context:
    'Good stipend, close to home, six-month commitment, college responsibilities, industry experience, unclear mentorship, uncertain project ownership, possible academic impact.',
  reasoning:
    "I'm mainly considering it because the stipend is good, it is convenient, and it could give me industry experience.",
  concerns: "I'm worried it could affect academics.",
  priorities: ['Learning', 'Career growth', 'Money', 'Time'],
  confidence: 4,
};

export const PRIORITY_OPTIONS = [
  'Growth',
  'Money',
  'Time',
  'Learning',
  'Stability',
  'Freedom',
  'Relationships',
  'Health',
  'Impact',
  'Career growth',
];
