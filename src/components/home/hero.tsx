"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { HeroVideo } from "@/components/shared/hero-video";
import { HERO_MEDIA, type HeroMedia } from "@/lib/hero-media";

export function Hero({ media = HERO_MEDIA.home }: { media?: HeroMedia }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section
      ref={ref}
      className="relative px-2 sm:px-3 lg:px-4 pt-14 sm:pt-16 pb-3"
    >
      <div className="relative mx-auto min-h-[calc(100svh-11rem)] sm:min-h-[64svh] lg:min-h-[70svh] max-w-[1900px] overflow-hidden rounded-[22px] sm:rounded-[30px] bg-[#0a0a0a] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          {media.video || media.videoHls ? (
            <HeroVideo
              mp4Src={media.video}
              hlsSrc={media.videoHls}
              posterSrc={media.videoPoster ?? media.image}
              preload={media.videoHls ? "metadata" : "auto"}
              className="absolute inset-0 h-full w-full object-cover scale-105"
            />
          ) : (
            media.image && (
              <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{ backgroundImage: `url(${media.image})` }}
              />
            )
          )}
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/50" />

        <div className="relative z-10 text-center section-padding py-16 sm:py-24 lg:py-28 max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-light tracking-tight text-white/80 whitespace-nowrap drop-shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
            Wander and Navigate Destinations.
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-10">
            <Link
              href="/itineraries"
              className="group w-full sm:w-auto inline-flex items-center justify-center px-9 py-4 border border-white/50 bg-white/15 text-white text-sm font-semibold rounded-full hover:bg-white/25 hover:border-white/70 transition-all duration-500 hover:scale-[1.02]"
            >
              Buy Ready-Made Itineraries
            </Link>
            <Link
              href="/personalized-itineraries"
              className="group w-full sm:w-auto inline-flex items-center justify-center px-9 py-4 border border-white/50 bg-white/15 text-white text-sm font-semibold rounded-full hover:bg-white/25 hover:border-white/70 transition-all duration-500 hover:scale-[1.02]"
            >
              Request Custom Itinerary
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
