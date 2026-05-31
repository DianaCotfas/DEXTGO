"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ChangePasswordCard({ resetMode }: { resetMode?: boolean }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured.");
      return;
    }

    start(async () => {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) {
        setError(err.message);
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-black/[0.06] p-6 sm:p-8">
      <h2 className="text-lg font-semibold">
        {resetMode ? "Set your new password" : "Change password"}
      </h2>
      <p className="mt-1 text-sm text-foreground/60">
        {resetMode
          ? "You arrived here via a password-reset link. Enter your new password below."
          : "Update your account password. Use at least 8 characters."}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-w-sm">
        <label className="block">
          <span className="text-xs font-medium text-foreground/70">New password</span>
          <div className="relative mt-1.5">
            <input
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-foreground/45 hover:text-foreground"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-foreground/70">Confirm new password</span>
          <div className="relative mt-1.5">
            <input
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-foreground/45 hover:text-foreground"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
