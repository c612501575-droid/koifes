-- 評価テーブルに交換拒否理由・相手タグ・所要時間を追加
ALTER TABLE koifes_ratings ADD COLUMN IF NOT EXISTS reject_reason TEXT[];
ALTER TABLE koifes_ratings ADD COLUMN IF NOT EXISTS partner_tags TEXT[];
ALTER TABLE koifes_ratings ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
