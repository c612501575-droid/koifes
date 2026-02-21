ALTER TABLE koifes_users
  ADD COLUMN IF NOT EXISTS dealbreakers TEXT[],
  ADD COLUMN IF NOT EXISTS unmarried_reasons TEXT[];
