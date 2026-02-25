-- イベント後アンケート「連絡先交換したい」で入力された相手ごとのデータ
CREATE TABLE IF NOT EXISTS koifes_contact_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  target_nickname TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE koifes_contact_exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for koifes_contact_exchanges" ON koifes_contact_exchanges FOR ALL USING (true) WITH CHECK (true);
