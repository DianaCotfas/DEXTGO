"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-shadow duration-300",
          "bg-white/80 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-black/[0.06]",
          isScrolled
            ? "shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            : "shadow-none"
        )}
      >
        <nav className="section-padding mx-auto max-w-[1400px]">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Link
              href="/"
              aria-label="DEXTGO — home"
              className="relative z-10 flex items-center"
              onClick={() => setIsMobileOpen(false)}
            >
              <Image
                src={mediaUrl("/brand/dextgo-wordmark.png")}
                alt="DEXTGO"
                width={650}
                height={112}
                priority
                className="h-5 sm:h-6 w-auto"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-[13px] font-medium rounded-full text-foreground/60 hover:text-foreground transition-colors duration-300 group"
                >
                  {link.label}
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-[1.5px] rounded-full bg-[#1D1D1F] transition-all duration-300 group-hover:w-4" />
                </Link>
              ))}
              <UserMenu />
            </div>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="relative z-10 lg:hidden p-2 rounded-full text-[#1D1D1F]"
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            >
              {isMobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" />
            <nav className="relative flex flex-col items-center justify-center h-full gap-1 p-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="block px-6 py-3 text-2xl font-semibold text-foreground/80 hover:text-foreground transition-colors text-center"
                >
                  {link.label}
                </Link>
              ))}
              <UserMenu variant="mobile" />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
