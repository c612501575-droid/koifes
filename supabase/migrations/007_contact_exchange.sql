ALTER TABLE koifes_post_surveys
  ADD COLUMN IF NOT EXISTS want_contact_exchange BOOLEAN,
  ADD COLUMN IF NOT EXISTS contact_targets TEXT;
