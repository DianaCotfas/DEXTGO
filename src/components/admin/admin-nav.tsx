"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Map,
  Globe,
  Newspaper,
  Image as ImageIcon,
  PlayCircle,
  ShoppingBag,
  Mail,
  Send,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/itineraries", label: "Itineraries", icon: Map },
  { href: "/admin/countries", label: "Countries & regions", icon: Globe },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/hero-media", label: "Hero media", icon: PlayCircle },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/newsletter", label: "Newsletter", icon: Send },
  { href: "/admin/messages", label: "Messages", icon: Mail },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      className="rounded-2xl bg-white border border-black/[0.06] p-2 lg:sticky lg:top-20 lg:self-start flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-hide"
      aria-label="Admin sections"
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
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
