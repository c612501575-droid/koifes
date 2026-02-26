import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { getFullProfileIfAllowed } from "@/app/lib/koifes-db-server";

const COOKIE_NAME = "koifes_dev_user_id";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetId } = await params;

  if (!targetId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    let userId: string | null = null;

    if (authUser) {
      userId = authUser.id;
    }

    if (!userId && process.env.DEV_BYPASS_4DIGIT === "1") {
      const cookieStore = await cookies();
      const devUserId = cookieStore.get(COOKIE_NAME)?.value;
      if (devUserId) userId = devUserId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getFullProfileIfAllowed(userId, targetId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ user: profile });
  } catch (err) {
    console.error("[user-profile]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
