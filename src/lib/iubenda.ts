/**
 * Iubenda integration configuration.
 *
 * Diana's Iubenda account (already purchased) provides three policy documents
 * and a Cookie Solution banner. Each document has a numeric ID. Fill them in
 * via NEXT_PUBLIC_* env vars once Diana grants access to the Iubenda dashboard.
 *
 * Example env (dextgo-web/.env.local):
 *   NEXT_PUBLIC_IUBENDA_SITE_ID=123456
 *   NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID=987654321
 *   NEXT_PUBLIC_IUBENDA_PRIVACY_POLICY_ID=987654322
 *   NEXT_PUBLIC_IUBENDA_TERMS_POLICY_ID=987654323
 *
 * If IDs are not set, the site falls back to the in-house written legal pages
 * and cookie banner so previews stay functional while we wait on credentials.
 */

export const IUBENDA_CONFIG = {
  siteId: process.env.NEXT_PUBLIC_IUBENDA_SITE_ID ?? "",
  cookiePolicyId: process.env.NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_ID ?? "",
  privacyPolicyId: process.env.NEXT_PUBLIC_IUBENDA_PRIVACY_POLICY_ID ?? "",
  termsPolicyId: process.env.NEXT_PUBLIC_IUBENDA_TERMS_POLICY_ID ?? "",
  /** Modern unified embed widget UUID (preferred over siteId when present). */
  widgetId: process.env.NEXT_PUBLIC_IUBENDA_WIDGET_ID ?? "",
  /** Two-letter ISO country code for Iubenda geolocation defaults. */
  countryDetection: true,
  /** Toggle full preventive-blocking of trackers (Meta, GA, Ads) until consent. */
  perPurposeConsent: true,
} as const;

export const hasIubendaBanner = () =>
  !!(
    IUBENDA_CONFIG.widgetId ||
    (IUBENDA_CONFIG.siteId && IUBENDA_CONFIG.cookiePolicyId)
  );

export const hasIubendaPolicy = (
  id: "cookiePolicyId" | "privacyPolicyId" | "termsPolicyId",
) => !!IUBENDA_CONFIG[id];

export const iubendaPolicyUrl = (policyId: string) =>
  `https://www.iubenda.com/privacy-policy/${policyId}`;

export const iubendaCookiePolicyUrl = (policyId: string) =>
  `https://www.iubenda.com/privacy-policy/${policyId}/cookie-policy`;

export const iubendaTermsUrl = (policyId: string) =>
  `https://www.iubenda.com/terms-and-conditions/${policyId}`;
