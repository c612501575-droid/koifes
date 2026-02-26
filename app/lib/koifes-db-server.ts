/**
 * サーバーサイド専用 DB ヘルパー
 * SUPABASE_SERVICE_ROLE_KEY を用いて RLS をバイパスし、
 * 認証チェック後に適切にフィルタしたデータを返す。
 */
import { createClient } from "@supabase/supabase-js";
import type { KoifesUser, KoifesRating, KoifesConnection, KoifesDb } from "./koifes-db";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function toDbUser(row: Record<string, unknown>): KoifesUser {
  const reasons = row.exchange_reason;
  return {
    id: row.id as string,
    code: row.code as string,
    email: row.email as string | undefined,
    fullName: row.full_name as string,
    nickname: row.nickname as string,
    gender: row.gender as string,
    age: row.age as string,
    ageNumber: row.age_number as number,
    height: row.height as string,
    job: row.job as string,
    family: row.family as string,
    siblings: row.siblings as string,
    livingWithFamily: row.living_with_family as string,
    income: row.income as string,
    marriage: row.marriage as string,
    marriageByWhen: row.marriage_by_when as string,
    children: row.children as string,
    childrenByWhen: row.children_by_when as string,
    hobbies: (row.hobbies as string[]) || [],
    values: (row.values as string[]) || [],
    dealbreakers: (row.dealbreakers as string[]) || [],
    eventExp: row.event_exp as string,
    esteem: row.esteem as number,
    resistance: row.resistance as number,
    invest: row.invest as string,
    weakness: row.weakness as string,
    personality: row.personality as string,
    selfImprovement: row.self_improvement as string,
    improvementConfidence: row.improvement_confidence as string,
    barrierChange: row.barrier_change as string,
    stayTokushima: row.stay_tokushima as string,
    leaveReason: row.leave_reason as string,
    stayConditions: (row.stay_conditions as string[]) || [],
    buyHouse: row.buy_house as string,
    housingConditions: (row.housing_conditions as string[]) || [],
    companySupport: row.company_support as string,
    unmarriedReasons: (row.unmarried_reasons as string[]) || [],
    createdAt: row.created_at as string,
  };
}

function toDbRating(row: Record<string, unknown>): KoifesRating {
  const from = (row.from_user_id ?? row.from_user ?? row.from) as string;
  const to = (row.to_user_id ?? row.to_user ?? row.to) as string;
  const reasons = row.exchange_reason;
  return {
    id: row.id as string,
    from,
    to,
    impression: row.impression as number,
    ease: row.ease as number,
    again: row.again as string,
    overall: Number(row.overall),
    wantExchange: row.want_exchange as boolean | undefined,
    exchangeReason: Array.isArray(reasons) ? (reasons as string[]) : undefined,
    createdAt: row.created_at as string,
  };
}

function toDbConnection(row: Record<string, unknown>): KoifesConnection {
  const from = (row.from_user_id ?? row.from_user ?? row.from) as string;
  const to = (row.to_user_id ?? row.to_user ?? row.to) as string;
  return {
    id: row.id as string,
    from,
    to,
    createdAt: row.created_at as string,
  };
}

/** 他ユーザー向けの最小限の情報（ニックネーム・写真相当） */
export type PublicUser = { id: string; nickname?: string; age?: string; job?: string };

/**
 * 認証済みユーザー向けの app データを取得。
 * - me: 自分自身のフルプロフィール
 * - users: 接続/評価に関わる他ユーザーの最小限の情報のみ（id, nickname, age, job）
 */
export async function loadAppDataForUser(userId: string): Promise<KoifesDb> {
  const admin = getAdminClient();

  const [connectionsRes, ratingsRes, favoritesRes, meRes] = await Promise.all([
    admin.from("koifes_connections").select("*").or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    admin.from("koifes_ratings").select("*").or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    admin.from("koifes_favorites").select("*").eq("user_id", userId),
    admin.from("koifes_users").select("*").eq("id", userId).maybeSingle(),
  ]);

  const connections = (connectionsRes.data || []).map((r) => toDbConnection(r as Record<string, unknown>));
  const ratings = (ratingsRes.data || []).map((r) => toDbRating(r as Record<string, unknown>));
  const favorites = (favoritesRes.data || []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    userId: f.user_id as string,
    favoriteUserId: f.favorite_user_id as string,
  }));

  const me = meRes.data ? toDbUser(meRes.data as Record<string, unknown>) : null;
  if (!me) {
    return { users: [], ratings, connections, favorites };
  }

  const peerIds = new Set<string>();
  for (const c of connections) {
    if (c.from !== userId) peerIds.add(c.from);
    if (c.to !== userId) peerIds.add(c.to);
  }
  for (const r of ratings) {
    if (r.from !== userId) peerIds.add(r.from);
    if (r.to !== userId) peerIds.add(r.to);
  }
  peerIds.delete(userId);

  let users: (KoifesUser | PublicUser)[] = [me];
  if (peerIds.size > 0) {
    const { data: peerRows } = await admin
      .from("koifes_users")
      .select("id, nickname, age, job")
      .in("id", Array.from(peerIds));
    const peers: PublicUser[] = (peerRows || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      nickname: r.nickname as string | undefined,
      age: r.age as string | undefined,
      job: r.job as string | undefined,
    }));
    users = [me, ...peers];
  }

  return { users, ratings, connections, favorites };
}

/**
 * コードでユーザーを検索。認証済みユーザーのみ利用可。
 * 有効なコードが渡された場合、そのユーザーのフルプロフィールを返す（QRスキャン後の表示用）。
 */
export async function lookupUserByCode(code: string): Promise<KoifesUser | null> {
  const admin = getAdminClient();
  const codeNorm = String(code || "").trim().toUpperCase();
  if (codeNorm.length < 4) return null;
  const { data, error } = await admin
    .from("koifes_users")
    .select("*")
    .eq("code", codeNorm)
    .maybeSingle();
  if (error || !data) return null;
  return toDbUser(data as Record<string, unknown>);
}

/**
 * 指定ユーザーのフルプロフィールを取得。
 * - 本人である場合
 * - または connections に含まれる相手である場合 にのみ返す。
 */
export async function getFullProfileIfAllowed(
  requestorId: string,
  targetId: string
): Promise<KoifesUser | null> {
  if (requestorId === targetId) {
    const admin = getAdminClient();
    const { data } = await admin.from("koifes_users").select("*").eq("id", targetId).maybeSingle();
    return data ? toDbUser(data as Record<string, unknown>) : null;
  }
  const admin = getAdminClient();
  const { data: conns } = await admin
    .from("koifes_connections")
    .select("from_user_id, to_user_id")
    .or(`from_user_id.eq.${requestorId},to_user_id.eq.${requestorId}`);
  const hasConn =
    Array.isArray(conns) &&
    conns.some((c: { from_user_id: string; to_user_id: string }) => {
      const from = c.from_user_id;
      const to = c.to_user_id;
      return (from === requestorId && to === targetId) || (from === targetId && to === requestorId);
    });
  if (!hasConn) return null;
  const { data } = await admin.from("koifes_users").select("*").eq("id", targetId).maybeSingle();
  return data ? toDbUser(data as Record<string, unknown>) : null;
}
