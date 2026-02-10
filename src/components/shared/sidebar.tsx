"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  Scissors,
  UserCog,
  BarChart3,
  Settings,
  Clock,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const navigation = [
  { name: "Calendario", href: "/dashboard", icon: Calendar },
  { name: "Clienti", href: "/dashboard/clients", icon: Users },
  { name: "Servizi", href: "/dashboard/services", icon: Scissors },
  { name: "Staff", href: "/dashboard/staff", icon: UserCog },
  { name: "Lista d'attesa", href: "/dashboard/waitlist", icon: Clock },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Impostazioni", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <Scissors className="h-6 w-6 text-zinc-300" />
        <span className="text-lg font-bold text-white">Barberos</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-zinc-400 bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="mb-3 truncate text-xs text-zinc-600">{user.email}</div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <LogOut className="h-4 w-4" />
          Esci
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-zinc-900 p-2 shadow-lg shadow-black/30 lg:hidden"
      >
        <Menu className="h-5 w-5 text-zinc-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-zinc-950 shadow-lg shadow-black/40">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded p-1 text-zinc-400 hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}
