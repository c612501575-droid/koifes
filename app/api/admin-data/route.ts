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
    const [usersRes, ratingsRes, surveysRes, favoritesRes, followupsRes, connectionsRes] = await Promise.all([
      adminClient.from("koifes_users").select("*"),
      adminClient.from("koifes_ratings").select("*"),
      adminClient.from("koifes_post_surveys").select("*"),
      adminClient.from("koifes_favorites").select("*"),
      adminClient.from("koifes_followups").select("*"),
      adminClient.from("koifes_connections").select("*"),
    ]);

    return NextResponse.json({
      users: usersRes.data || [],
      ratings: ratingsRes.data || [],
      surveys: surveysRes.data || [],
      favorites: favoritesRes.data || [],
      followups: followupsRes.data || [],
      connections: connectionsRes.data || [],
    });
  } catch (err) {
    console.error("[admin-data]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
