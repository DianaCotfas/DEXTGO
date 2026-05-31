import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-14 sm:pt-16 bg-[#FAFAFA] min-h-screen">
        <div className="mx-auto max-w-[1200px] section-padding py-12 sm:py-16">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
