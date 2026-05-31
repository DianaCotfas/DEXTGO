import Link from "next/link";

export function ConfigNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white border border-black/[0.06] p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-foreground/60 leading-relaxed">{body}</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
      >
        Back home
      </Link>
    </div>
  );
}
