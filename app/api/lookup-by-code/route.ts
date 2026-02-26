import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { lookupUserByCode } from "@/app/lib/koifes-db-server";

const COOKIE_NAME = "koifes_dev_user_id";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || "";

  if (!code.trim()) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
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

    const user = await lookupUserByCode(code);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.id === userId) {
      return NextResponse.json({ error: "Cannot lookup self" }, { status: 400 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[lookup-by-code]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
