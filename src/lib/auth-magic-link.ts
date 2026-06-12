import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/site-url";

/**
 * Build a one-click login URL that works across browsers/devices.
 * Uses Supabase admin `hashed_token` + server-side verifyOtp — no PKCE cookie required.
 */
export async function createDirectMagicLink(
  email: string,
  next = "/account",
): Promise<{ url: string } | { error: string }> {
  const admin = await createSupabaseAdminClient();
  if (!admin) {
    return { error: "Admin auth is not configured." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });

  if (result.error) {
    return { error: result.error.message };
  }

  const tokenHash = result.data?.properties?.hashed_token;
  const verifyType = result.data?.properties?.verification_type ?? "magiclink";
  if (!tokenHash) {
    return { error: "Could not generate sign-in link." };
  }

  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: verifyType,
    next,
  });

  return { url: `${getPublicSiteUrl()}/api/auth/callback?${params.toString()}` };
}
