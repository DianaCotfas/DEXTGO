"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfileForm({
  email,
  initialFullName,
}: {
  email: string;
  initialFullName: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Profile updates require Supabase to be configured.");
      return;
    }
    startTransition(async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setError("You're signed out.");
        return;
      }
      const { error: err } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", u.user.id);
      if (err) setError(err.message);
      else setMessage("Saved.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-md">
      <label className="block">
        <span className="text-xs font-medium text-foreground/70">Email</span>
        <input
          value={email}
          disabled
          className="mt-1.5 w-full rounded-xl bg-[#F5F5F7] border border-black/[0.05] px-4 py-2.5 text-sm text-foreground/70"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-foreground/70">Full name</span>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
