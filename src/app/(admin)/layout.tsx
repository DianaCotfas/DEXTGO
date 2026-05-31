import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = { title: "Admin — DEXTGO" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="mx-auto max-w-[1400px] section-padding flex h-14 sm:h-16 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3" aria-label="DEXTGO admin">
            <Image
              src="/brand/dextgo-wordmark.png"
              alt="DEXTGO"
              width={650}
              height={112}
              className="h-5 sm:h-6 w-auto"
            />
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/40">
              Admin
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-foreground/60 hover:text-foreground"
          >
            View site &rarr;
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] section-padding py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
            <AdminNav />
            <div>{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
