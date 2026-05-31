"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User as UserIcon, LogOut, LayoutGrid } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UserMenu({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let mounted = true;
    const refreshAdmin = () =>
      fetch("/api/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (mounted && d) setIsAdmin(!!d.isAdmin);
        })
        .catch(() => {});

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      if (data.user) refreshAdmin();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) refreshAdmin();
      else setIsAdmin(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (variant === "mobile") {
    return (
      <div className="flex flex-col items-center gap-2 mt-4">
        {user ? (
          <>
            <Link
              href="/account"
              className="px-6 py-2 rounded-full bg-[#1D1D1F] text-white text-sm font-semibold"
            >
              My Account
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="px-6 py-2 rounded-full bg-[#FF453A] text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Open CMS
              </Link>
            )}
            <form action="/api/auth/sign-out" method="post">
              <button
                type="submit"
                className="px-6 py-2 rounded-full border border-red-300 text-red-600 text-sm font-semibold inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="px-6 py-2 rounded-full bg-[#1D1D1F] text-white text-sm font-semibold"
          >
            Log in
          </Link>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="ml-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1D1D1F] text-white text-[13px] font-semibold hover:bg-[#1D1D1F]/90 transition-colors"
      >
        <UserIcon className="w-3.5 h-3.5" />
        Log in
      </Link>
    );
  }

  return (
    <div className="relative ml-3 flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF453A] text-white text-[12px] font-semibold hover:bg-[#E03B30] transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          CMS
        </Link>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F7] text-foreground text-[13px] font-medium hover:bg-[#ECECEE] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserIcon className="w-3.5 h-3.5" />
        Account
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-black/[0.06] shadow-lg overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          <Link
            href="/account"
            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#F5F5F7]"
          >
            <LayoutGrid className="w-4 h-4" /> My account
          </Link>
          <Link
            href="/account/itineraries"
            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#F5F5F7]"
          >
            <UserIcon className="w-4 h-4" /> My itineraries
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#F5F5F7] border-t border-black/[0.05]"
            >
              <LayoutGrid className="w-4 h-4" /> Admin CMS
            </Link>
          )}
          <form action="/api/auth/sign-out" method="post" className="border-t border-black/[0.05]">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
