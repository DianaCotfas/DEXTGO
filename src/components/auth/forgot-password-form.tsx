"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    start(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Could not send reset email. Please try again.");
        return;
      }
      setMessage(
        "If an account exists for this email, you will receive a Magic Link shortly. Check your inbox (and spam folder).",
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="text-xs font-medium text-foreground/70">Email address</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
          placeholder="you@example.com"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#1D1D1F] text-white text-sm font-semibold py-3 hover:bg-[#1D1D1F]/90 disabled:opacity-60 transition-colors"
      >
        {pending ? "Sending…" : "Send Magic Link"}
      </button>

      <p className="text-center text-xs text-foreground/60">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
