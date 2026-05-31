import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <header className="px-6 py-5 sm:px-10 sm:py-6">
        <Link href="/" aria-label="DEXTGO" className="inline-block">
          <Image
            src="/brand/dextgo-wordmark.png"
            alt="DEXTGO"
            width={650}
            height={112}
            priority
            className="h-5 sm:h-6 w-auto"
          />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-6 py-6 text-center text-xs text-foreground/40">
        Copyright {"\u00A9"} {new Date().getFullYear()} DEXTGO {"\u2014"} All rights reserved.
      </footer>
    </div>
  );
}
