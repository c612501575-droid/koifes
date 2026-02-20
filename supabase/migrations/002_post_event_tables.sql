-- 恋フェス v6: イベント後アンケート & フォローアップ
-- Supabase Dashboard の SQL Editor で実行してください

-- イベント後アンケート
CREATE TABLE IF NOT EXISTS koifes_post_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  post_esteem INTEGER DEFAULT 5,
  post_resistance INTEGER DEFAULT 5,
  post_barrier_change TEXT,
  satisfaction INTEGER DEFAULT 5,
  fun_score INTEGER DEFAULT 5,
  comfort_score INTEGER DEFAULT 5,
  organization_score INTEGER DEFAULT 5,
  self_discovery TEXT,
  confidence_change TEXT,
  communication_growth TEXT,
  attend_again TEXT,
  recommend_score INTEGER DEFAULT 5,
  recommend_reason TEXT,
  loneliness_change TEXT,
  community_feeling TEXT,
  tokushima_impression_change TEXT,
  marriage_motivation_change TEXT,
  best_moment TEXT,
  improvement_suggestion TEXT,
  free_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- フォローアップ
CREATE TABLE IF NOT EXISTS koifes_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES koifes_users(id) ON DELETE CASCADE,
  want_contact BOOLEAN DEFAULT false,
  contact_method TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- RLS
ALTER TABLE koifes_post_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE koifes_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for koifes_post_surveys" ON koifes_post_surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for koifes_followups" ON koifes_followups FOR ALL USING (true) WITH CHECK (true);

-- ビフォー・アフター比較ビュー
CREATE OR REPLACE VIEW koifes_before_after_stats AS
SELECT
  u.id, u.nickname, u.gender, u.age,
  u.esteem AS before_esteem,
  u.resistance AS before_resistance,
  ps.post_esteem AS after_esteem,
  ps.post_resistance AS after_resistance,
  (ps.post_esteem - u.esteem) AS esteem_change,
  (ps.post_resistance - u.resistance) AS resistance_change,
  ps.satisfaction, ps.recommend_score, ps.attend_again,
  ps.loneliness_change, ps.community_feeling,
  ps.tokushima_impression_change, ps.marriage_motivation_change
FROM koifes_users u
INNER JOIN koifes_post_surveys ps ON u.id = ps.user_id;

-- 相互マッチングビュー
CREATE OR REPLACE VIEW koifes_mutual_followups AS
SELECT
  f1.from_user_id AS user_a, f1.to_user_id AS user_b,
  u1.nickname AS name_a, u2.nickname AS name_b,
  f1.contact_method AS method_a, f2.contact_method AS method_b,
  f1.message AS message_a, f2.message AS message_b
FROM koifes_followups f1
INNER JOIN koifes_followups f2
  ON f1.from_user_id = f2.to_user_id AND f1.to_user_id = f2.from_user_id
INNER JOIN koifes_users u1 ON f1.from_user_id = u1.id
INNER JOIN koifes_users u2 ON f1.to_user_id = u2.id
WHERE f1.want_contact = true AND f2.want_contact = true
  AND f1.from_user_id < f1.to_user_id;
