"use client";

import type { MouseEvent, ReactNode } from "react";

function openIubendaPreferences(): boolean {
  const w = window as unknown as {
    _iub?: {
      cs?: {
        api?: Record<string, (() => void) | undefined>;
        ui?: Record<string, (() => void) | undefined>;
      };
    };
  };

  const candidates = [
    w._iub?.cs?.api?.openPreferences,
    w._iub?.cs?.api?.showPreferences,
    w._iub?.cs?.api?.showSettings,
    w._iub?.cs?.api?.openDialog,
    w._iub?.cs?.ui?.openPreferences,
    w._iub?.cs?.ui?.showPreferences,
  ];

  for (const open of candidates) {
    if (typeof open === "function") {
      open();
      return true;
    }
  }

  return false;
}

/**
 * Official Iubenda footer preferences trigger.
 * Class `iubenda-cs-preferences-link` is required — Iubenda hides the floating
 * widget only when this link exists on the page.
 */
export function IubendaPreferencesLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();

    if (openIubendaPreferences()) return;

    // Iubenda may bind after hydration — retry briefly before fallback.
    let attempts = 0;
    const retry = window.setInterval(() => {
      attempts += 1;
      if (openIubendaPreferences() || attempts >= 8) {
        window.clearInterval(retry);
        if (attempts >= 8 && !openIubendaPreferences()) {
          window.location.assign("/cookies");
        }
      }
    }, 250);
  }

  return (
    <a
      href="/cookies"
      role="button"
      className={`iubenda-cs-preferences-link ${className ?? ""}`.trim()}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
