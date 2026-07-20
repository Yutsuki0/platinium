"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gamepad2, Target, Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Sous-ensemble des sections principales, adapté à l'espace réduit du mobile.
const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/games", label: "Jeux", icon: Gamepad2 },
  { href: "/objectives", label: "Objectifs", icon: Target },
  { href: "/recommendations", label: "Idées", icon: Sparkles },
  { href: "/settings", label: "Réglages", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 lg:hidden">
      <div className="glass-panel flex w-full max-w-md items-center justify-between px-2 py-2">
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px]",
                active ? "text-steam" : "text-slate-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
