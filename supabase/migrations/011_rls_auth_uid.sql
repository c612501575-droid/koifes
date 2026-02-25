-- RLS を auth.uid() ベースに更新（メールOTP認証導入後）

-- koifes_users: SELECT は認証済み全員可、INSERT/UPDATE は自分のみ
DROP POLICY IF EXISTS "Allow all for koifes_users" ON koifes_users;
CREATE POLICY "koifes_users_select_authenticated" ON koifes_users
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "koifes_users_insert_own" ON koifes_users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "koifes_users_update_own" ON koifes_users
  FOR UPDATE USING (auth.uid() = id);

-- koifes_ratings: SELECT は from/to の本人のみ、INSERT は認証済み
DROP POLICY IF EXISTS "Allow all for koifes_ratings" ON koifes_ratings;
CREATE POLICY "koifes_ratings_select_own" ON koifes_ratings
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );
CREATE POLICY "koifes_ratings_insert_authenticated" ON koifes_ratings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- koifes_connections: SELECT は関与者のみ、INSERT は認証済み
DROP POLICY IF EXISTS "Allow all for koifes_connections" ON koifes_connections;
CREATE POLICY "koifes_connections_select_own" ON koifes_connections
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );
CREATE POLICY "koifes_connections_insert_authenticated" ON koifes_connections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- koifes_favorites: 自分のもののみ
DROP POLICY IF EXISTS "Allow all for koifes_favorites" ON koifes_favorites;
CREATE POLICY "koifes_favorites_own" ON koifes_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
