import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/app/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const PROTECTED_PATHS = ["/app", "/register", "/followup", "/post-survey"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Supabase セッション更新
  let response = await updateSession(request);

  // 公開ルート
  if (pathname === "/" || pathname === "/login" || pathname === "/admin/login") {
    return response;
  }

  // 2. /admin 配下（/admin/login 以外）: 管理者チェック
  if (pathname.startsWith("/admin")) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  // 3. 一般保護ルート（/app, /register, /followup, /post-survey）
  if (isProtected(pathname)) {
    // 開発用: 4桁コードバイパス（DEV_BYPASS_4DIGIT=1 のとき）
    if (process.env.DEV_BYPASS_4DIGIT === "1") {
      const devUserId = request.cookies.get("koifes_dev_user_id")?.value;
      if (devUserId) {
        return response;
      }
    }
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
