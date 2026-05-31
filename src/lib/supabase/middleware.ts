import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isConfigured } from "@/lib/env";

/**
 * Refresh the Supabase auth session on every request that flows through
 * the Next.js middleware. Returns the response so callers can chain extra
 * logic (e.g. redirect protected routes when no session exists).
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  if (!isConfigured("supabase")) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate the dashboard + admin routes when there is no session.
  const path = request.nextUrl.pathname;
  const protectedPath =
    path.startsWith("/account") || path.startsWith("/admin");
  if (protectedPath && !user) {
    const redirect = new URL("/login", request.url);
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  return response;
}
