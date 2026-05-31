import type { Metadata } from "next";
import { IubendaPolicy } from "@/components/shared/iubenda-policy";
import { hasIubendaPolicy, IUBENDA_CONFIG } from "@/lib/iubenda";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "DEXTGO terms and conditions of use for our travel platform and itinerary services.",
};

export default function TermsPage() {
  return (
    <div className="pt-24 sm:pt-28">
      <section className="section-padding py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Terms and Conditions
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            Last updated: April 2026
          </p>

          {hasIubendaPolicy("termsPolicyId") ? (
            <IubendaPolicy
              policyId={IUBENDA_CONFIG.termsPolicyId}
              type="terms"
              linkText="Open full Terms and Conditions"
            />
          ) : (
            <FallbackTerms />
          )}
        </div>
      </section>
    </div>
  );
}

function FallbackTerms() {
  return (
    <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
      <p className="p-4 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
        Interim Terms &amp; Conditions. The Iubenda-generated version will load
        automatically once the policy ID is configured.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          1. Service Provider
        </h2>
        <p>
          DEXTGO is operated by Diana Cotfas, VAT Number IT01629850528. PEC:
          dianacotfas@pec.it.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          2. Services
        </h2>
        <p>
          DEXTGO provides digital travel itineraries including maps, audio
          guides, and travel recommendations. Our itineraries are informational
          products and do not constitute booking or travel agency services.
          DEXTGO does not make reservations on your behalf.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          3. Purchases
        </h2>
        <p>
          All purchases are processed securely through Stripe. Prices are shown
          in Euros (€) and include applicable Italian VAT (IVA). Upon
          successful payment, you receive immediate access to the purchased
          itinerary through your private dashboard.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          4. Digital Products &mdash; Exclusion of the Right of Withdrawal
        </h2>
        <p>
          In accordance with Article 59, paragraph 1, letter o) of the Italian
          Consumer Code (Legislative Decree 206/2005) and EU Directive
          2011/83/EU, the right of withdrawal <strong>does not apply</strong>{" "}
          to the supply of digital content not provided on a tangible medium,
          where performance has begun with your prior express consent and your
          acknowledgement that you therefore lose your right of withdrawal.
        </p>
        <p className="mt-3">
          At checkout you will be asked to tick two mandatory boxes before
          payment can be completed:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Acceptance of these Terms &amp; Conditions.</li>
          <li>
            Express consent to the immediate supply of the digital content and
            acknowledgement that this constitutes a waiver of the 14-day right
            of withdrawal.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          5. Refund Requests
        </h2>
        <p>
          If you believe something has gone wrong with your order — a technical
          fault, an incorrect file, or an error on our side — you can submit a
          refund request via our{" "}
          <a
            href="/contact?subject=refund"
            className="underline hover:no-underline text-foreground/70"
          >
            Refund Request form
          </a>{" "}
          or by emailing support@dextgo.com.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          6. Intellectual Property
        </h2>
        <p>
          All content on DEXTGO — itineraries, text, photographs, audio guides,
          maps, and design — is the intellectual property of Diana Cotfas and
          is protected by Italian and international copyright law. Purchased
          itineraries are for personal use only and may not be redistributed,
          resold, or shared.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          7. User Accounts
        </h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials. You must not share your login details or
          purchased content with third parties.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          8. Governing Law &amp; Online Dispute Resolution
        </h2>
        <p>
          These terms are governed by Italian law. Any disputes shall be
          resolved by the competent court of Siena, Italy, without prejudice to
          mandatory consumer-protection provisions of your country of residence
          within the EU. EU consumers may also access the European
          Commission&apos;s Online Dispute Resolution platform at{" "}
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

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          9. Contact
        </h2>
        <p>
          For questions about these terms, contact us at support@dextgo.com or
          info@dextgo.com.
        </p>
      </section>
    </div>
  );
}
