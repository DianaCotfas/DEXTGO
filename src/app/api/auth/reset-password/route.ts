import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthRedirectOrigin } from "@/lib/auth-redirect-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase redirects here after the user clicks a password-reset email link.
 * The PKCE code is exchanged for a session, then we redirect to the change-
 * password page where the user can enter their new password.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=not-configured", resolveAuthRedirectOrigin(request)));
  }

  let error: { message: string } | null = null;
  if (tokenHash && type) {
    const verifyType = type as "recovery" | "signup" | "magiclink" | "invite" | "email_change" | "email";
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: verifyType,
    });
    error = result.error ? { message: result.error.message } : null;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error ? { message: result.error.message } : null;
  } else {
    return NextResponse.redirect(new URL("/login?error=missing-code", resolveAuthRedirectOrigin(request)));
  }

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=invalid-link&detail=${encodeURIComponent(error.message)}`, resolveAuthRedirectOrigin(request)),
    );
  }

  return NextResponse.redirect(new URL("/account/settings?reset=1", resolveAuthRedirectOrigin(request)));
}
