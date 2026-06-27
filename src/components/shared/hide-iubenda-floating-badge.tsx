"use client";

import { useEffect } from "react";

const FLOATING_SELECTORS = [
  "#iubenda-cs-preferences-link",
  "#iubenda-cs-floating-btn",
  ".iubenda-cs-btn-floating",
  "[data-iub-cs-floating-preferences-button]",
  '[class*="iubenda-cs-floating"]',
];

function isFooterPreferencesLink(node: HTMLElement) {
  return !!node.closest("footer") && node.classList.contains("iubenda-cs-preferences-link");
}

function hideFloatingBadge() {
  for (const selector of FLOATING_SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (isFooterPreferencesLink(node)) return;
      node.style.setProperty("display", "none", "important");
      node.style.setProperty("visibility", "hidden", "important");
      node.style.setProperty("opacity", "0", "important");
      node.style.setProperty("pointer-events", "none", "important");
    });
  }

  // Catch any fixed-position Iubenda nodes Iubenda injects outside the footer.
  document.querySelectorAll('[class*="iubenda"], [id*="iubenda"]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (isFooterPreferencesLink(node)) return;
    if (node.closest("#iubenda-cs-banner")) return;
    if (node.closest("footer")) return;

    const style = window.getComputedStyle(node);
    const isFixed = style.position === "fixed" || style.position === "sticky";
    const isSmallFloater =
      isFixed &&
      node.offsetWidth > 0 &&
      node.offsetWidth <= 80 &&
      node.offsetHeight <= 80;

    if (isSmallFloater || node.id === "iubenda-cs-preferences-link") {
      node.style.setProperty("display", "none", "important");
      node.style.setProperty("visibility", "hidden", "important");
      node.style.setProperty("opacity", "0", "important");
      node.style.setProperty("pointer-events", "none", "important");
    }
  });
}

/**
 * Iubenda injects the floating preferences badge even when disabled in config
 * (especially with remote dashboard settings). Keep it hidden; footer link stays.
 */
export function HideIubendaFloatingBadge() {
  useEffect(() => {
    hideFloatingBadge();

    const observer = new MutationObserver(() => hideFloatingBadge());
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    const interval = window.setInterval(hideFloatingBadge, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
