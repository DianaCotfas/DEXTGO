"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountCard({ email }: { email: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (confirmation.trim().toUpperCase() !== CONFIRM_PHRASE) {
      setError(`Type ${CONFIRM_PHRASE} to confirm.`);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.message ?? "Couldn't delete your account. Please try again.");
        return;
      }
      router.replace("/?account=deleted");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-red-200/70 p-6 sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight text-red-700">
        Delete account
      </h2>
      <p className="mt-2 text-sm text-foreground/60 max-w-2xl">
        This permanently deletes your DEXTGO account ({email}), saved trips, and
        login. Past orders are kept for accounting compliance but anonymized so
        they no longer reference you.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4 max-w-md">
        <label className="block">
          <span className="text-xs font-medium text-foreground/70">
            Type {CONFIRM_PHRASE} to confirm
          </span>
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.12] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            placeholder={CONFIRM_PHRASE}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-red-600 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60 hover:bg-red-700"
        >
          {pending ? "Deleting..." : "Delete my account"}
        </button>
      </form>
    </div>
  );
}
