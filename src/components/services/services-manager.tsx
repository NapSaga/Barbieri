"use client";

import { useState, useTransition } from "react";
import {
  Scissors,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createService,
  updateService,
  toggleService,
  deleteService,
} from "@/actions/services";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_combo: boolean;
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
          <Scissors className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Servizi</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {services.length}
          </span>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Nuovo servizio
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Nuovo servizio</h3>
            <button onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ServiceForm
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Crea servizio"
          />
        </div>
      )}

      {/* Services list */}
      {services.length === 0 && !showForm ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          <Scissors className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium">Nessun servizio</p>
          <p className="mt-1 text-sm">Crea il tuo primo servizio per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "rounded-xl bg-white p-4 shadow-sm transition-opacity",
                !service.active && "opacity-60",
              )}
            >
              {editingId === service.id ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Modifica servizio</h3>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded p-1 hover:bg-gray-100"
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
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      {service.is_combo && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                          Combo
                        </span>
                      )}
                      {!service.active && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                          Disattivato
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {service.duration_minutes} min
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(service.price_cents)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(service.id, service.active)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={service.active ? "Disattiva" : "Attiva"}
                    >
                      {service.active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingId(service.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
  };
}

function ServiceForm({ onSubmit, isPending, submitLabel, defaultValues }: ServiceFormProps) {
  return (
    <form action={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            name="name"
            required
            defaultValue={defaultValues?.name}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Taglio uomo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Durata (min)</label>
          <input
            name="duration_minutes"
            type="number"
            required
            min={5}
            step={5}
            defaultValue={defaultValues?.duration_minutes}
            placeholder="30"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Prezzo (€)</label>
          <input
            name="price"
            type="number"
            required
            min={0}
            step={0.5}
            defaultValue={defaultValues?.price}
            placeholder="15.00"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}
