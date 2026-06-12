"use client";

import { useEffect } from "react";

const HIDE_SELECTORS = [
  ".iubenda-cs-btn-floating",
  "#iubenda-cs-preferences-link",
  "#iubenda-cs-floating-btn",
  "[data-iub-cs-floating-preferences-button]",
  "[data-iub-cs-preferences-button]",
  '[class*="iubenda-cs-floating"]',
  '[class*="iubenda-cs-preferences-link"]',
  'iframe[src*="iubenda"][style*="fixed"]',
];

function hideFloatingBadge() {
  for (const selector of HIDE_SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.style.setProperty("display", "none", "important");
      node.style.setProperty("visibility", "hidden", "important");
      node.style.setProperty("opacity", "0", "important");
      node.style.setProperty("pointer-events", "none", "important");
    });
  }
}

/**
 * Iubenda sometimes injects the floating preferences badge even when disabled
 * in csConfiguration. This keeps it hidden while footer preferences remain.
 */
export function HideIubendaFloatingBadge() {
  useEffect(() => {
    hideFloatingBadge();

    const observer = new MutationObserver(() => hideFloatingBadge());
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(hideFloatingBadge, 1500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
