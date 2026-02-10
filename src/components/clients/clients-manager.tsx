"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  Tag,
  StickyNote,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createNewClient, updateClientTags, updateClientNotes } from "@/actions/clients";

interface ClientData {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  email: string | null;
  notes: string | null;
  tags: string[] | null;
  no_show_count: number;
  total_visits: number;
  last_visit_at: string | null;
}

const TAG_OPTIONS = ["VIP", "Nuovo", "Affidabile", "Non conferma", "Problematico", "Alto rischio no-show"];

const TAG_COLORS: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800",
  Nuovo: "bg-blue-100 text-blue-800",
  Affidabile: "bg-emerald-100 text-emerald-800",
  "Non conferma": "bg-orange-100 text-orange-800",
  Problematico: "bg-red-100 text-red-800",
  "Alto rischio no-show": "bg-orange-100 text-orange-800",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Mai";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ClientsManagerProps {
  initialClients: ClientData[];
}

export function ClientsManager({ initialClients }: ClientsManagerProps) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name && c.last_name.toLowerCase().includes(q)) ||
        c.phone.includes(q),
    );
  }, [clients, searchQuery]);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createNewClient(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        window.location.reload();
      }
    });
  }

  function handleToggleTag(clientId: string, tag: string) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const currentTags = client.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, tags: newTags } : c)),
    );

    startTransition(async () => {
      await updateClientTags(clientId, newTags);
    });
  }

  function handleSaveNotes(clientId: string, notes: string) {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, notes } : c)),
    );
    startTransition(async () => {
      await updateClientNotes(clientId, notes);
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {clients.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome o telefono..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Nuovo
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Nuovo cliente</h3>
            <button onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form action={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input
                  name="first_name"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cognome</label>
                <input
                  name="last_name"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Rossi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefono *</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+39 333 1234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="mario@email.it"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Note</label>
              <textarea
                name="notes"
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Preferenze, allergie, note varie..."
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crea cliente
            </button>
          </form>
        </div>
      )}

      {/* Clients list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {searchQuery ? (
            <>
              <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium">Nessun risultato per &quot;{searchQuery}&quot;</p>
            </>
          ) : (
            <>
              <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium">Nessun cliente</p>
              <p className="mt-1 text-sm">I clienti verranno creati automaticamente alle prenotazioni.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => {
            const fullName = `${client.first_name}${client.last_name ? ` ${client.last_name}` : ""}`;
            const isExpanded = expandedId === client.id;

            return (
              <div key={client.id} className="rounded-xl bg-white shadow-sm">
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {client.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-gray-900">{fullName}</h3>
                        {client.no_show_count >= 2 && (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                        <span>{client.total_visits} visite</span>
                        {client.no_show_count > 0 && (
                          <span className="text-orange-600">{client.no_show_count} no-show</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden text-right text-xs text-gray-500 sm:block">
                      <div>Ultima visita</div>
                      <div className="font-medium text-gray-700">
                        {formatDate(client.last_visit_at)}
                      </div>
                    </div>
                    {/* Tags inline */}
                    <div className="hidden gap-1 sm:flex">
                      {(client.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            TAG_COLORS[tag] || "bg-gray-100 text-gray-700",
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <ClientDetail
                    client={client}
                    onToggleTag={(tag) => handleToggleTag(client.id, tag)}
                    onSaveNotes={(notes) => handleSaveNotes(client.id, notes)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Client Detail Panel ─────────────────────────────────────────────

interface ClientDetailProps {
  client: ClientData;
  onToggleTag: (tag: string) => void;
  onSaveNotes: (notes: string) => void;
}

function ClientDetail({ client, onToggleTag, onSaveNotes }: ClientDetailProps) {
  const [notes, setNotes] = useState(client.notes || "");
  const [notesSaved, setNotesSaved] = useState(false);

  function handleBlurNotes() {
    if (notes !== (client.notes || "")) {
      onSaveNotes(notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  }

  return (
    <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{client.total_visits}</div>
          <div className="text-xs text-gray-500">Visite totali</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className={cn("text-lg font-bold", client.no_show_count > 0 ? "text-orange-600" : "text-gray-900")}>
            {client.no_show_count}
          </div>
          <div className="text-xs text-gray-500">No-show</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="text-sm font-bold text-gray-900">{formatDate(client.last_visit_at)}</div>
          <div className="text-xs text-gray-500">Ultima visita</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="text-sm font-bold text-gray-900">{client.email || "—"}</div>
          <div className="text-xs text-gray-500">Email</div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Tag className="h-4 w-4" />
          Tag
        </div>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => {
            const isActive = (client.tags || []).includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? TAG_COLORS[tag] || "bg-gray-200 text-gray-800"
                    : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <StickyNote className="h-4 w-4" />
          Note
          {notesSaved && <span className="text-xs text-emerald-600">Salvato!</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleBlurNotes}
          rows={3}
          placeholder="Preferenze, allergie, note varie..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
