"use client";

import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  Scissors,
  Search,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { WaitlistEntry } from "@/actions/waitlist";
import { expireOldEntries, removeWaitlistEntry } from "@/actions/waitlist";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "waiting" | "notified" | "converted" | "expired";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dotColor: string; icon: typeof Clock }
> = {
  waiting: {
    label: "In attesa",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    dotColor: "bg-amber-500",
    icon: Timer,
  },
  notified: {
    label: "Notificato",
    color: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
    dotColor: "bg-violet-500",
    icon: Bell,
  },
  converted: {
    label: "Convertito",
    color: "bg-foreground/10 text-foreground",
    dotColor: "bg-foreground",
    icon: CheckCircle2,
  },
  expired: {
    label: "Scaduto",
    color: "bg-muted text-muted-foreground",
    dotColor: "bg-muted-foreground/50",
    icon: XCircle,
  },
};

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Tutti",
  waiting: "In attesa",
  notified: "Notificati",
  converted: "Convertiti",
  expired: "Scaduti",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

function formatRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  if (diffDays === -1) return "Ieri";
  if (diffDays < -1) return `${Math.abs(diffDays)}g fa`;
  return `Tra ${diffDays}g`;
}

interface WaitlistManagerProps {
  initialEntries: WaitlistEntry[];
}

export function WaitlistManager({ initialEntries }: WaitlistManagerProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = entries;

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.client?.first_name.toLowerCase().includes(q) ||
          (e.client?.last_name && e.client.last_name.toLowerCase().includes(q)) ||
          e.client?.phone.includes(q) ||
          e.service?.name.toLowerCase().includes(q),
      );
    }

    return result;
  }, [entries, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    const c = { all: entries.length, waiting: 0, notified: 0, converted: 0, expired: 0 };
    for (const e of entries) {
      if (e.status in c) c[e.status as keyof typeof c]++;
    }
    return c;
  }, [entries]);

  function handleRemove(entryId: string) {
    setDeletingId(entryId);
    startTransition(async () => {
      const result = await removeWaitlistEntry(entryId);
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
      setDeletingId(null);
    });
  }

  function handleExpireOld() {
    startTransition(async () => {
      const result = await expireOldEntries();
      if (result.success) {
        setEntries((prev) =>
          prev.map((e) => {
            const today = new Date().toISOString().split("T")[0];
            if ((e.status === "waiting" || e.status === "notified") && e.desired_date < today) {
              return { ...e, status: "expired" };
            }
            return e;
          }),
        );
      }
    });
  }

  const hasExpirable = entries.some((e) => {
    const today = new Date().toISOString().split("T")[0];
    return (e.status === "waiting" || e.status === "notified") && e.desired_date < today;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Lista d&apos;attesa</h1>
          <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca nome, telefono, servizio..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {hasExpirable && (
            <button
              onClick={handleExpireOld}
              disabled={isPending}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Scaduti
            </button>
          )}
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {(["waiting", "notified", "converted", "expired"] as const).map((status) => {
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                isActive
                  ? "border-foreground/20 bg-foreground/5"
                  : "border-border bg-card hover:border-foreground/10",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  config.color,
                )}
              >
                <StatusIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums text-foreground">
                  {counts[status]}
                </div>
                <div className="text-[11px] text-muted-foreground">{FILTER_LABELS[status]}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filtro:{" "}
            <span className="font-medium text-foreground">{FILTER_LABELS[statusFilter]}</span>
          </span>
          <button
            onClick={() => setStatusFilter("all")}
            className="rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Mostra tutti
          </button>
        </div>
      )}

      {/* Entries list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-8 py-12 text-center">
          {searchQuery || statusFilter !== "all" ? (
            <>
              <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Nessun risultato</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prova a cambiare i filtri di ricerca.
              </p>
            </>
          ) : (
            <>
              <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Nessuno in lista d&apos;attesa</p>
              <p className="mt-1 text-sm text-muted-foreground">
                I clienti vengono aggiunti automaticamente quando si cancellano appuntamenti.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((entry, idx) => {
            const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.waiting;
            const StatusIcon = config.icon;
            const clientName = entry.client
              ? `${entry.client.first_name}${entry.client.last_name ? ` ${entry.client.last_name}` : ""}`
              : "Sconosciuto";
            const isDeleting = deletingId === entry.id;
            const canRemove = entry.status === "waiting" || entry.status === "notified";
            const isExpired = entry.status === "expired";

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30",
                  idx > 0 && "border-t border-border",
                  isExpired && "opacity-50",
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                    isExpired ? "bg-muted text-muted-foreground" : "bg-foreground text-background",
                  )}
                >
                  {clientName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{clientName}</h3>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        config.color,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {/* Date & time */}
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <CalendarClock className="h-3 w-3 text-muted-foreground" />
                      {formatDate(entry.desired_date)} · {formatTime(entry.desired_start_time)}–
                      {formatTime(entry.desired_end_time)}
                    </span>
                    {/* Relative date */}
                    <span
                      className={cn(
                        "rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium",
                        entry.desired_date >= new Date().toISOString().split("T")[0]
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatRelativeDate(entry.desired_date)}
                    </span>
                    {/* Service */}
                    {entry.service && (
                      <span className="flex items-center gap-1">
                        <Scissors className="h-3 w-3" />
                        {entry.service.name}
                      </span>
                    )}
                    {/* Phone */}
                    {entry.client?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {entry.client.phone}
                      </span>
                    )}
                    {/* Notified timestamp */}
                    {entry.notified_at && (
                      <span className="text-violet-600 dark:text-violet-400">
                        Notificato{" "}
                        {new Date(entry.notified_at).toLocaleString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                {canRemove && (
                  <button
                    onClick={() => handleRemove(entry.id)}
                    disabled={isDeleting}
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                    title="Rimuovi dalla lista"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
