"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroVideo } from "@/components/shared/hero-video";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  backgroundVideoHls?: string;
  backgroundVideoPoster?: string;
}

export function PageHero({
  title,
  subtitle,
  backgroundImage,
  backgroundVideo,
  backgroundVideoHls,
  backgroundVideoPoster,
}: PageHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section
      ref={ref}
      className="relative px-2 sm:px-3 lg:px-4 pt-20 sm:pt-24 pb-3"
    >
      <div className="relative mx-auto min-h-[62vh] sm:min-h-[68vh] max-w-[1900px] overflow-hidden rounded-[22px] sm:rounded-[30px] bg-[#0a0a0a] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
        {(backgroundVideo || backgroundVideoHls) && (
          <motion.div className="absolute inset-0" style={{ y: bgY }}>
            <HeroVideo
              mp4Src={backgroundVideo}
              hlsSrc={backgroundVideoHls}
              posterSrc={backgroundVideoPoster ?? backgroundImage}
              preload={backgroundVideoHls ? "metadata" : "auto"}
              className="absolute inset-0 w-full h-full object-cover scale-105"
              ariaLabel={`${title} hero video`}
            />
          </motion.div>
        )}
        {!backgroundVideo && !backgroundVideoHls && backgroundImage && (
          <motion.div className="absolute inset-0" style={{ y: bgY }}>
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          </motion.div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40" />

        <div className="relative z-10 text-center section-padding py-26 sm:py-32 lg:py-40">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white text-balance drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto text-balance font-light drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              {subtitle}
            </p>
          )}
          <div className="mt-5 mx-auto h-[2px] w-12 bg-white/70" />
        </div>
      </div>
    </section>
  );
}
