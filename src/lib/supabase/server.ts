import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { env, isConfigured } from "@/lib/env";

/**
 * Server-side Supabase client. Reads session cookies via Next's cookie store.
 * Returns `null` when Supabase is not yet configured so callers can fall back
 * to static data or render a "not connected" state instead of crashing.
 */
export async function createSupabaseServerClient() {
  if (!isConfigured("supabase")) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll() may be invoked from a Server Component — ignore.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for trusted server actions (webhooks, admin actions).
 * NEVER use this in code paths that touch user input directly without
 * separate authorization checks; service role bypasses RLS.
 */
export async function createSupabaseAdminClient() {
  if (!isConfigured("supabaseAdmin")) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
