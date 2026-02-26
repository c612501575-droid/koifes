-- 連絡先交換の意思確認用カラムを koifes_ratings に追加
ALTER TABLE koifes_ratings ADD COLUMN IF NOT EXISTS want_exchange BOOLEAN;
ALTER TABLE koifes_ratings ADD COLUMN IF NOT EXISTS exchange_reason TEXT[];
