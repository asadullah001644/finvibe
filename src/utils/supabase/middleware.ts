import { createServerClient } from "@supabase/ssr";
import { getSessionUserFromClient } from "@/lib/supabaseSession";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname) || pathname.startsWith("/auth/");
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function applyResponseCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }

  return to;
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const user = await getSessionUserFromClient(supabase);

  const pathname = request.nextUrl.pathname;

  if (user && isPublicRoute(pathname) && pathname !== "/reset-password") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return applyResponseCookies(
      supabaseResponse,
      NextResponse.redirect(url),
    );
  }

  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return applyResponseCookies(
      supabaseResponse,
      NextResponse.redirect(url),
    );
  }

  if (user && !isPublicRoute(pathname)) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_disabled")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profile?.is_disabled) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("disabled", "1");
      return applyResponseCookies(
        supabaseResponse,
        NextResponse.redirect(url),
      );
    }

    if (isAdminRoute(pathname)) {
      const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
      const emailIsSuperAdmin =
        adminEmail && user.email?.trim().toLowerCase() === adminEmail;

      const roleIsSuperAdmin =
        !profileError && profile?.role === "super_admin" && !profile.is_disabled;

      if (!emailIsSuperAdmin && !roleIsSuperAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return applyResponseCookies(
          supabaseResponse,
          NextResponse.redirect(url),
        );
      }
    }
  }

  return supabaseResponse;
}
