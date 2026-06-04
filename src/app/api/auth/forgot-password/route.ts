import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isConfigured } from "@/lib/env";
import { getPublicSiteUrl } from "@/lib/site-url";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

function resetRedirectUrl() {
  return `${getPublicSiteUrl()}/api/auth/reset-password`;
}

export async function POST(request: NextRequest) {
  let email = "";
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid email address." },
        { status: 400 },
      );
    }
    email = parsed.data.email.trim().toLowerCase();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const redirectTo = resetRedirectUrl();

  // Always return generic success to avoid account enumeration.
  try {
    const admin = await createSupabaseAdminClient();
    if (admin && isConfigured("resend")) {
      const result = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });

      const actionLink = result.data?.properties?.action_link;
      if (!result.error && actionLink) {
        await sendPasswordResetEmail({
          to: email,
          resetUrl: actionLink,
        });
      }
    } else {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      }
    }
  } catch {
    // Non-blocking; response remains generic.
  }

  return NextResponse.json({ ok: true });
}
