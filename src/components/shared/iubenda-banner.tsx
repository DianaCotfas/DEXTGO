"use client";

import Script from "next/script";
import { HideIubendaFloatingBadge } from "@/components/shared/hide-iubenda-floating-badge";
import { IUBENDA_CONFIG, hasIubendaBanner } from "@/lib/iubenda";

/**
 * Iubenda Cookie Solution banner.
 *
 * Loads only when valid Iubenda IDs are present in env, and performs preventive
 * blocking of tracking scripts (Meta Pixel, GA, Google Ads, etc.) until the
 * visitor gives consent — as required by the Italian Garante and GDPR.
 *
 * Visitor actions (Accept All / Reject / Customize) and consent logs are
 * handled and stored by Iubenda's Consent Database automatically.
 */
export function IubendaBanner() {
  if (!hasIubendaBanner()) return null;

  const siteId = IUBENDA_CONFIG.siteId;
  const cookiePolicyId = IUBENDA_CONFIG.cookiePolicyId;

  const config = {
    siteId: Number(siteId),
    cookiePolicyId: Number(cookiePolicyId),
    lang: "en",
    storage: { useSiteId: true },
    banner: {
      acceptButtonDisplay: true,
      customizeButtonDisplay: true,
      rejectButtonDisplay: true,
      // Hide floating preference badge ("green i") and expose a footer link instead.
      floatingPreferencesButtonDisplay: false,
      position: "float-bottom-center",
      acceptButtonColor: "#1D1D1F",
      acceptButtonCaptionColor: "white",
      rejectButtonColor: "#F5F5F7",
      rejectButtonCaptionColor: "#1D1D1F",
      customizeButtonColor: "transparent",
      customizeButtonCaptionColor: "#1D1D1F",
      closeButtonDisplay: false,
      listPurposes: true,
      explicitWithdrawal: true,
    },
    perPurposeConsent: IUBENDA_CONFIG.perPurposeConsent,
    countryDetection: IUBENDA_CONFIG.countryDetection,
  };

  return (
    <>
      <HideIubendaFloatingBadge />
      <Script
        id="iubenda-cs-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `var _iub = _iub || [];\n_iub.csConfiguration = ${JSON.stringify(
            config,
          )};`,
        }}
      />
      <Script
        src={`https://cs.iubenda.com/autoblocking/${siteId}.js`}
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.iubenda.com/cs/iubenda_cs.js"
        strategy="afterInteractive"
      />
    </>
  );
}
