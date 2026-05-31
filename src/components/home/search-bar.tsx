"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Users } from "lucide-react";
import { countries } from "@/data/countries";

const tripTypes = [
  "Solo Adventure",
  "Family Trip",
  "Couple Trip",
  "Group Travel",
];

export function SearchBar() {
  return (
    <section className="relative z-20 -mt-10 section-padding pb-0">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-4xl"
      >
        <div className="bg-white rounded-2xl card-shadow p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/50 text-sm font-medium text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
                defaultValue=""
              >
                <option value="" disabled>
                  Where to?
                </option>
                {countries.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/50 text-sm font-medium text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
                defaultValue=""
              >
                <option value="" disabled>
                  Type of Trip
                </option>
                {tripTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button className="h-12 px-8 bg-[#1D1D1F] text-white text-sm font-semibold rounded-xl hover:bg-[#1D1D1F]/90 transition-colors flex items-center justify-center gap-2 shrink-0">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
