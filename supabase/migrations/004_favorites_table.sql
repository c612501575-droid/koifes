CREATE TABLE IF NOT EXISTS koifes_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  favorite_user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, favorite_user_id)
);

ALTER TABLE koifes_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for koifes_favorites" ON koifes_favorites FOR ALL USING (true) WITH CHECK (true);
