import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicPaths = [
    "/",
    "/book",
    "/login",
    "/register",
    "/auth/callback",
    "/api/stripe",
    "/api/whatsapp",
  ];
  const isPublicPath = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith("/book/") ||
      request.nextUrl.pathname.startsWith("/api/stripe/") ||
      request.nextUrl.pathname.startsWith("/api/whatsapp/"),
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access login/register, redirect to dashboard
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ─── Subscription gating ──────────────────────────────────────────
  // Block dashboard access if subscription is cancelled or incomplete.
  // Settings and expired pages remain accessible so user can reactivate.
  const isDashboardPath = request.nextUrl.pathname.startsWith("/dashboard");
  const gatingExemptPaths = ["/dashboard/settings", "/dashboard/expired"];
  const isGatingExempt = gatingExemptPaths.some(
    (p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`),
  );

  if (user && isDashboardPath && !isGatingExempt) {
    const { data: business } = await supabase
      .from("businesses")
      .select("subscription_status")
      .eq("owner_id", user.id)
      .single();

    const status = business?.subscription_status || "trialing";
    const allowedStatuses = ["active", "trialing", "past_due"];

    if (!allowedStatuses.includes(status)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/expired";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
