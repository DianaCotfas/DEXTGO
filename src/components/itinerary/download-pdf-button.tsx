"use client";

import { Info } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function DownloadPdfButton({ slug }: { slug: string }) {
  const helpText =
    "Downloads the latest saved PDF. If the file is still refreshing, we open the print-friendly page as fallback.";

  function onDownload() {
    window.gtag?.("event", "pdf_download", {
      itinerary_slug: slug,
    });
    window.open(`/api/itineraries/${slug}/pdf`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDownload}
        className="rounded-full border border-black/15 text-foreground text-sm font-semibold px-5 py-2.5 hover:bg-black/[0.04]"
      >
        Download PDF
      </button>

      <details className="group relative">
        <summary
          className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full border border-black/15 bg-white text-foreground/65 hover:bg-black/[0.04] hover:text-foreground"
          aria-label="PDF download help"
        >
          <Info className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-black/10 bg-white p-3 text-xs leading-relaxed text-foreground/75 shadow-xl sm:w-80">
          {helpText}
        </div>
      </details>
    </div>
  );
}
