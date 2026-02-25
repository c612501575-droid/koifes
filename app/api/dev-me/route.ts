import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "koifes_dev_user_id";

export async function GET() {
  if (process.env.DEV_BYPASS_4DIGIT !== "1") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, process.env.SUPABASE_SERVICE_ROLE_KEY ? { auth: { persistSession: false } } : undefined);
  const { data, error } = await supabase.from("koifes_users").select("*").eq("id", userId).maybeSingle();
  if (error || !data) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  const u = data as Record<string, unknown>;
  return NextResponse.json({
    ok: true,
    user: {
      id: u.id,
      code: u.code,
      fullName: u.full_name,
      nickname: u.nickname,
      gender: u.gender,
      age: u.age,
      ageNumber: u.age_number,
      height: u.height,
      job: u.job,
      family: u.family,
      siblings: u.siblings,
      livingWithFamily: u.living_with_family,
      income: u.income,
      marriage: u.marriage,
      marriageByWhen: u.marriage_by_when,
      children: u.children,
      childrenByWhen: u.children_by_when,
      hobbies: u.hobbies || [],
      values: u.values || [],
      dealbreakers: u.dealbreakers || [],
      eventExp: u.event_exp,
      esteem: u.esteem,
      resistance: u.resistance,
      invest: u.invest,
      weakness: u.weakness,
      personality: u.personality,
      selfImprovement: u.self_improvement,
      improvementConfidence: u.improvement_confidence,
      barrierChange: u.barrier_change,
      stayTokushima: u.stay_tokushima,
      leaveReason: u.leave_reason,
      stayConditions: u.stay_conditions || [],
      buyHouse: u.buy_house,
      housingConditions: u.housing_conditions || [],
      companySupport: u.company_support,
      unmarriedReasons: u.unmarried_reasons || [],
      createdAt: u.created_at,
    },
  });
}
