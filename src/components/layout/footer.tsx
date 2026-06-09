import Link from "next/link";
import Image from "next/image";
import { Camera } from "lucide-react";
import { SITE_CONFIG, FOOTER_LINKS } from "@/lib/constants";
import { mediaUrl } from "@/lib/media";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-white/35 hover:text-white/80 transition-colors duration-300";
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-[#141416] text-white/80 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-[1400px] section-padding py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label="DEXTGO — home"
              className="inline-block group"
            >
              <Image
                src={mediaUrl("/brand/dextgo-wordmark.png")}
                alt="DEXTGO"
                width={650}
                height={112}
                className="h-6 w-auto invert brightness-200 transition-opacity duration-300 group-hover:opacity-70"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/35 max-w-xs">
              Wander with precision. Navigate with confidence. Your journey,
              expertly curated to the finest detail.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href={SITE_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 group"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href={SITE_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Camera className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
              </a>
              <a
                href={SITE_CONFIG.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 group"
                aria-label="TikTok"
              >
                <svg
                  className="w-4 h-4 text-white/50 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.01a8.16 8.16 0 0 0 4.77 1.52V7.15a4.85 4.85 0 0 1-1.84-.46z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/70 mb-5">
              Important Links
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.important.map((link) => (
                <li key={link.href}>
                  <FooterLinkItem link={link as FooterLink} />
                </li>
              ))}
              <li>
                <a
                  href="#"
                  className="iubenda-cs-preferences-link text-sm text-white/35 hover:text-white/80 transition-colors duration-300"
                >
                  Manage Cookie Preferences
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/70 mb-5">
              Company
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <FooterLinkItem link={link as FooterLink} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/70 mb-5">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-white/35">
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="hover:text-white/80 transition-colors duration-300"
                >
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.supportEmail}`}
                  className="hover:text-white/80 transition-colors duration-300"
                >
                  {SITE_CONFIG.supportEmail}
                </a>
              </li>
              <li className="pt-1 text-white/30">
                VAT Number: {SITE_CONFIG.vat}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06]">
          <p className="text-center text-xs text-white/20">
            {`Copyright \u00A9 ${new Date().getFullYear()} DEXTGO \u2014 All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
