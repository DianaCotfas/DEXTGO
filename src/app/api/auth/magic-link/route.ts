import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createDirectMagicLink } from "@/lib/auth-magic-link";
import { sendPasswordResetEmail } from "@/lib/email";
import { isConfigured } from "@/lib/env";
import { getPublicSiteUrl } from "@/lib/site-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

function normalizeNext(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/account";
  if (/^https?:\/\//i.test(next)) return "/account";
  return next;
}

export async function POST(request: NextRequest) {
  let email = "";
  let next = "/account";

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid email address." },
        { status: 400 },
      );
    }
    email = parsed.data.email.trim().toLowerCase();
    next = normalizeNext(parsed.data.next);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  // Always return generic success to avoid account enumeration.
  try {
    const linkResult = await createDirectMagicLink(email, next);
    if ("url" in linkResult && isConfigured("resend")) {
      await sendPasswordResetEmail({
        to: email,
        resetUrl: linkResult.url,
      });
    } else {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${getPublicSiteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
          },
        });
      }
    }
  } catch {
    // Non-blocking; response remains generic.
  }

  return NextResponse.json({ ok: true });
}
