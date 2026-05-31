"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Quote } from "lucide-react";

export function VideoShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  return (
    <section
      ref={ref}
      className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden"
    >
      <motion.div
        className="absolute inset-0"
        style={{ y: bgY, scale }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80)",
          }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex items-center justify-center h-full section-padding">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
            className="mx-auto mb-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <Quote className="w-5 h-5 text-white" />
          </motion.div>

          <p className="text-xl sm:text-2xl lg:text-3xl text-white font-light leading-relaxed tracking-wide">
            &ldquo;Every shot is a promise of the beauty you will encounter,
            captured during our{" "}
            <span className="font-medium text-white">real explorations</span>
            .&rdquo;
          </p>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 mx-auto h-[1px] w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
