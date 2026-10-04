/*
# Create decisions table for UNSEEN

1. New Tables
- `decisions` — stores a user's reasoning audit sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
  - `decision` (text, the decision being examined)
  - `options` (text array, the options on the table)
  - `context` (text, what the user knows)
  - `reasoning` (text, why they are leaning a certain way)
  - `concerns` (text, what they are worried about)
  - `priorities` (text array, priority chips selected)
  - `confidence` (integer 1-5, how certain they feel)
  - `analysis` (jsonb, the AI reasoning audit result)
  - `challenge_data` (jsonb, challenge my thinking conversation + shift summary)
  - `reflection` (text, user's final reflection)
  - `status` (text, defaults to 'reflecting' — tracks workflow stage)
  - `created_at` (timestamptz, defaults to now)
  - `updated_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on `decisions`.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- Four separate policies: select, insert, update, delete.
- user_id defaults to auth.uid() so inserts that omit it still work.
*/

CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  decision text NOT NULL,
  options text[] DEFAULT '{}',
  context text DEFAULT '',
  reasoning text DEFAULT '',
  concerns text DEFAULT '',
  priorities text[] DEFAULT '{}',
  confidence integer DEFAULT 3,
  analysis jsonb DEFAULT '{}',
  challenge_data jsonb DEFAULT '{}',
  reflection text DEFAULT '',
  status text DEFAULT 'reflecting',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_decisions" ON decisions;
CREATE POLICY "select_own_decisions"
ON decisions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_decisions" ON decisions;
CREATE POLICY "insert_own_decisions"
ON decisions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_decisions" ON decisions;
CREATE POLICY "update_own_decisions"
ON decisions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_decisions" ON decisions;
CREATE POLICY "delete_own_decisions"
ON decisions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);
CREATE INDEX IF NOT EXISTS decisions_created_at_idx ON decisions(created_at DESC);
