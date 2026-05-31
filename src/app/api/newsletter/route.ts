import { NextResponse, type NextRequest } from "next/server";
import { newsletterSchema } from "@/lib/validations";
import { sendNewsletterWelcome } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const supabase = await createSupabaseAdminClient();
    if (supabase) {
      // Upsert keeps re-subscribes idempotent.
      await supabase
        .from("newsletter_subscribers")
        .upsert({ email }, { onConflict: "email" });
    }
  } catch (error) {
    console.error("newsletter: persist failed", error);
  }

  try {
    await sendNewsletterWelcome(email);
  } catch (error) {
    console.error("newsletter: welcome email failed", error);
  }

  return NextResponse.json({ ok: true });
}
