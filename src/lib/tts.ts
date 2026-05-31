import "server-only";
import { env, isConfigured } from "@/lib/env";

export type TtsProvider = "elevenlabs" | "openai";

export type TtsResult = { buffer: Buffer; contentType: "audio/mpeg" };

/**
 * Determine which TTS provider to use.
 * Explicit `AUDIO_PROVIDER` env takes precedence.
 * Falls back to whichever keys are present: OpenAI first (cheaper), then ElevenLabs.
 */
export function resolveTtsProvider(): TtsProvider {
  const explicit = (process.env.AUDIO_PROVIDER ?? "").toLowerCase().trim();
  if (explicit === "openai") return "openai";
  if (explicit === "elevenlabs") return "elevenlabs";
  if (isConfigured("openaiTts")) return "openai";
  return "elevenlabs";
}

export function isTtsConfigured(): boolean {
  return isConfigured("openaiTts") || isConfigured("elevenlabs");
}

/**
 * Generate speech audio from text using the configured provider.
 * Checks `audio_url` on the step for reuse before hitting the API.
 */
export async function generateSpeech(params: {
  text: string;
  provider?: TtsProvider;
}): Promise<TtsResult> {
  const provider = params.provider ?? resolveTtsProvider();
  if (provider === "openai") {
    return generateOpenAiTts(params.text);
  }
  // ElevenLabs
  const { generateAudio } = await import("@/lib/elevenlabs");
  return generateAudio({ text: params.text });
}

async function generateOpenAiTts(text: string): Promise<TtsResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const voice = (process.env.OPENAI_TTS_VOICE ?? "alloy").toLowerCase();
  const explicitModel = (process.env.OPENAI_TTS_MODEL ?? "").toLowerCase().trim();
  const candidateModels = explicitModel
    ? [explicitModel]
    : ["tts-1", "gpt-4o-mini-tts"];

  let lastError = "";
  for (const model of candidateModels) {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: "mp3",
      }),
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return { buffer: Buffer.from(arrayBuffer), contentType: "audio/mpeg" };
    }
    const err = await res.text().catch(() => "");
    lastError = `model=${model} status=${res.status} body=${err}`;
  }

  throw new Error(`OpenAI TTS request failed. ${lastError}`);
}
