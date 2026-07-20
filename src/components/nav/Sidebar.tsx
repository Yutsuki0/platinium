"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gamepad2,
  Trophy,
  Target,
  CalendarDays,
  Sparkles,
  Crosshair,
  BarChart3,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/games", label: "Mes jeux", icon: Gamepad2 },
  { href: "/achievements", label: "Succès", icon: Trophy },
  { href: "/objectives", label: "Objectifs", icon: Target },
  { href: "/planner", label: "Planificateur", icon: CalendarDays },
  { href: "/hunt", label: "Mode chasse", icon: Crosshair },
  { href: "/recommendations", label: "Recommandations", icon: Sparkles },
  { href: "/statistics", label: "Statistiques", icon: BarChart3 },
  { href: "/history", label: "Historique", icon: History },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:gap-6 lg:p-4">
      <div className="terminal-shell flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-2 px-3 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-semibold tracking-wide text-white">
            PLATINUM // OS
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
