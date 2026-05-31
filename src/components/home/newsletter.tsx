"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CheckCircle, Sparkles } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      setError("Please confirm you have read and accept the Privacy Policy.");
      return;
    }
    if (!email) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Subscription failed.");
      }
      setIsSubmitted(true);
      setEmail("");
      setAgree(false);
      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-padding pt-8 pb-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-white px-6 sm:px-12 py-10 sm:py-12">
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 w-11 h-11 rounded-full bg-[#F5F5F7] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#1D1D1F]" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
              Stay Inspired
            </h2>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              Join our inner circle for exclusive destination launches, travel
              design insights, and stories from the road.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-4 max-w-md mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 h-12 px-5 rounded-full bg-white border border-black/[0.08] text-[#1D1D1F] text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#1D1D1F]/40 focus:ring-2 focus:ring-[#1D1D1F]/10 transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={isSubmitted || isSubmitting}
                  className="h-12 px-7 bg-[#1D1D1F] text-white text-sm font-semibold rounded-full hover:bg-[#1D1D1F]/90 transition-all duration-300 flex items-center justify-center gap-2 shrink-0 disabled:opacity-70 hover:scale-[1.02]"
                >
                  {isSubmitted ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Subscribed!
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Send className="w-4 h-4 animate-pulse" />
                      Subscribing…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Subscribe
                    </>
                  )}
                </button>
              </div>

              <label className="flex items-start gap-3 text-left text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-black/20 accent-[#1D1D1F]"
                  required
                />
                <span>
                  I have read and accept the{" "}
                  <Link
                    href="/privacy"
                    className="underline hover:no-underline text-[#1D1D1F]"
                  >
                    Privacy Policy
                  </Link>
                  . I consent to receive DEXTGO&apos;s newsletter and I may
                  unsubscribe at any time.
                </span>
              </label>

              {error && (
                <p className="text-xs text-red-600 text-left" role="alert">
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
