import { Mail, LifeBuoy } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { ContactForm } from "@/components/forms/contact-form";

export function ContactContent() {
  return (
    <section className="section-padding section-gap">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Get in Touch
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Whether you require detailed information regarding our
                itineraries, seek assistance with a purchase, or wish to
                collaborate on a bespoke travel plan—our team is dedicated to
                providing the support you need.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#1D1D1F]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    General Enquiries
                  </p>
                  <a
                    href={`mailto:${SITE_CONFIG.email}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {SITE_CONFIG.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-4 h-4 text-[#1D1D1F]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Customer Support
                  </p>
                  <a
                    href={`mailto:${SITE_CONFIG.supportEmail}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {SITE_CONFIG.supportEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl card-shadow p-8 sm:p-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
