import "server-only";
import { env, isConfigured, requireEnv } from "@/lib/env";

const API_BASE = "https://api.elevenlabs.io/v1";

export const isElevenLabsConfigured = () => isConfigured("elevenlabs");

/**
 * Stream TTS audio from ElevenLabs.
 * Returns the raw audio buffer (mp3) ready for upload to R2 + storage on the
 * itinerary step.
 */
export async function generateAudio(params: {
  text: string;
  voiceId?: string;
  modelId?: string;
}): Promise<{ buffer: Buffer; contentType: "audio/mpeg" }> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const voiceId = params.voiceId ?? env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    throw new Error("Missing ELEVENLABS_VOICE_ID — pick a voice in VoiceLab.");
  }

  const res = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      accept: "audio/mpeg",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: params.text,
      model_id: params.modelId ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`ElevenLabs error ${res.status}: ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType: "audio/mpeg" };
}
