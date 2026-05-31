"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextRaw = search.get("next");
  const next = nextRaw && nextRaw.startsWith("/") ? nextRaw : "/account";
  const browserOriginRaw =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const browserHost =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const configuredAuthOriginRaw =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL?.trim() ?? "";
  const configuredAuthOrigin = configuredAuthOriginRaw.replace(/\/$/, "");
  const configuredOriginRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const configuredOrigin = configuredOriginRaw.replace(/\/$/, "");
  const isLocalBrowserHost = ["0.0.0.0", "127.0.0.1", "localhost"].includes(browserHost);
  const browserOrigin = isLocalBrowserHost ? "" : browserOriginRaw;
  const siteUrl = configuredAuthOrigin || browserOrigin || configuredOrigin;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
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
      if (!/^https?:\/\//i.test(siteUrl)) {
        setError(
          "Email confirmation is not configured correctly. Set NEXT_PUBLIC_AUTH_REDIRECT_URL (or NEXT_PUBLIC_SITE_URL) to your live website URL.",
        );
        return;
      }
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (err) {
        setError(
          err.message.toLowerCase().includes("rate limit")
            ? "Email rate limit exceeded. Please wait a few minutes before requesting another confirmation email, or log in if you already created the account."
            : err.message,
        );
        return;
      }
      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }
      setSubmittedEmail(email);
      setMessage("Account created — check your inbox to confirm your email.");
    });
  }

  if (submittedEmail) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <MailCheck className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Check your email
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/65">
          We sent a confirmation link to <strong>{submittedEmail}</strong>.
          Open it to activate your DEXTGO account, then continue to your
          itinerary.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-foreground/55">
          If the link opens the wrong domain, the Supabase Site URL / Redirect
          URL still needs to be updated to the production website.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-full bg-[#1D1D1F] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to login
          </Link>
          <button
            type="button"
            onClick={() => setSubmittedEmail(null)}
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            Use another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="text-xs font-medium text-foreground/70">Full name</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
          placeholder="Diana Cotfas"
        />
      </label>
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
      <label className="block">
        <span className="text-xs font-medium text-foreground/70">Password</span>
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#1D1D1F] text-white text-sm font-semibold py-3 hover:bg-[#1D1D1F]/90 disabled:opacity-60 transition-colors"
      >
        {pending ? "Working…" : "Create account"}
      </button>

      <p className="text-center text-xs text-foreground/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
