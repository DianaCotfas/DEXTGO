"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { env, isConfigured } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (!isConfigured("supabase")) return null;
  if (cached) return cached;
  cached = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return cached;
}
