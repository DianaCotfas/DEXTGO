"use client";

import Script from "next/script";
import { useEffect } from "react";

interface IubendaPolicyProps {
  /** Iubenda policy document ID. */
  policyId: string;
  /** Which sub-document to render. */
  type: "privacy" | "terms" | "cookie";
  linkText: string;
}

/**
 * Renders a link that expands into an inline iubenda policy document via
 * iubenda's standard embed script.
 *
 * Iubenda ships a single loader that upgrades any <a class="iubenda-...-link">
 * with data attributes into a policy widget.
 */
export function IubendaPolicy({ policyId, type, linkText }: IubendaPolicyProps) {
  useEffect(() => {
    // Re-run Iubenda's loader when the component mounts so policy links added
    // after initial script load are still upgraded.
    const w = window as unknown as { _iub?: unknown[] };
    w._iub = w._iub || [];
  }, []);

  const linkClass =
    type === "terms"
      ? "iubenda-nostyle no-brand iubenda-embed iub-body-embed iubenda-noiframe iubenda-tc-link"
      : "iubenda-nostyle no-brand iubenda-embed iub-body-embed iubenda-noiframe iubenda-privacy-link";

  const href =
    type === "terms"
      ? `https://www.iubenda.com/terms-and-conditions/${policyId}`
      : type === "cookie"
        ? `https://www.iubenda.com/privacy-policy/${policyId}/cookie-policy`
        : `https://www.iubenda.com/privacy-policy/${policyId}`;

  return (
    <>
      <div className="iubenda-policy-host">
        <a href={href} className={linkClass} title={linkText}>
          {linkText}
        </a>
      </div>
      <Script
        id={`iubenda-embed-loader-${type}-${policyId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function (w,d) {var loader = function () {var s = d.createElement("script"), tag = d.getElementsByTagName("script")[0]; s.src="https://cdn.iubenda.com/iubenda.js"; tag.parentNode.insertBefore(s,tag);}; if(w.addEventListener){w.addEventListener("load", loader, false);}else if(w.attachEvent){w.attachEvent("onload", loader);}else{w.onload = loader;}})(window, document);`,
        }}
      />
    </>
  );
}
