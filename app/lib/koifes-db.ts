import { supabase } from "./supabase";

const SK_SESSION = "koifes-v5-session";

export type KoifesUser = {
  id: string;
  code: string;
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

export type KoifesDb = {
  users: KoifesUser[];
  ratings: KoifesRating[];
  connections: KoifesConnection[];
  favorites: KoifesFavorite[];
};

function toDbUser(row: Record<string, unknown>): KoifesUser {
  return {
    id: row.id as string,
    code: row.code as string,
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
    createdAt: row.created_at as string,
  };
}

function toDbRating(row: Record<string, unknown>): KoifesRating {
  return {
    id: row.id as string,
    from: row.from_user_id as string,
    to: row.to_user_id as string,
    impression: row.impression as number,
    ease: row.ease as number,
    again: row.again as string,
    overall: Number(row.overall),
    createdAt: row.created_at as string,
  };
}

function toDbConnection(row: Record<string, unknown>): KoifesConnection {
  return {
    id: row.id as string,
    from: row.from_user_id as string,
    to: row.to_user_id as string,
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
  };
}

export async function load(): Promise<KoifesDb> {
  try {
    const [usersRes, ratingsRes, connectionsRes, favoritesRes] = await Promise.all([
      supabase.from("koifes_users").select("*"),
      supabase.from("koifes_ratings").select("*"),
      supabase.from("koifes_connections").select("*"),
      supabase.from("koifes_favorites").select("*"),
    ]);

    if (usersRes.error) {
      console.error("[koifes-db] load users failed:", usersRes.error.message, usersRes.error.details);
    }
    if (ratingsRes.error) {
      console.error("[koifes-db] load ratings failed:", ratingsRes.error.message, ratingsRes.error.details);
    }
    if (connectionsRes.error) {
      console.error("[koifes-db] load connections failed:", connectionsRes.error.message, connectionsRes.error.details);
    }
    if (favoritesRes.error) {
      console.error("[koifes-db] load favorites failed:", favoritesRes.error.message, favoritesRes.error.details);
    }

    const users = (usersRes.data || []).map(toDbUser);
    const ratings = (ratingsRes.data || []).map(toDbRating);
    const connections = (connectionsRes.data || []).map(toDbConnection);
    const favorites = (favoritesRes.data || []).map((f: Record<string, unknown>) => ({
      id: f.id as string,
      userId: f.user_id as string,
      favoriteUserId: f.favorite_user_id as string,
    }));

    return { users, ratings, connections, favorites };
  } catch (err) {
    console.error("[koifes-db] load failed:", err);
    return { users: [], ratings: [], connections: [], favorites: [] };
  }
}

export async function saveUsers(users: KoifesUser[]): Promise<void> {
  for (const u of users) {
    const row = toRowUser(u);
    await supabase.from("koifes_users").upsert(row, { onConflict: "id" });
  }
}

export async function addUser(user: KoifesUser): Promise<string> {
  const row = toRowUser({ ...user, createdAt: new Date().toISOString() });
  delete (row as Record<string, unknown>).id;
  const { data, error } = await supabase.from("koifes_users").insert(row).select("id").single();
  if (error) {
    console.error("[koifes-db] addUser failed:", error.message, error.details, error.hint);
    throw new Error(`ユーザー登録に失敗しました: ${error.message}`);
  }
  const newId = (data?.id as string) ?? "";
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
    from_user: rating.from,
    to_user: rating.to,
    impression: rating.impression,
    ease: rating.ease,
    again: rating.again != null ? String(rating.again) : null,
    overall: overallScore,
  };
  console.log("[koifes-db] addRating payload:", payload);
  const { error } = await supabase.from("koifes_ratings").insert(payload);
  if (error) {
    console.error("Supabase insert error:", JSON.stringify(error));
    console.error("[koifes-db] addRating failed:", error.message, error.details, { payload });
    throw error;
  }
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
    }
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

export function saveSession(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      localStorage.setItem(SK_SESSION, userId);
    } else {
      localStorage.removeItem(SK_SESSION);
    }
  } catch {}
}

export function loadSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SK_SESSION);
  } catch {
    return null;
  }
}
