/**
 * Centralised, typed environment loader.
 *
 * Every Phase 2 integration uses this so the app never crashes when a
 * credential is missing — instead, it logs a structured warning and lets the
 * relevant feature degrade gracefully (e.g. Stripe checkout returns a stub
 * "configure-keys" response, Mapbox falls back to a static image, etc.).
 *
 * Use `requireEnv("KEY")` only inside server-side code paths that absolutely
 * need a value (webhook handlers, admin actions). UI code should always use
 * `env.<KEY>` so previews keep rendering.
 */

const PUBLIC_PREFIX = "NEXT_PUBLIC_";
const stripeModeRaw = (process.env.STRIPE_MODE ?? "test").toLowerCase();

const rawEnv = {
  // Site
  NEXT_PUBLIC_AUTH_REDIRECT_URL:
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ?? "",
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "",

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Stripe
  STRIPE_MODE: stripeModeRaw === "live" ? "live" : "test",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  // Mapbox
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",

  // ElevenLabs
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ?? "",
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID ?? "",

  // OpenAI (used for TTS — cheaper alternative to ElevenLabs)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "hello@dextgo.com",
  RESEND_INBOX_EMAIL: process.env.RESEND_INBOX_EMAIL ?? "info@dextgo.com",
  CONTACT_NOTIFICATION_EMAILS: process.env.CONTACT_NOTIFICATION_EMAILS ?? "",
  RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID ?? "",

  // Cloudflare R2
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? "",
  R2_BUCKET: process.env.R2_BUCKET ?? "dextgo-media",
  NEXT_PUBLIC_R2_PUBLIC_BASE: process.env.NEXT_PUBLIC_R2_PUBLIC_BASE ?? "",
  MEDIA_PROXY_SIGNING_SECRET: process.env.MEDIA_PROXY_SIGNING_SECRET ?? "",
  MEDIA_PROXY_TTL_SECONDS: process.env.MEDIA_PROXY_TTL_SECONDS ?? "31536000",

  // Cloudflare Stream
  CLOUDFLARE_STREAM_API_TOKEN: process.env.CLOUDFLARE_STREAM_API_TOKEN ?? "",
  NEXT_PUBLIC_CLOUDFLARE_STREAM_BASE:
    process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_BASE ?? "",

  // Iubenda
  NEXT_PUBLIC_IUBENDA_SITE_ID: process.env.NEXT_PUBLIC_IUBENDA_SITE_ID ?? "",
  NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID:
    process.env.NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID ?? "",
  NEXT_PUBLIC_IUBENDA_PRIVACY_POLICY_ID:
    process.env.NEXT_PUBLIC_IUBENDA_PRIVACY_POLICY_ID ?? "",
  NEXT_PUBLIC_IUBENDA_TERMS_POLICY_ID:
    process.env.NEXT_PUBLIC_IUBENDA_TERMS_POLICY_ID ?? "",
  NEXT_PUBLIC_IUBENDA_WIDGET_ID: process.env.NEXT_PUBLIC_IUBENDA_WIDGET_ID ?? "",
} as const;

export type EnvKey = keyof typeof rawEnv;

export const env = rawEnv;

export function hasEnv(...keys: EnvKey[]): boolean {
  return keys.every((k) => !!rawEnv[k]);
}

/**
 * Server-only — throws when the key is missing. Use ONLY in code paths that
 * cannot meaningfully run without the credential (e.g. Stripe webhook).
 */
export function requireEnv(key: EnvKey): string {
  const value = rawEnv[key];
  if (!value) {
    throw new Error(
      `[env] Missing required ${key}. Add it to .env.local — see .env.example`,
    );
  }
  return value;
}

const integrationFeatureMap = {
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  supabaseAdmin: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  stripe: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  stripeWebhook: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  mapbox: ["NEXT_PUBLIC_MAPBOX_TOKEN"],
  elevenlabs: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"],
  openaiTts: ["OPENAI_API_KEY"],
  resend: ["RESEND_API_KEY"],
  r2: [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ],
  stream: ["CLOUDFLARE_STREAM_API_TOKEN", "NEXT_PUBLIC_CLOUDFLARE_STREAM_BASE"],
  iubenda: [
    "NEXT_PUBLIC_IUBENDA_SITE_ID",
    "NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID",
  ],
} satisfies Record<string, EnvKey[]>;

export type Integration = keyof typeof integrationFeatureMap;

export function isConfigured(integration: Integration): boolean {
  return hasEnv(...integrationFeatureMap[integration]);
}

export function adminEmailAllowlist(): string[] {
  return rawEnv.ADMIN_EMAILS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const isPublicKey = (key: string) => key.startsWith(PUBLIC_PREFIX);
