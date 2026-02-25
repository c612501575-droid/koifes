// クライアント用 Supabase（Cookie ベースのセッション管理）
// サーバー・API では app/lib/supabase/server.ts の createClient() を使用
import { createClient } from "./supabase/client";

export const supabase = createClient();
