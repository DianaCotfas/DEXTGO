"use client";

import { useTransition } from "react";
import { Info } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function isIOS(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /iP(ad|hone|od)/i.test(navigator.userAgent)
  );
}

export function DownloadPdfButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();
  const helpText = "For any download issues, please contact support@dextgo.com";

  function onDownload() {
    // Track PDF download event in GA4
    window.gtag?.("event", "pdf_download", {
      itinerary_slug: slug,
    });

    // On iOS, direct navigation is more reliable than blob downloads,
    // especially for larger files and in-app browsers.
    if (isIOS()) {
      const directUrl = `/api/itineraries/${slug}/pdf?download=1`;
      window.location.assign(directUrl);
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/itineraries/${slug}/pdf`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        alert(body?.message ?? "Couldn't generate the PDF. Please try again.");
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/pdf")) {
        alert("The server returned an unexpected response. Please try again.");
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `dextgo-${slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDownload}
        disabled={pending}
        className="rounded-full border border-black/15 text-foreground text-sm font-semibold px-5 py-2.5 hover:bg-black/[0.04] disabled:opacity-60"
      >
        {pending ? "Preparing PDF..." : "Download PDF"}
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
