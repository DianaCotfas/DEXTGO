"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const PRIVACY_URL =
  process.env.NEXT_PUBLIC_IUBENDA_PRIVACY_URL ||
  "https://www.iubenda.com/privacy-policy/";
const TERMS_URL =
  process.env.NEXT_PUBLIC_IUBENDA_TERMS_URL ||
  "https://www.iubenda.com/terms-and-conditions/";

export function BuyButton({
  itinerarySlug,
  title,
}: {
  itinerarySlug: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showLegal, setShowLegal] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptWithdrawal, setAcceptWithdrawal] = useState(false);

  const canProceed = acceptTerms && acceptWithdrawal;

  function handleBuyClick() {
    setShowLegal(true);
  }

  function handleConfirm() {
    if (!canProceed) return;
    start(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerarySlug }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.code === "auth-required") {
          router.push(`/login?next=${encodeURIComponent(`/itineraries/${itinerarySlug}`)}`);
          return;
        }
        if (body?.code === "not-configured") {
          alert(
            `Payments aren't configured yet. Set STRIPE_MODE and matching Stripe keys in .env.local, then "${title}" checkout will be live.`,
          );
          return;
        }
        alert(body?.message ?? "Something went wrong, please try again.");
        return;
      }
      const { url } = await res.json();
      if (url) window.location.assign(url);
    });
  }

  if (!showLegal) {
    return (
      <button
        type="button"
        onClick={handleBuyClick}
        className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#1D1D1F]/90"
      >
        Buy itinerary
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-[#FAFAFA] p-4 space-y-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
        Before you pay, please confirm:
      </p>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
        />
        <span className="text-xs text-foreground/75 leading-relaxed">
          I accept the{" "}
          <a href={TERMS_URL} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            Terms and Conditions
          </a>{" "}
          and the{" "}
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptWithdrawal}
          onChange={(e) => setAcceptWithdrawal(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
        />
        <span className="text-xs text-foreground/75 leading-relaxed">
          I expressly agree that the digital content will be provided immediately after purchase and
          that I lose my 14-day right of withdrawal once I access or download the content.
        </span>
      </label>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => { setShowLegal(false); setAcceptTerms(false); setAcceptWithdrawal(false); }}
          className="rounded-full border border-black/[0.12] bg-white text-foreground/60 text-xs font-semibold px-4 py-2 hover:bg-black/[0.04]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canProceed || pending}
          className="rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-5 py-2 hover:bg-[#1D1D1F]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Working…" : "Proceed to payment"}
        </button>
      </div>
    </div>
  );
}
