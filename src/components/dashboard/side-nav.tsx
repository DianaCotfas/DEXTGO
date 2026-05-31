"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Map, Heart, Settings } from "lucide-react";

const items = [
  { href: "/account", label: "Overview", icon: LayoutGrid },
  { href: "/account/itineraries", label: "My itineraries", icon: Map },
  { href: "/account/saved", label: "Saved trips", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function DashboardSideNav() {
  const pathname = usePathname();
  return (
    <nav
      className="rounded-2xl bg-white border border-black/[0.06] p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-1 px-1 lg:mx-0 lg:px-2 scrollbar-hide"
      aria-label="Account sections"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              active
                ? "bg-[#F5F5F7] text-foreground"
                : "text-foreground/70 hover:bg-[#FAFAFA] hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
