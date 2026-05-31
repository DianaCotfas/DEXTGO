import type { Metadata } from "next";
import { IubendaPolicy } from "@/components/shared/iubenda-policy";
import { hasIubendaPolicy, IUBENDA_CONFIG } from "@/lib/iubenda";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "DEXTGO privacy policy — how we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-24 sm:pt-28">
      <section className="section-padding py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            Last updated: April 2026
          </p>

          {hasIubendaPolicy("privacyPolicyId") ? (
            <IubendaPolicy
              policyId={IUBENDA_CONFIG.privacyPolicyId}
              type="privacy"
              linkText="Open full Privacy Policy"
            />
          ) : (
            <FallbackPrivacy />
          )}
        </div>
      </section>
    </div>
  );
}

function FallbackPrivacy() {
  return (
    <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
      <p className="p-4 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
        This is an interim privacy policy. It will be replaced automatically
        once the Iubenda-managed policy ID is configured.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          1. Data Controller
        </h2>
        <p>
          The data controller is Diana Cotfas, VAT Number IT01629850528. PEC:
          dianacotfas@pec.it. Email: info@dextgo.com.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          2. Data We Collect
        </h2>
        <p>We may collect the following categories of personal data:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            Identity data (name, email address) when you create an account or
            submit a form
          </li>
          <li>
            Transaction data when you purchase an itinerary through our secure
            payment provider (Stripe)
          </li>
          <li>
            Technical data (IP address, browser type, device information)
            collected automatically through cookies
          </li>
          <li>Usage data about how you interact with our website</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          3. How We Use Your Data
        </h2>
        <p>Your data is processed for the following purposes:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>To provide and manage your account and purchased itineraries</li>
          <li>To process payments securely through Stripe</li>
          <li>
            To respond to your inquiries and personalized itinerary requests
          </li>
          <li>To send you our newsletter (only with your explicit consent)</li>
          <li>
            To improve our website and services through anonymized analytics
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          4. Legal Basis (GDPR Art. 6)
        </h2>
        <p>
          We process your data based on: (a) your consent for marketing
          communications, (b) contractual necessity for providing purchased
          services, (c) legitimate interest for website improvement and
          security, and (d) legal obligations for tax and accounting purposes.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          5. Data Sharing
        </h2>
        <p>
          We do not sell your personal data. We share data only with trusted
          service providers who process data on our behalf: Stripe (payments),
          Vercel (hosting), Supabase (database), and our email provider. All
          providers comply with GDPR.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          6. Your Rights
        </h2>
        <p>
          Under GDPR you may access, rectify, erase, restrict, object to or
          port your data, withdraw consent at any time, and lodge a complaint
          with the Italian Garante per la Protezione dei Dati Personali. To
          exercise any of these rights, email info@dextgo.com.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          7. Online Dispute Resolution
        </h2>
        <p>
          In accordance with EU Regulation 524/2013, the European Commission
          provides an online dispute resolution platform accessible at{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline text-foreground/70"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </section>
    </div>
  );
}
