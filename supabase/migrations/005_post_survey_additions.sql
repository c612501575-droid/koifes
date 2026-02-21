ALTER TABLE koifes_post_surveys
  ADD COLUMN IF NOT EXISTS interested_count TEXT,
  ADD COLUMN IF NOT EXISTS want_growth TEXT,
  ADD COLUMN IF NOT EXISTS resistance_change TEXT,
  ADD COLUMN IF NOT EXISTS personality_tags TEXT[],
  ADD COLUMN IF NOT EXISTS want_others_evaluation BOOLEAN,
  ADD COLUMN IF NOT EXISTS feedback_text TEXT;
