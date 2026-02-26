-- koifes_ratings の RLS を全許可に修正
-- 本アプリは Supabase Auth を使用していないため、auth.uid() ベースのポリシーでは
-- INSERT/UPDATE/SELECT が失敗する。全操作を許可する。

DROP POLICY IF EXISTS "koifes_ratings_select_own" ON koifes_ratings;
DROP POLICY IF EXISTS "koifes_ratings_insert_authenticated" ON koifes_ratings;

CREATE POLICY "Allow all for koifes_ratings" ON koifes_ratings
  FOR ALL USING (true) WITH CHECK (true);
