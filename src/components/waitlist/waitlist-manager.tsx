"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Clock,
  Search,
  Phone,
  Trash2,
  Loader2,
  Bell,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { removeWaitlistEntry, expireOldEntries } from "@/actions/waitlist";
import type { WaitlistEntry } from "@/actions/waitlist";

type StatusFilter = "all" | "waiting" | "notified" | "converted" | "expired";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  waiting: { label: "In attesa", color: "bg-amber-100 text-amber-800", icon: Timer },
  notified: { label: "Notificato", color: "bg-blue-100 text-blue-800", icon: Bell },
  converted: { label: "Convertito", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  expired: { label: "Scaduto", color: "bg-gray-100 text-gray-500", icon: XCircle },
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
  if (diffDays < -1) return `${Math.abs(diffDays)} giorni fa`;
  return `Tra ${diffDays} giorni`;
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
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Lista d&apos;attesa</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome, telefono, servizio..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {hasExpirable && (
            <button
              onClick={handleExpireOld}
              disabled={isPending}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Scaduti
            </button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["all", "waiting", "notified", "converted", "expired"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            {s === "all" ? "Tutti" : STATUS_CONFIG[s].label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px]",
              statusFilter === s ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500",
            )}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Entries list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {searchQuery || statusFilter !== "all" ? (
            <>
              <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium">Nessun risultato</p>
              <p className="mt-1 text-sm">Prova a cambiare i filtri di ricerca.</p>
            </>
          ) : (
            <>
              <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium">Nessuno in lista d&apos;attesa</p>
              <p className="mt-1 text-sm">
                I clienti vengono aggiunti automaticamente quando si cancellano appuntamenti.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.waiting;
            const StatusIcon = config.icon;
            const clientName = entry.client
              ? `${entry.client.first_name}${entry.client.last_name ? ` ${entry.client.last_name}` : ""}`
              : "Sconosciuto";
            const isDeleting = deletingId === entry.id;
            const canRemove = entry.status === "waiting" || entry.status === "notified";

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center justify-between rounded-xl bg-white p-4 shadow-sm",
                  entry.status === "expired" && "opacity-60",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-gray-900">{clientName}</h3>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", config.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {formatDate(entry.desired_date)} · {formatTime(entry.desired_start_time)}–{formatTime(entry.desired_end_time)}
                      </span>
                      <span className="text-gray-400">{formatRelativeDate(entry.desired_date)}</span>
                      {entry.service && (
                        <span>{entry.service.name}</span>
                      )}
                      {entry.client?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {entry.client.phone}
                        </span>
                      )}
                      {entry.notified_at && (
                        <span className="text-blue-600">
                          Notificato {new Date(entry.notified_at).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {canRemove && (
                  <button
                    onClick={() => handleRemove(entry.id)}
                    disabled={isDeleting}
                    className="ml-3 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
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
