"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Client-side auth landing page for email links that arrive with hash tokens
 * (common in mobile mail apps). Server routes cannot read URL hash fragments.
 */
export default function AuthConfirmClient() {
  const router = useRouter();
  const search = useSearchParams();
  const nextRaw = search.get("next");
  const next = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/account";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) setError("Authentication is not configured.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const code = params.get("code");

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "magiclink" | "signup" | "recovery" | "invite" | "email_change" | "email",
        });
        if (verifyError) {
          if (!cancelled) setError(verifyError.message);
          return;
        }
        if (!cancelled) router.replace(next);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
        if (!cancelled) router.replace(next);
        return;
      }

      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            if (!cancelled) setError(sessionError.message);
            return;
          }
          if (!cancelled) router.replace(next);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (!cancelled) router.replace(next);
        return;
      }

      if (!cancelled) {
        setError("The sign-in link is incomplete or expired. Please request a new one.");
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center px-6">
      <div className="text-center space-y-3 max-w-md">
        {!error ? (
          <>
            <p className="text-sm font-medium text-foreground">Signing you in…</p>
            <p className="text-xs text-foreground/60">Please wait a moment.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-red-600">{error}</p>
            <a href="/login" className="inline-block text-xs font-semibold text-foreground hover:underline">
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
