import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthRedirectOrigin } from "@/lib/auth-redirect-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeNext(next: string | null) {
  if (!next) return "/account";
  // Prevent open redirects and bad local dev hosts leaking to mobile emails.
  if (/^https?:\/\//i.test(next)) return "/account";
  if (next.startsWith("//")) return "/account";
  if (!next.startsWith("/")) return "/account";
  return next;
}

function authErrorCode(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("expired")) return "link-expired";
  if (lower.includes("invalid")) return "invalid-link";
  if (lower.includes("otp")) return "invalid-link";
  return "auth-failed";
}

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function loginRedirect(
  request: NextRequest,
  error: string,
  detail?: string,
) {
  const target = new URL("/login", resolveAuthRedirectOrigin(request));
  target.searchParams.set("error", error);
  if (detail) target.searchParams.set("detail", detail.slice(0, 180));
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = normalizeNext(url.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return loginRedirect(request, "not-configured");
  }

  let sessionUser: { id: string; email?: string | null } | null = null;
  let error: { message: string } | null = null;

  if (tokenHash && type) {
    const verifyType = type as "signup" | "recovery" | "invite" | "email_change" | "magiclink" | "email";
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: verifyType,
    });
    sessionUser = result.data.user;
    error = result.error ? { message: result.error.message } : null;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    sessionUser = result.data.user;
    error = result.error ? { message: result.error.message } : null;
  } else {
    return loginRedirect(request, "missing-code");
  }

  if (error) {
    // Avoid exposing low-level PKCE internals to end users.
    const detail = error.message.toLowerCase().includes("pkce")
      ? "This confirmation link was opened in a different browser/device. Please request a fresh link and open it in the same browser."
      : error.message;
    return loginRedirect(request, authErrorCode(error.message), detail);
  }

  // Match any existing orders (from payment links sent before account creation)
  // to the newly authenticated user.
  const user = sessionUser;
  if (user?.id && user.email) {
    try {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
      const adminClient = await createSupabaseAdminClient();
      if (adminClient) {
        const normalizedUserEmail = normalizeEmail(user.email);
        const { data: unlinkedOrders } = await adminClient
          .from("orders")
          .select("id, email")
          .is("user_id", null)
          .eq("status", "paid");

        const relinkIds = (unlinkedOrders ?? [])
          .filter((order) => normalizeEmail(order.email) === normalizedUserEmail)
          .map((order) => order.id);

        if (relinkIds.length > 0) {
          await adminClient
            .from("orders")
            .update({ user_id: user.id })
            .in("id", relinkIds);
        }
      }
    } catch {
      // Non-critical — do not block login
    }
  }

  return NextResponse.redirect(new URL(next, resolveAuthRedirectOrigin(request)));
}
