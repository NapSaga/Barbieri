"use client";

import {
  Bell,
  BellOff,
  Calendar,
  CheckCheck,
  CircleAlert,
  CircleX,
  UserCheck,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { NotificationEntry, NotificationType } from "@/types";

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  new_booking: Calendar,
  cancellation: CircleX,
  confirmation: UserCheck,
  no_show: UserX,
  waitlist_converted: CircleAlert,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  new_booking: "text-emerald-500",
  cancellation: "text-red-500",
  confirmation: "text-blue-500",
  no_show: "text-amber-500",
  waitlist_converted: "text-violet-500",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Adesso";
  if (diffMin < 60) return `${diffMin} min fa`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h fa`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ieri";
  if (diffDays < 7) return `${diffDays}g fa`;

  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export function NotificationsList({
  initialNotifications,
  businessId,
}: {
  initialNotifications: NotificationEntry[];
  businessId?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Supabase Realtime: auto-add new notifications to the list
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel("notifications-list-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            type: NotificationType;
            title: string;
            body: string;
            appointment_id: string | null;
            read: boolean;
            created_at: string;
          };
          setNotifications((prev) => [row, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, supabase]);

  const handleMarkAsRead = useCallback(
    (notif: NotificationEntry) => {
      if (notif.read) {
        if (notif.appointment_id) {
          router.push("/dashboard");
        }
        return;
      }

      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));

      startTransition(async () => {
        await markNotificationAsRead(notif.id);
        if (notif.appointment_id) {
          router.push("/dashboard");
        }
      });
    },
    [router],
  );

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      await markAllNotificationsAsRead();
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <BellOff className="h-12 w-12 opacity-30" />
        <p className="text-sm font-medium">Nessuna notifica</p>
        <p className="text-xs">Le notifiche degli appuntamenti appariranno qui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{unreadCount}</span> non lette
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Segna tutte come lette
          </Button>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {notifications.map((notif) => {
          const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
          const color = NOTIFICATION_COLORS[notif.type] || "text-muted-foreground";

          return (
            <button
              key={notif.id}
              type="button"
              onClick={() => handleMarkAsRead(notif)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                !notif.read && "bg-primary/[0.03]",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  !notif.read ? "bg-primary/10" : "bg-muted",
                )}
              >
                <Icon className={cn("h-4 w-4", !notif.read ? color : "text-muted-foreground")} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      !notif.read ? "font-semibold text-foreground" : "font-medium text-foreground/70",
                    )}
                  >
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{notif.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/60">
                  {timeAgo(notif.created_at)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
