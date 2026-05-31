import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { generateSpeech, isTtsConfigured, resolveTtsProvider } from "@/lib/tts";
import { uploadToR2, buildR2Key } from "@/lib/r2";
import { isConfigured } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  stepId: z.string().uuid(),
  text: z.string().min(1),
  force: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    if (!isTtsConfigured()) {
      return NextResponse.json(
        {
          code: "tts-not-configured",
          message:
            "Neither OPENAI_API_KEY nor ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID are set.",
        },
        { status: 503 },
      );
    }
    if (!isConfigured("r2")) {
      return NextResponse.json(
        {
          code: "r2-not-configured",
          message:
            "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.",
        },
        { status: 503 },
      );
    }

    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ code: "bad-request" }, { status: 400 });
    }

    const { stepId, text, force } = parsed.data;

    // Reuse check — avoid regenerating if audio already exists
    if (!force) {
      const supabase =
        (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
      if (supabase) {
        const { data: step } = await supabase
          .from("itinerary_steps")
          .select("audio_url")
          .eq("id", stepId)
          .maybeSingle();
        if (step?.audio_url) {
          return NextResponse.json({ audioKey: step.audio_url, reused: true });
        }
      }
    }

    const provider = resolveTtsProvider();
    const { buffer, contentType } = await generateSpeech({ text, provider });
    const upload = await uploadToR2({
      key: buildR2Key("audio", `step-${stepId}.mp3`),
      body: buffer,
      contentType,
    });

    const supabase =
      (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
    if (supabase) {
      await supabase
        .from("itinerary_steps")
        .update({ audio_url: upload.key })
        .eq("id", stepId);
    }

    return NextResponse.json({ audioUrl: upload.publicUrl, audioKey: upload.key, provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown audio generation error.";
    console.error("[audio-generate] failed", message);
    return NextResponse.json(
      {
        code: "audio-generation-failed",
        message,
      },
      { status: 500 },
    );
  }
}
