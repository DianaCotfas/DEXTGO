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
  const chunks = splitTextForTts(
    params.text,
    resolveProviderChunkLimit(provider),
  );
  if (chunks.length === 0) {
    throw new Error("No text provided for audio generation.");
  }
  if (chunks.length === 1) {
    return generateSpeechChunk(chunks[0], provider);
  }

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const result = await generateSpeechChunk(chunk, provider);
    buffers.push(result.buffer);
  }
  return { buffer: Buffer.concat(buffers), contentType: "audio/mpeg" };
}

function resolveProviderChunkLimit(provider: TtsProvider): number {
  const raw =
    provider === "openai"
      ? process.env.OPENAI_TTS_MAX_CHARS
      : process.env.ELEVENLABS_TTS_MAX_CHARS;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 200) return Math.floor(parsed);
  // Conservative defaults to stay below provider payload limits.
  return provider === "openai" ? 3500 : 2200;
}

function splitTextForTts(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  let current = "";
  for (const paragraph of paragraphs) {
    const sentences = paragraph
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sentence of sentences) {
      for (const part of splitOversizedText(sentence, maxChars)) {
        if (!current) {
          current = part;
          continue;
        }
        if (current.length + 1 + part.length <= maxChars) {
          current = `${current} ${part}`;
          continue;
        }
        chunks.push(current);
        current = part;
      }
    }
    if (current && current.length + 1 <= maxChars) {
      current = `${current}\n`;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : splitOversizedText(normalized, maxChars);
}

function splitOversizedText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const parts: string[] = [];
  let remaining = text.trim();

  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf(" ", maxChars);
    if (cut <= 0) cut = maxChars;
    const chunk = remaining.slice(0, cut).trim();
    if (chunk) parts.push(chunk);
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

async function generateSpeechChunk(
  text: string,
  provider: TtsProvider,
): Promise<TtsResult> {
  if (provider === "openai") {
    return generateOpenAiTts(text);
  }
  // ElevenLabs
  const { generateAudio } = await import("@/lib/elevenlabs");
  return generateAudio({ text });
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
