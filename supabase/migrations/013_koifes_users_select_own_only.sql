-- koifes_users: SELECT を本人の行のみに制限（セキュリティ強化）
-- 他ユーザーの情報は /api/app-data 等のAPI経由でのみ取得可能
DROP POLICY IF EXISTS "koifes_users_select_authenticated" ON koifes_users;
CREATE POLICY "koifes_users_select_own" ON koifes_users
  FOR SELECT USING (auth.uid() = id);
