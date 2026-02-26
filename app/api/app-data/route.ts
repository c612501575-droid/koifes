import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { loadAppDataForUser } from "@/app/lib/koifes-db-server";

const COOKIE_NAME = "koifes_dev_user_id";

export async function GET() {
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

    const data = await loadAppDataForUser(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[app-data]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
