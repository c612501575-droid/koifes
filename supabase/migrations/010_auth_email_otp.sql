-- メールOTP認証対応: koifes_users に email カラム追加
-- auth.users.id を koifes_users.id として使用する場合、新規ユーザーは id = auth.uid()
-- 既存ユーザーは email が NULL のまま（再登録時には auth.uid() で新規作成）

ALTER TABLE koifes_users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- インデックス（メールで検索するため）
CREATE INDEX IF NOT EXISTS idx_koifes_users_email ON koifes_users(email) WHERE email IS NOT NULL;
