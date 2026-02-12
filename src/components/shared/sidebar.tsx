"use client";

import {
  BarChart3,
  Bell,
  Calendar,
  Clock,
  Gift,
  LogOut,
  Menu,
  Moon,
  Palette,
  PanelLeftClose,
  Scissors,
  Settings,
  Sun,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LogoFull, LogoIcon } from "@/components/shared/barberos-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Principale",
    items: [{ name: "Calendario", href: "/dashboard", icon: Calendar }],
  },
  {
    label: "Gestione",
    items: [
      { name: "Clienti", href: "/dashboard/clients", icon: Users },
      { name: "Servizi", href: "/dashboard/services", icon: Scissors },
      { name: "Staff", href: "/dashboard/staff", icon: UserCog },
      { name: "Lista d'attesa", href: "/dashboard/waitlist", icon: Clock },
    ],
  },
  {
    label: "Aspetto",
    items: [{ name: "Personalizza", href: "/dashboard/customize", icon: Palette }],
  },
  {
    label: "Crescita",
    items: [
      { name: "ROI & Vantaggi", href: "/dashboard/roi", icon: TrendingUp },
      { name: "Referral", href: "/dashboard/referral", icon: Gift },
    ],
  },
  {
    label: "Analisi",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "Impostazioni", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function DashboardSidebar({
  businessId,
  initialUnreadCount = 0,
}: {
  businessId?: string | null;
  initialUnreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // Supabase Realtime: listen for new notifications
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          // When a notification is marked as read
          if (
            payload.new &&
            (payload.new as { read?: boolean }).read === true &&
            payload.old &&
            (payload.old as { read?: boolean }).read === false
          ) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, supabase]);

  // Reset unread count when visiting notifications page
  useEffect(() => {
    if (pathname === "/dashboard/notifications") {
      setUnreadCount(0);
    }
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  function NavLink({
    item,
    isCollapsed,
    onClick,
  }: {
    item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> };
    isCollapsed: boolean;
    onClick?: () => void;
  }) {
    const isActive =
      item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

    const linkContent = (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          isCollapsed && "justify-center px-0",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-lg bg-sidebar-accent"
            style={{ zIndex: -1 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  }

  function SidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
    return (
      <div className="flex h-full flex-col">
        {/* Header: Logo + Collapse toggle */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-sidebar-border",
            isCollapsed ? "justify-center px-2" : "px-3",
          )}
        >
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
                >
                  <LogoIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                BarberOS — Espandi
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <LogoFull className="flex-1 min-w-0" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/notifications"
                    className="relative shrink-0 rounded-md p-2 text-sidebar-foreground/30 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  Notifiche{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    className="shrink-0 rounded-md p-2 text-sidebar-foreground/30 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <PanelLeftClose className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={4}>
                  Comprimi
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navSections.map((section, idx) => (
            <div key={section.label}>
              {idx > 0 && <Separator className="my-3 bg-sidebar-border" />}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    item={item}
                    isCollapsed={isCollapsed}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: Theme toggle + Logout */}
        <div className="border-t border-sidebar-border px-3 py-2">
          <div className={cn("flex gap-1", isCollapsed ? "flex-col items-center" : "items-center")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "sm"}
                  onClick={toggleTheme}
                  className={cn(
                    "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                    !isCollapsed && "flex-1 justify-start gap-2",
                  )}
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden whitespace-nowrap text-xs"
                      >
                        Tema
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  Cambia tema
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "sm"}
                  onClick={handleLogout}
                  className={cn(
                    "text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10",
                    !isCollapsed && "flex-1 justify-start gap-2",
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden whitespace-nowrap text-xs"
                      >
                        Esci
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  Esci
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-border bg-background p-2 shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 w-[280px] border-r border-sidebar-border bg-sidebar shadow-xl"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3.5 rounded-md p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent isCollapsed={false} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden shrink-0 border-r border-sidebar-border bg-sidebar lg:block"
      >
        <SidebarContent isCollapsed={collapsed} />
      </motion.aside>
    </>
  );
}
