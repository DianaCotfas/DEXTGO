import "server-only";
import Stripe from "stripe";
import { env, isConfigured, requireEnv } from "@/lib/env";
import { getPublicSiteUrl } from "@/lib/site-url";

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isConfigured("stripe")) return null;
  const secretKey = env.STRIPE_SECRET_KEY;
  const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const isLiveMode = env.STRIPE_MODE === "live";
  const secretPrefix = isLiveMode ? "sk_live_" : "sk_test_";
  const publicPrefix = isLiveMode ? "pk_live_" : "pk_test_";

  if (!secretKey.startsWith(secretPrefix) || !publishableKey.startsWith(publicPrefix)) {
    console.warn(
      `[stripe] STRIPE_MODE=${env.STRIPE_MODE} but keys do not match expected prefixes (${secretPrefix}, ${publicPrefix}).`,
    );
    return null;
  }

  if (cached) return cached;
  cached = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return cached;
}

export const isStripeConfigured = () => isConfigured("stripe");

export const siteUrl = () => getPublicSiteUrl();
