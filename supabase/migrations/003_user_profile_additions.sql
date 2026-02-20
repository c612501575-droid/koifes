-- 恋フェス: プロフィール項目追加
-- フルネーム、年齢数値、兄弟構成、家族の有無、結婚・子供の時期

ALTER TABLE koifes_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE koifes_users ADD COLUMN IF NOT EXISTS age_number INTEGER;
ALTER TABLE koifes_users ADD COLUMN IF NOT EXISTS siblings TEXT;
ALTER TABLE koifes_users ADD COLUMN IF NOT EXISTS living_with_family TEXT;
ALTER TABLE koifes_users ADD COLUMN IF NOT EXISTS marriage_by_when TEXT;
ALTER TABLE koifes_users ADD COLUMN IF NOT EXISTS children_by_when TEXT;
