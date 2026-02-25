-- koifes_connections の RLS を全許可に修正
-- 本アプリは Supabase Auth を使用していないため、auth.uid() ベースのポリシーでは
-- データ取得ができず履歴が表示されない。SELECT を全許可にする。

-- 既存のポリシーを削除（auth.uid() ベースなどがある場合）
DROP POLICY IF EXISTS "Allow all for koifes_connections" ON koifes_connections;
DROP POLICY IF EXISTS "Enable read for koifes_connections" ON koifes_connections;
DROP POLICY IF EXISTS "Enable insert for koifes_connections" ON koifes_connections;
DROP POLICY IF EXISTS "Users can view own connections" ON koifes_connections;
DROP POLICY IF EXISTS "Users can insert own connections" ON koifes_connections;
-- 上記以外のカスタムポリシー名があれば Supabase Dashboard で確認して削除

-- 全操作を許可するポリシーを作成
CREATE POLICY "Allow all for koifes_connections" ON koifes_connections
  FOR ALL USING (true) WITH CHECK (true);
