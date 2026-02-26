import { supabase } from "./supabase";

export type KoifesUser = {
  id: string;
  code: string;
  email?: string;
  fullName?: string;
  nickname?: string;
  gender?: string;
  age?: string;
  ageNumber?: number;
  height?: string;
  job?: string;
  family?: string;
  siblings?: string;
  livingWithFamily?: string;
  income?: string;
  marriage?: string;
  marriageByWhen?: string;
  children?: string;
  childrenByWhen?: string;
  hobbies?: string[];
  values?: string[];
  dealbreakers?: string[];
  eventExp?: string;
  esteem?: number;
  resistance?: number;
  invest?: string;
  weakness?: string;
  personality?: string;
  selfImprovement?: string;
  improvementConfidence?: string;
  barrierChange?: string;
  stayTokushima?: string;
  leaveReason?: string;
  stayConditions?: string[];
  buyHouse?: string;
  housingConditions?: string[];
  companySupport?: string;
  unmarriedReasons?: string[];
  createdAt?: string;
};

export type KoifesRating = {
  id: string;
  from: string;
  to: string;
  impression: number;
  ease: number;
  again?: string;
  overall: number;
  wantExchange?: boolean;
  exchangeReason?: string[];
  rejectReason?: string[];
  partnerTags?: string[];
  durationSeconds?: number;
  createdAt: string;
};

export type KoifesConnection = {
  id: string;
  from: string;
  to: string;
  createdAt: string;
};

export type KoifesFavorite = {
  id: string;
  userId: string;
  favoriteUserId: string;
};

/** 他ユーザー向けの最小限の情報（APIで返す） */
export type PublicUser = { id: string; nickname?: string; age?: string; job?: string };

export type KoifesDb = {
  users: (KoifesUser | PublicUser)[];
  ratings: KoifesRating[];
  connections: KoifesConnection[];
  favorites: KoifesFavorite[];
};

function toDbUser(row: Record<string, unknown>): KoifesUser {
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
  const rejectReasons = row.reject_reason;
  const tags = row.partner_tags;
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
    rejectReason: Array.isArray(rejectReasons) ? (rejectReasons as string[]) : undefined,
    partnerTags: Array.isArray(tags) ? (tags as string[]) : undefined,
    durationSeconds: row.duration_seconds as number | undefined,
    createdAt: row.created_at as string,
  };
}

function toDbConnection(row: Record<string, unknown>): KoifesConnection {
  // マイグレーション: from_user_id/to_user_id。本番DBでは from_user/to_user の可能性あり
  const from = (row.from_user_id ?? row.from_user ?? row.from) as string;
  const to = (row.to_user_id ?? row.to_user ?? row.to) as string;
  return {
    id: row.id as string,
    from,
    to,
    createdAt: row.created_at as string,
  };
}

function toRowUser(u: KoifesUser): Record<string, unknown> {
  const esteem = !u.esteem ? 5 : Number(u.esteem) || 5;
  const resistance = !u.resistance ? 5 : Number(u.resistance) || 5;
  const height = u.height === "" || !u.height ? null : u.height;

  return {
    id: u.id,
    code: u.code,
    email: u.email ?? null,
    full_name: u.fullName,
    nickname: u.nickname,
    gender: u.gender,
    age: u.age,
    age_number: u.ageNumber ?? null,
    height,
    job: u.job,
    family: u.family,
    siblings: u.siblings,
    living_with_family: u.livingWithFamily,
    income: u.income,
    marriage: u.marriage,
    marriage_by_when: u.marriageByWhen,
    children: u.children,
    children_by_when: u.childrenByWhen,
    hobbies: u.hobbies || [],
    values: u.values || [],
    dealbreakers: u.dealbreakers || [],
    event_exp: u.eventExp,
    esteem,
    resistance,
    invest: u.invest,
    weakness: u.weakness,
    personality: u.personality,
    self_improvement: u.selfImprovement,
    improvement_confidence: u.improvementConfidence,
    barrier_change: u.barrierChange,
    stay_tokushima: u.stayTokushima,
    leave_reason: u.leaveReason,
    stay_conditions: u.stayConditions || [],
    buy_house: u.buyHouse,
    housing_conditions: u.housingConditions || [],
    company_support: u.companySupport,
    unmarried_reasons: u.unmarriedReasons || [],
  };
}

/**
 * 認証済みユーザー向けの app データを API 経由で取得。
 * 他ユーザーは最小限の情報（id, nickname, age, job）のみ返る。
 */
export async function load(): Promise<KoifesDb> {
  try {
    const res = await fetch("/api/app-data", { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) {
        return { users: [], ratings: [], connections: [], favorites: [] };
      }
      throw new Error(`load failed: ${res.status}`);
    }
    const data = await res.json();
    return {
      users: data.users || [],
      ratings: data.ratings || [],
      connections: data.connections || [],
      favorites: data.favorites || [],
    };
  } catch (err) {
    console.error("[koifes-db] load failed:", err);
    return { users: [], ratings: [], connections: [], favorites: [] };
  }
}

/**
 * @deprecated セキュリティのため load() を API 経由に変更済み。互換用に残す。
 */
export async function loadDirect(): Promise<KoifesDb> {
  try {
    const [usersRes, ratingsRes, connectionsRes, favoritesRes] = await Promise.all([
      supabase.from("koifes_users").select("*"),
      supabase.from("koifes_ratings").select("*"),
      supabase.from("koifes_connections").select("*"),
      supabase.from("koifes_favorites").select("*"),
    ]);

    const users = (usersRes.data || []).map((r) => toDbUser(r as Record<string, unknown>));
    const ratings = (ratingsRes.data || []).map((r) => toDbRating(r as Record<string, unknown>));
    const connections = (connectionsRes.data || []).map((r) => toDbConnection(r as Record<string, unknown>));
    const favorites = (favoritesRes.data || []).map((f: Record<string, unknown>) => ({
      id: f.id as string,
      userId: f.user_id as string,
      favoriteUserId: f.favorite_user_id as string,
    }));

    return { users, ratings, connections, favorites };
  } catch (err) {
    console.error("[koifes-db] loadDirect failed:", err);
    return { users: [], ratings: [], connections: [], favorites: [] };
  }
}

export async function saveUsers(users: KoifesUser[]): Promise<void> {
  for (const u of users) {
    const row = toRowUser(u);
    await supabase.from("koifes_users").upsert(row, { onConflict: "id" });
  }
}

/** auth.uid() またはメールで koifes_users を検索（認証後のユーザー取得用） */
export async function getKoifesUserByAuthId(authId: string): Promise<KoifesUser | null> {
  const { data, error } = await supabase
    .from("koifes_users")
    .select("*")
    .eq("id", authId)
    .maybeSingle();
  if (error) {
    console.error("[koifes-db] getKoifesUserByAuthId failed:", error.message);
    return null;
  }
  if (!data) return null;
  return toDbUser(data as Record<string, unknown>);
}

/** メールアドレスで koifes_users を検索 */
export async function getUserByEmail(email: string): Promise<KoifesUser | null> {
  const { data, error } = await supabase
    .from("koifes_users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error) {
    console.error("[koifes-db] getUserByEmail failed:", error.message);
    return null;
  }
  if (!data) return null;
  return toDbUser(data as Record<string, unknown>);
}

/**
 * 新規ユーザーを追加。id を渡す場合は auth.uid() を指定（新規登録時）。
 * id を渡さない場合は DB が UUID を自動生成（従来互換）。
 */
export async function addUser(user: KoifesUser): Promise<string> {
  const row = toRowUser({ ...user, createdAt: new Date().toISOString() });
  const id = user.id;
  if (id) {
    (row as Record<string, unknown>).id = id;
  } else {
    delete (row as Record<string, unknown>).id;
  }
  const { data, error } = await supabase.from("koifes_users").insert(row).select("id").single();
  if (error) {
    console.error("[koifes-db] addUser failed:", error.message, error.details, error.hint);
    throw new Error(`ユーザー登録に失敗しました: ${error.message}`);
  }
  const newId = (data?.id as string) ?? id ?? "";
  console.log("[koifes-db] addUser success:", newId);
  return newId;
}

export async function updateUser(user: KoifesUser): Promise<void> {
  const row = toRowUser(user);
  const { error } = await supabase.from("koifes_users").update(row).eq("id", user.id);
  if (error) {
    console.error("[koifes-db] updateUser failed:", error.message, error.details);
    throw new Error(`プロフィール更新に失敗しました: ${error.message}`);
  }
}

export async function addRating(rating: KoifesRating): Promise<void> {
  const overallScore = Math.round(((rating.impression + rating.ease + (Number(rating.again) || 0)) / 3) * 10) / 10;
  const payload = {
    from_user_id: rating.from,
    to_user_id: rating.to,
    impression: rating.impression,
    ease: rating.ease,
    again: rating.again != null ? String(rating.again) : null,
    overall: overallScore,
    want_exchange: rating.wantExchange ?? null,
    exchange_reason: (rating.exchangeReason && rating.exchangeReason.length > 0) ? rating.exchangeReason : null,
    reject_reason: (rating.rejectReason && rating.rejectReason.length > 0) ? rating.rejectReason : null,
    partner_tags: (rating.partnerTags && rating.partnerTags.length > 0) ? rating.partnerTags : null,
    duration_seconds: rating.durationSeconds ?? null,
  };
  console.log("[koifes-db] addRating payload:", payload);
  const { error } = await supabase.from("koifes_ratings").insert(payload);
  if (error) {
    console.error("Supabase insert error:", JSON.stringify(error));
    console.error("[koifes-db] addRating failed:", error.message, error.details, { payload });
    throw error;
  }
}

export async function updateRatingExchange(ratingId: string, wantExchange: boolean, reasons: string[]): Promise<void> {
  const update = {
    want_exchange: wantExchange,
    exchange_reason: wantExchange && reasons.length > 0 ? reasons : null,
    reject_reason: !wantExchange && reasons.length > 0 ? reasons : null,
  };
  const { error } = await supabase
    .from("koifes_ratings")
    .update(update)
    .eq("id", ratingId);
  if (error) {
    console.error("[koifes-db] updateRatingExchange failed:", error.message);
    throw new Error(`更新に失敗しました: ${error.message}`);
  }
}

export async function updateRating(rating: KoifesRating): Promise<void> {
  const overallScore = Math.round(((rating.impression + rating.ease + (Number(rating.again) || 0)) / 3) * 10) / 10;
  const { error } = await supabase
    .from("koifes_ratings")
    .update({
      impression: rating.impression,
      ease: rating.ease,
      again: rating.again != null ? String(rating.again) : null,
      overall: overallScore,
      want_exchange: rating.wantExchange ?? null,
      exchange_reason: (rating.exchangeReason && rating.exchangeReason.length > 0) ? rating.exchangeReason : null,
      reject_reason: (rating.rejectReason && rating.rejectReason.length > 0) ? rating.rejectReason : null,
      partner_tags: (rating.partnerTags && rating.partnerTags.length > 0) ? rating.partnerTags : null,
      duration_seconds: rating.durationSeconds ?? null,
    })
    .eq("id", rating.id);
  if (error) {
    console.error("[koifes-db] updateRating failed:", error.message);
    throw new Error(`更新に失敗しました: ${error.message}`);
  }
}

/** from_user + to_user で既存の rating を取得 */
export async function getRatingByFromTo(fromId: string, toId: string): Promise<KoifesRating | null> {
  const { data, error } = await supabase
    .from("koifes_ratings")
    .select("*")
    .eq("from_user_id", fromId)
    .eq("to_user_id", toId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toDbRating(data as Record<string, unknown>);
}

export async function addConnection(conn: KoifesConnection): Promise<void> {
  const { error } = await supabase.from("koifes_connections").insert({
    from_user_id: conn.from,
    to_user_id: conn.to,
  });

  if (error) {
    // 重複時は無視（UNIQUE制約違反）
    if (error.code !== "23505") {
      console.error("[koifes-db] addConnection failed:", error.message, error.details);
      throw error;
    }
  } else {
    console.log("[koifes-db] addConnection success:", conn.from, "->", conn.to);
  }
}

export async function toggleFavorite(userId: string, favoriteUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from("koifes_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("favorite_user_id", favoriteUserId)
    .maybeSingle();

  if (data) {
    await supabase.from("koifes_favorites").delete().eq("id", data.id);
    return false;
  } else {
    const { error } = await supabase.from("koifes_favorites").insert({
      user_id: userId,
      favorite_user_id: favoriteUserId,
    });
    if (error) {
      console.error("[koifes-db] toggleFavorite insert failed:", error.message);
      throw new Error("お気に入りの追加に失敗しました");
    }
    return true;
  }
}

/**
 * @deprecated Supabase Auth セッションに移行済み。互換のため no-op。
 */
export function saveSession(_userId: string | null): void {}

/**
 * @deprecated Supabase Auth セッションに移行済み。互換のため常に null を返す。
 */
export function loadSession(): string | null {
  return null;
}
