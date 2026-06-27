import Script from "next/script";
import { HideIubendaFloatingBadge } from "@/components/shared/hide-iubenda-floating-badge";
import { IUBENDA_CONFIG, hasIubendaBanner } from "@/lib/iubenda";

const HIDE_FLOATING_CSS = `
#iubenda-cs-preferences-link,
#iubenda-cs-floating-btn,
.iubenda-cs-btn-floating,
[data-iub-cs-floating-preferences-button],
[class*="iubenda-cs-floating"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
footer .iubenda-cs-preferences-link {
  display: inline !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  width: auto !important;
  height: auto !important;
}
`.trim();

/**
 * Iubenda Cookie Solution banner.
 *
 * Loads only when valid Iubenda IDs are present in env, and performs preventive
 * blocking of tracking scripts (Meta Pixel, GA, Google Ads, etc.) until the
 * visitor gives consent — as required by the Italian Garante and GDPR.
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
    // Must be top-level (not inside banner) — see Iubenda advanced guide.
    floatingPreferencesButtonDisplay: false,
    banner: {
      acceptButtonDisplay: true,
      customizeButtonDisplay: true,
      rejectButtonDisplay: true,
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
          __html: `(function(){var s=document.getElementById("dextgo-iubenda-hide-floating");if(!s){s=document.createElement("style");s.id="dextgo-iubenda-hide-floating";s.textContent=${JSON.stringify(HIDE_FLOATING_CSS)};document.head.appendChild(s);}})();var _iub=_iub||[];_iub.csConfiguration=${JSON.stringify(config)};`,
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
