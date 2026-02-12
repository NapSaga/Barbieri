"use client";

import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  Plus,
  Scissors,
  Search,
  Timer,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { addToWaitlist, expireOldEntries, removeWaitlistEntry } from "@/actions/waitlist";
import { addMinutesToTime } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import type { WaitlistEntry } from "@/types";

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
  const target = new Date(`${dateStr}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  if (diffDays === -1) return "Ieri";
  if (diffDays < -1) return `${Math.abs(diffDays)}g fa`;
  return `Tra ${diffDays}g`;
}

interface ClientData {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string;
}

interface ServiceData {
  id: string;
  name: string;
  duration_minutes: number;
  active: boolean;
}

interface WaitlistManagerProps {
  initialEntries: WaitlistEntry[];
  clients?: ClientData[];
  services?: ServiceData[];
}

export function WaitlistManager({
  initialEntries,
  clients = [],
  services = [],
}: WaitlistManagerProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

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
          e.client?.last_name?.toLowerCase().includes(q) ||
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
          <button
            type="button"
            onClick={() => setShowAddDialog(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Aggiungi
          </button>
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
              type="button"
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
              type="button"
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
            type="button"
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
                    type="button"
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
      {/* Add to waitlist dialog */}
      {showAddDialog && (
        <AddToWaitlistDialog
          clients={clients}
          services={services}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// ─── Add to Waitlist Dialog ─────────────────────────────────────────

interface AddToWaitlistDialogProps {
  clients: ClientData[];
  services: ServiceData[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddToWaitlistDialog({ clients, services, onClose, onSuccess }: AddToWaitlistDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Client mode: "existing" or "new"
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Service & date
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [desiredDate, setDesiredDate] = useState("");
  const [desiredTime, setDesiredTime] = useState("");

  const activeServices = services.filter((s) => s.active);
  const selectedService = activeServices.find((s) => s.id === selectedServiceId);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 10);
    const q = clientSearch.toLowerCase();
    return clients
      .filter(
        (c) =>
          c.first_name.toLowerCase().includes(q) ||
          c.last_name?.toLowerCase().includes(q) ||
          c.phone.includes(q),
      )
      .slice(0, 10);
  }, [clients, clientSearch]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  function handleSubmit() {
    setError(null);

    if (clientMode === "existing" && !selectedClientId) {
      setError("Seleziona un cliente");
      return;
    }
    if (clientMode === "new" && (!newFirstName.trim() || !newPhone.trim())) {
      setError("Nome e telefono sono obbligatori");
      return;
    }
    if (!selectedServiceId) {
      setError("Seleziona un servizio");
      return;
    }
    if (!desiredDate) {
      setError("Seleziona una data");
      return;
    }
    if (desiredDate < new Date().toISOString().split("T")[0]) {
      setError("La data deve essere oggi o nel futuro");
      return;
    }

    const startTime = desiredTime || "09:00";
    const endTime = selectedService
      ? addMinutesToTime(startTime, selectedService.duration_minutes)
      : addMinutesToTime(startTime, 30);

    startTransition(async () => {
      const result = await addToWaitlist({
        clientId: clientMode === "existing" ? selectedClientId! : undefined,
        newClientFirstName: clientMode === "new" ? newFirstName.trim() : undefined,
        newClientLastName: clientMode === "new" ? newLastName.trim() || undefined : undefined,
        newClientPhone: clientMode === "new" ? newPhone.trim() : undefined,
        serviceId: selectedServiceId!,
        desiredDate,
        desiredStartTime: startTime,
        desiredEndTime: endTime,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        {/* Dialog header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Aggiungi alla lista d&apos;attesa
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Client selection */}
          <div className="space-y-2">
            <label htmlFor="waitlist-client" className="block text-sm font-medium text-foreground">
              Cliente
            </label>
            <div className="flex rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => {
                  setClientMode("existing");
                  setSelectedClientId(null);
                }}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  clientMode === "existing"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Esistente
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientMode("new");
                  setSelectedClientId(null);
                }}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  clientMode === "new"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Nuovo
              </button>
            </div>

            {clientMode === "existing" ? (
              <div className="space-y-2">
                {selectedClient ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">
                      {selectedClient.first_name}
                      {selectedClient.last_name ? ` ${selectedClient.last_name}` : ""}
                      <span className="ml-2 text-muted-foreground">{selectedClient.phone}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedClientId(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Cerca per nome o telefono..."
                        className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    {filteredClients.length > 0 && (
                      <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
                        {filteredClients.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setClientSearch("");
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                          >
                            <span className="font-medium text-foreground">
                              {c.first_name}
                              {c.last_name ? ` ${c.last_name}` : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">{c.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Nome *"
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Cognome"
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Telefono *"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
          </div>

          {/* Service */}
          <div className="space-y-1">
            <label htmlFor="waitlist-service" className="block text-sm font-medium text-foreground">
              Servizio
            </label>
            <select
              id="waitlist-service"
              value={selectedServiceId || ""}
              onChange={(e) => setSelectedServiceId(e.target.value || null)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleziona servizio...</option>
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="waitlist-date" className="block text-sm font-medium text-foreground">
                Data desiderata
              </label>
              <input
                id="waitlist-date"
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="waitlist-time" className="block text-sm font-medium text-foreground">
                Orario preferito
                <span className="ml-1 text-xs font-normal text-muted-foreground">(opz.)</span>
              </label>
              <input
                id="waitlist-time"
                type="time"
                value={desiredTime}
                onChange={(e) => setDesiredTime(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Dialog footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Aggiungi
          </button>
        </div>
      </div>
    </div>
  );
}
