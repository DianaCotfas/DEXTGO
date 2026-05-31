"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("dextgo-cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("dextgo-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const decline = () => {
    localStorage.setItem("dextgo-cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-xl bg-white rounded-2xl card-shadow-hover p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5 text-[#1D1D1F]" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    We use cookies
                  </h3>
                  <button
                    onClick={decline}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies to make our site work and analytics cookies to
                  improve your experience.{" "}
                  <Link
                    href="/cookies"
                    className="underline hover:no-underline text-foreground/70"
                  >
                    Learn more
                  </Link>
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={accept}
                    className="px-5 py-2 bg-[#1D1D1F] text-white text-xs font-semibold rounded-lg hover:bg-[#1D1D1F]/90 transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={decline}
                    className="px-5 py-2 bg-[#F5F5F7] text-foreground text-xs font-semibold rounded-lg hover:bg-[#ECECEE] transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
