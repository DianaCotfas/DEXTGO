import type { Metadata } from "next";
import { IubendaPolicy } from "@/components/shared/iubenda-policy";
import { hasIubendaPolicy, IUBENDA_CONFIG } from "@/lib/iubenda";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description:
    "DEXTGO cookies policy — how we use cookies and similar technologies on our website.",
};

export default function CookiesPage() {
  return (
    <div className="pt-24 sm:pt-28">
      <section className="section-padding py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Cookies Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            Last updated: April 2026
          </p>

          {hasIubendaPolicy("cookiePolicyId") ? (
            <IubendaPolicy
              policyId={IUBENDA_CONFIG.cookiePolicyId}
              type="cookie"
              linkText="Open full Cookie Policy"
            />
          ) : (
            <FallbackCookies />
          )}
        </div>
      </section>
    </div>
  );
}

function FallbackCookies() {
  return (
    <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
      <p className="p-4 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
        Interim Cookie Policy. The Iubenda-generated version will load
        automatically once the policy ID is configured.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          What Are Cookies
        </h2>
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help the website function properly, remember your
          preferences, and provide anonymized data to help us improve your
          experience.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Cookies We Use
        </h2>
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-[#F5F5F7] rounded-xl">
            <h3 className="font-semibold text-foreground mb-1">
              Essential Cookies
            </h3>
            <p>
              Required for the website to function. These handle
              authentication, security, and basic functionality. They cannot be
              disabled.
            </p>
          </div>
          <div className="p-4 bg-[#F5F5F7] rounded-xl">
            <h3 className="font-semibold text-foreground mb-1">
              Functional Cookies
            </h3>
            <p>
              Remember your preferences (language, region) to provide a
              personalized experience.
            </p>
          </div>
          <div className="p-4 bg-[#F5F5F7] rounded-xl">
            <h3 className="font-semibold text-foreground mb-1">
              Analytics &amp; Marketing Cookies
            </h3>
            <p>
              Help us understand how visitors use our website (Google
              Analytics, Meta Pixel, Google Ads). These require your explicit
              consent and are blocked by default until you accept them via our
              cookie banner.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Managing Cookies
        </h2>
        <p>
          You can change or withdraw your consent at any time via the cookie
          banner. You can also clear cookies through your browser settings.
          Note that disabling certain cookies may affect website functionality.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
        <p>
          For questions about our use of cookies, contact us at
          info@dextgo.com.
        </p>
      </section>
    </div>
  );
}
