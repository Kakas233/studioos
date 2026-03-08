import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is what keeps httpOnly cookies alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect to sign-in if not authenticated
  const protectedPaths = [
    "/dashboard",
    "/schedule",
    "/accounting",
    "/payouts",
    "/stream-time",
    "/model-insights",
    "/model-lookup",
    "/model-search",
    "/member-lookup",
    "/member-alerts",
    "/chat",
    "/rooms",
    "/users",
    "/billing",
    "/settings",
    "/data-backup",
  ];

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Super admin routes
  if (pathname.startsWith("/super-admin") && pathname !== "/super-admin/login") {
    // Super admin auth check is handled by the page itself
    // since it requires checking the account table
  }

  return supabaseResponse;
}
