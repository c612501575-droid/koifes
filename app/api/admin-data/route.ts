import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/app/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminEmails = getAdminEmails();
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const [usersRes, ratingsRes, surveysRes, favoritesRes, followupsRes, connectionsRes, contactExchangesRes] = await Promise.all([
      adminClient.from("koifes_users").select("*"),
      adminClient.from("koifes_ratings").select("*"),
      adminClient.from("koifes_post_surveys").select("*"),
      adminClient.from("koifes_favorites").select("*"),
      adminClient.from("koifes_followups").select("*"),
      adminClient.from("koifes_connections").select("*"),
      adminClient.from("koifes_contact_exchanges").select("*"),
    ]);

    const users = usersRes.data || [];
    const ratings = ratingsRes.data || [];

    const avgRatingByUser: Record<string, number> = {};
    const wantReceivedByUser: Record<string, number> = {};
    const wantGivenByUser: Record<string, number> = {};
    for (const u of users) {
      const id = String(u.id);
      const toMe = ratings.filter((r: { to_user_id: string }) => r.to_user_id === id);
      const byMe = ratings.filter((r: { from_user_id: string }) => r.from_user_id === id);
      if (toMe.length) {
        avgRatingByUser[id] = toMe.reduce((s: number, r: { overall?: number }) => s + Number(r.overall || 0), 0) / toMe.length;
      }
      wantReceivedByUser[id] = ratings.filter((r: { to_user_id: string; want_exchange: boolean }) => r.to_user_id === id && r.want_exchange === true).length;
      wantGivenByUser[id] = byMe.filter((r: { want_exchange: boolean }) => r.want_exchange === true).length;
    }

    const mutualMatches: Array<{ a: string; b: string; aScore?: number; bScore?: number; aReason?: string[]; bReason?: string[]; createdAt?: string }> = [];
    const seen = new Set<string>();
    for (const r of ratings) {
      if (r.want_exchange !== true) continue;
      const from = String(r.from_user_id);
      const to = String(r.to_user_id);
      const rev = ratings.find((x: { from_user_id: string; to_user_id: string }) => x.from_user_id === to && x.to_user_id === from && x.want_exchange === true);
      if (!rev) continue;
      const pairKey = [from, to].sort().join(",");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      mutualMatches.push({
        a: from,
        b: to,
        aScore: r.overall,
        bScore: rev.overall,
        aReason: r.exchange_reason,
        bReason: rev.exchange_reason,
        createdAt: r.created_at,
      });
    }

    const byGender = (g: string) => users.filter((u: { gender?: string }) => u.gender === g);
    const popularityByReceived = (gender: string) =>
      byGender(gender)
        .map((u) => ({ id: u.id, count: wantReceivedByUser[String(u.id)] || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    const popularityByAvgRating = (gender: string) =>
      byGender(gender)
        .filter((u) => avgRatingByUser[String(u.id)] != null)
        .map((u) => ({ id: u.id, avg: avgRatingByUser[String(u.id)]! }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 20);

    const popularityRanking = {
      male: { byReceived: popularityByReceived("男性"), byAvgRating: popularityByAvgRating("男性") },
      female: { byReceived: popularityByReceived("女性"), byAvgRating: popularityByAvgRating("女性") },
    };

    const mutualCountByUser: Record<string, number> = {};
    for (const m of mutualMatches) {
      mutualCountByUser[m.a] = (mutualCountByUser[m.a] || 0) + 1;
      mutualCountByUser[m.b] = (mutualCountByUser[m.b] || 0) + 1;
    }

    const topPartnerTagsByUser: Record<string, string[]> = {};
    for (const u of users) {
      const id = String(u.id);
      const toMe = ratings.filter((r: { to_user_id: string; partner_tags?: string[] }) => r.to_user_id === id && Array.isArray(r.partner_tags) && r.partner_tags.length);
      const tagCount: Record<string, number> = {};
      for (const r of toMe) {
        for (const t of (r.partner_tags as string[]) || []) {
          tagCount[t] = (tagCount[t] || 0) + 1;
        }
      }
      topPartnerTagsByUser[id] = Object.entries(tagCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([t]) => t);
    }

    return NextResponse.json({
      users: usersRes.data || [],
      ratings: ratingsRes.data || [],
      surveys: surveysRes.data || [],
      favorites: favoritesRes.data || [],
      followups: followupsRes.data || [],
      connections: connectionsRes.data || [],
      contactExchanges: contactExchangesRes.data || [],
      aggregates: {
        avgRatingByUser,
        wantReceivedByUser,
        wantGivenByUser,
        mutualCountByUser,
        topPartnerTagsByUser,
        mutualMatches,
        popularityRanking,
      },
    });
  } catch (err) {
    console.error("[admin-data]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
