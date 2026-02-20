-- Koifes v5 テーブル定義
-- Supabase Dashboard の SQL Editor で実行してください

-- 参加者
CREATE TABLE IF NOT EXISTS koifes_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  nickname TEXT,
  gender TEXT,
  age TEXT,
  height TEXT,
  job TEXT,
  family TEXT,
  income TEXT,
  marriage TEXT,
  children TEXT,
  hobbies JSONB DEFAULT '[]',
  values JSONB DEFAULT '[]',
  event_exp TEXT,
  esteem INTEGER DEFAULT 5,
  resistance INTEGER DEFAULT 5,
  invest TEXT,
  weakness TEXT,
  personality TEXT,
  self_improvement TEXT,
  improvement_confidence TEXT,
  barrier_change TEXT,
  stay_tokushima TEXT,
  leave_reason TEXT,
  stay_conditions JSONB DEFAULT '[]',
  buy_house TEXT,
  housing_conditions JSONB DEFAULT '[]',
  company_support TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 評価
CREATE TABLE IF NOT EXISTS koifes_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  impression INTEGER NOT NULL,
  ease INTEGER NOT NULL,
  again TEXT,
  overall NUMERIC(3,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 接続（マッチング）
CREATE TABLE IF NOT EXISTS koifes_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- RLS を無効化（開発用。本番では適切なRLSを設定してください）
ALTER TABLE koifes_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE koifes_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE koifes_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for koifes_users" ON koifes_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for koifes_ratings" ON koifes_ratings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for koifes_connections" ON koifes_connections FOR ALL USING (true) WITH CHECK (true);
