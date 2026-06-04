"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicSiteUrl } from "@/lib/site-url";

type Mode = "magic" | "password";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextRaw = search.get("next");
  const next = nextRaw && nextRaw.startsWith("/") ? nextRaw : "/account";
  const siteUrl = getPublicSiteUrl();
  const callbackCode = search.get("error");
  const callbackDetail = search.get("detail");

  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured.");
      return;
    }

    startTransition(async () => {
      if (mode === "magic") {
        if (!/^https?:\/\//i.test(siteUrl)) {
          setError(
            "Magic link is not configured correctly. Set NEXT_PUBLIC_AUTH_REDIRECT_URL (or NEXT_PUBLIC_SITE_URL) to your live website URL.",
          );
          return;
        }
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (err) {
          setError(err.message);
          return;
        }
        setMessage("Check your inbox for a sign-in link.");
        return;
      }

      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex gap-2 p-1 rounded-full bg-white border border-black/[0.06] text-xs font-medium">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`flex-1 px-3 py-1.5 rounded-full transition-colors ${
            mode === "magic" ? "bg-[#1D1D1F] text-white" : "text-foreground/60"
          }`}
        >
          Magic link
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 px-3 py-1.5 rounded-full transition-colors ${
            mode === "password" ? "bg-[#1D1D1F] text-white" : "text-foreground/60"
          }`}
        >
          Password
        </button>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-foreground/70">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
          placeholder="you@example.com"
        />
      </label>

      {mode === "password" && (
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground/70">Password</span>
            <Link
              href="/forgot-password"
              className="text-xs text-foreground/55 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-3 flex items-center text-foreground/45 hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && callbackCode && (
        <p className="text-sm text-red-600">{mapCallbackError(callbackCode, callbackDetail)}</p>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#1D1D1F] text-white text-sm font-semibold py-3 hover:bg-[#1D1D1F]/90 disabled:opacity-60 transition-colors"
      >
        {pending ? "Working…" : mode === "magic" ? "Send link" : "Sign in"}
      </button>

      <p className="text-center text-xs text-foreground/60">
        New to DEXTGO?{" "}
        <Link href="/signup" className="font-semibold text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

function mapCallbackError(code: string, detail: string | null): string {
  if (code === "missing-code") return "The sign-in link is incomplete. Please request a new one.";
  if (code === "not-configured") {
    return "Authentication is not configured yet on this deployment.";
  }
  if (code === "link-expired") return "This magic link expired. Request a new sign-in link.";
  if (code === "invalid-link") {
    return "This magic link is invalid or already used. Request a new one.";
  }
  if (detail) return detail;
  return "Sign-in failed. Please try again.";
}
