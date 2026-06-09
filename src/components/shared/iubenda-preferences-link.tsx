"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function IubendaPreferencesLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  function openPreferences(e: React.MouseEvent<HTMLAnchorElement>) {
    const w = window as unknown as {
      _iub?: {
        cs?: {
          api?: {
            openPreferences?: () => void;
            showPreferences?: () => void;
            showSettings?: () => void;
            openDialog?: () => void;
          };
        };
      };
    };
    const api = w._iub?.cs?.api;
    if (!api) return;

    const open =
      api.openPreferences ??
      api.showPreferences ??
      api.showSettings ??
      api.openDialog;
    if (!open) return;

    e.preventDefault();
    open();
  }

  return (
    <Link
      href="/cookies"
      onClick={openPreferences}
      className={className}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
