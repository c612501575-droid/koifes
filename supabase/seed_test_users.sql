-- テスト用ダミーユーザー（TST1, TST2, TST3）
-- Supabase Dashboard の SQL Editor または supabase db execute で実行

INSERT INTO koifes_users (code, full_name, nickname, gender, age, age_number, height, job)
VALUES
  ('TST1', 'テスト 太郎', 'テスト1', '男性', '20代前半', 22, '175', '会社員'),
  ('TST2', 'テスト 花子', 'テスト2', '女性', '20代後半', 28, '162', '会社員'),
  ('TST3', 'テスト 次郎', 'テスト3', '男性', '30代前半', 32, '178', 'IT・エンジニア')
ON CONFLICT (code) DO NOTHING;
