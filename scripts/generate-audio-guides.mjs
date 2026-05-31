import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const dryRun = args.has("--dry-run");
const limitArg = [...args].find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1] ?? "", 10) : undefined;

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[audio-gen] Missing required env keys: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const voiceId = process.env.ELEVENLABS_VOICE_ID;
const elevenApiKey = process.env.ELEVENLABS_API_KEY;
const r2Bucket = process.env.R2_BUCKET;

function textForStep(step) {
  return (step.description_long || step.body || "").trim();
}

function splitText(input, maxChars = 4200) {
  const text = (input || "").trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      const sentenceParts = para.split(/(?<=[.!?])\s+/);
      for (const sentence of sentenceParts) {
        if (!sentence) continue;
        if ((current + " " + sentence).trim().length > maxChars) {
          if (current) chunks.push(current.trim());
          current = sentence;
        } else {
          current = `${current} ${sentence}`.trim();
        }
      }
      continue;
    }

    if ((current + "\n\n" + para).trim().length > maxChars) {
      if (current) chunks.push(current.trim());
      current = para;
    } else {
      current = `${current}${current ? "\n\n" : ""}${para}`;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeChunk(text, attempt = 1) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": elevenApiKey,
      accept: "audio/mpeg",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < 4) {
      const wait = attempt * 2000;
      console.warn(`[audio-gen] ElevenLabs ${res.status}, retrying in ${wait}ms`);
      await delay(wait);
      return synthesizeChunk(text, attempt + 1);
    }
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 240)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function synthesizeStepAudio(text) {
  const chunks = splitText(text);
  if (chunks.length === 0) throw new Error("Empty text");
  const rendered = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const part = chunks[i];
    console.log(`[audio-gen]   chunk ${i + 1}/${chunks.length} (${part.length} chars)`);
    const buffer = await synthesizeChunk(part);
    rendered.push(buffer);
    if (i < chunks.length - 1) await delay(350);
  }
  return Buffer.concat(rendered);
}

async function main() {
  const { data, error } = await supabase
    .from("itinerary_steps")
    .select("id, title, position, day, body, description_long, audio_url")
    .order("itinerary_id", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw error;

  const candidates = (data ?? []).filter((step) => {
    const hasText = textForStep(step).length > 0;
    if (!hasText) return false;
    if (force) return true;
    return !step.audio_url;
  });

  const queue = typeof limit === "number" && Number.isFinite(limit)
    ? candidates.slice(0, Math.max(0, limit))
    : candidates;

  console.log(
    `[audio-gen] ${queue.length} steps queued (force=${force}, dryRun=${dryRun}, total=${data?.length ?? 0})`,
  );
  if (queue.length === 0) return;

  let ok = 0;
  let failed = 0;
  for (const step of queue) {
    const text = textForStep(step);
    const key = `audio/step-${step.id}.mp3`;
    console.log(`[audio-gen] processing "${step.title}" (${step.id})`);
    try {
      if (dryRun) {
        console.log(`[audio-gen]   dry-run: would create ${key}`);
        ok += 1;
        continue;
      }
      const buffer = await synthesizeStepAudio(text);
      await s3.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: buffer,
          ContentType: "audio/mpeg",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      const { error: updateError } = await supabase
        .from("itinerary_steps")
        .update({ audio_url: key })
        .eq("id", step.id);
      if (updateError) throw updateError;
      ok += 1;
      console.log(`[audio-gen]   done (${Math.round(buffer.length / 1024)} KB)`);
      await delay(300);
    } catch (err) {
      failed += 1;
      console.error(`[audio-gen]   failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[audio-gen] completed: ok=${ok}, failed=${failed}`);
  if (failed > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error(`[audio-gen] fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
