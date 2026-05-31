import Link from "next/link";

export const metadata = {
  title: "Thank you — DEXTGO",
};

interface ThankYouPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const { type } = await searchParams;
  const isCustom = type === "custom-itinerary";

  return (
    <section className="section-padding py-16 sm:py-24">
      <div className="mx-auto max-w-2xl rounded-2xl border border-black/[0.08] bg-white p-8 sm:p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
          Payment received
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
          Thank you!
        </h1>
        <p className="mt-4 text-sm sm:text-base text-foreground/70 leading-relaxed">
          {isCustom
            ? "Your custom itinerary request is confirmed. Our team will now craft your itinerary and deliver it in 1–5 days. You will receive an email as soon as it is ready in your private account."
            : "Your payment was successful. Your itinerary is now available in your account."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account/itineraries"
            className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
          >
            Go to my itineraries
          </Link>
          <Link
            href="/itineraries"
            className="rounded-full border border-black/[0.12] text-foreground text-sm font-semibold px-5 py-2.5"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    </section>
  );
}
