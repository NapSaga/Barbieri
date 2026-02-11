"use client";

import {
  Clock,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { createService, deleteService, toggleService, updateService } from "@/actions/services";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_combo: boolean;
  combo_service_ids: string[] | null;
  active: boolean;
  display_order: number;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

interface ServicesManagerProps {
  initialServices: Service[];
}

export function ServicesManager({ initialServices }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createService(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        // Optimistic: refetch handled by revalidatePath
        window.location.reload();
      }
    });
  }

  function handleUpdate(serviceId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateService(serviceId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
        window.location.reload();
      }
    });
  }

  function handleToggle(serviceId: string, currentActive: boolean) {
    startTransition(async () => {
      await toggleService(serviceId, !currentActive);
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, active: !currentActive } : s)),
      );
    });
  }

  function handleDelete(serviceId: string) {
    if (!confirm("Sei sicuro di voler eliminare questo servizio?")) return;
    startTransition(async () => {
      const result = await deleteService(serviceId);
      if (result.error) {
        setError(result.error);
      } else {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scissors className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Servizi</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {services.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuovo servizio
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-xl bg-card border border-border p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Nuovo servizio</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded p-1 hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ServiceForm
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Crea servizio"
            allServices={services}
          />
        </div>
      )}

      {/* Services list */}
      {services.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <Scissors className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nessun servizio</p>
          <p className="mt-1 text-sm">Crea il tuo primo servizio per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "rounded-xl bg-card border border-border p-4 transition-opacity",
                !service.active && "opacity-60",
              )}
            >
              {editingId === service.id ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Modifica servizio</h3>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded p-1 hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ServiceForm
                    onSubmit={(formData) => handleUpdate(service.id, formData)}
                    isPending={isPending}
                    submitLabel="Salva modifiche"
                    defaultValues={{
                      name: service.name,
                      duration_minutes: service.duration_minutes,
                      price: service.price_cents / 100,
                      is_combo: service.is_combo,
                      combo_service_ids: service.combo_service_ids,
                    }}
                    allServices={services.filter((s) => s.id !== service.id)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      {service.is_combo && (
                        <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-xs font-medium text-purple-300">
                          Combo
                        </span>
                      )}
                      {!service.active && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Disattivato
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {service.duration_minutes} min
                      </span>
                      <span className="font-medium text-foreground">
                        {formatPrice(service.price_cents)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(service.id, service.active)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title={service.active ? "Disattiva" : "Attiva"}
                    >
                      {service.active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(service.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service.id)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reusable Service Form ──────────────────────────────────────────

interface ServiceFormProps {
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  submitLabel: string;
  defaultValues?: {
    name: string;
    duration_minutes: number;
    price: number;
    is_combo?: boolean;
    combo_service_ids?: string[] | null;
  };
  allServices?: Service[];
}

function ServiceForm({
  onSubmit,
  isPending,
  submitLabel,
  defaultValues,
  allServices = [],
}: ServiceFormProps) {
  const [isCombo, setIsCombo] = useState(defaultValues?.is_combo ?? false);
  const [selectedComboIds, setSelectedComboIds] = useState<Set<string>>(
    new Set(defaultValues?.combo_service_ids ?? []),
  );

  function toggleComboService(id: string) {
    setSelectedComboIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    formData.set("is_combo", String(isCombo));
    formData.set("combo_service_ids", Array.from(selectedComboIds).join(","));
    onSubmit(formData);
  }

  const comboEligible = allServices.filter((s) => !s.is_combo && s.active);

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-foreground">Nome</label>
          <input
            name="name"
            required
            defaultValue={defaultValues?.name}
            className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Taglio uomo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Durata (min)</label>
          <input
            name="duration_minutes"
            type="number"
            required
            min={5}
            step={5}
            defaultValue={defaultValues?.duration_minutes}
            placeholder="30"
            className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Prezzo (€)</label>
          <input
            name="price"
            type="number"
            required
            min={0}
            step={0.5}
            defaultValue={defaultValues?.price}
            placeholder="15.00"
            className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Combo toggle */}
      {comboEligible.length > 0 && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={isCombo}
              onChange={(e) => {
                setIsCombo(e.target.checked);
                if (!e.target.checked) setSelectedComboIds(new Set());
              }}
              className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
            />
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-medium text-foreground">È un combo</span>
          </label>

          {isCombo && (
            <div className="ml-6 space-y-1.5 rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1.5">
                Seleziona i servizi inclusi. Durata e prezzo del combo sono quelli impostati sopra.
              </p>
              {comboEligible.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedComboIds.has(s.id)}
                    onChange={() => toggleComboService(s.id)}
                    className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                  />
                  <span className="text-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({s.duration_minutes} min — {formatPrice(s.price_cents)})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}
