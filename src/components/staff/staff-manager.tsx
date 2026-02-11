"use client";

import {
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCog,
  X,
  AlertTriangle,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import {
  createStaffMember,
  deleteStaffMember,
  reorderStaff,
  updateStaffMember,
  updateStaffServices,
  updateStaffWorkingHours,
} from "@/actions/staff";
import { cn } from "@/lib/utils";

interface WorkingDay {
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
  off: boolean;
}

interface StaffMemberData {
  id: string;
  name: string;
  photo_url: string | null;
  working_hours: Record<string, WorkingDay> | null;
  active: boolean;
  sort_order: number;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Lunedi",
  tuesday: "Martedi",
  wednesday: "Mercoledi",
  thursday: "Giovedi",
  friday: "Venerdi",
  saturday: "Sabato",
  sunday: "Domenica",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface ServiceItem {
  id: string;
  name: string;
  active: boolean;
}

interface StaffServiceLink {
  staffId: string;
  serviceId: string;
}

interface StaffManagerProps {
  initialStaff: StaffMemberData[];
  services?: ServiceItem[];
  initialStaffServices?: StaffServiceLink[];
  maxStaff?: number;
}

export function StaffManager({
  initialStaff,
  services = [],
  initialStaffServices = [],
  maxStaff,
}: StaffManagerProps) {
  const [staff, setStaff] = useState<StaffMemberData[]>(initialStaff);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedHours, setExpandedHours] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<string | null>(null);
  const [staffServices, setStaffServices] = useState<StaffServiceLink[]>(initialStaffServices);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createStaffMember(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        window.location.reload();
      }
    });
  }

  function handleUpdate(staffId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateStaffMember(staffId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
        window.location.reload();
      }
    });
  }

  function handleToggle(staffId: string, currentActive: boolean) {
    const formData = new FormData();
    const member = staff.find((s) => s.id === staffId);
    formData.set("name", member?.name || "");
    formData.set("active", (!currentActive).toString());
    startTransition(async () => {
      await updateStaffMember(staffId, formData);
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, active: !currentActive } : s)),
      );
    });
  }

  function handleDragStart(id: string) {
    dragItem.current = id;
  }

  function handleDragEnter(id: string) {
    dragOverItem.current = id;
    setDragOverId(id);
  }

  function handleDragEnd() {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) {
      setDragOverId(null);
      return;
    }

    const reordered = [...staff];
    const fromIndex = reordered.findIndex((s) => s.id === dragItem.current);
    const toIndex = reordered.findIndex((s) => s.id === dragOverItem.current);
    if (fromIndex === -1 || toIndex === -1) {
      setDragOverId(null);
      return;
    }

    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setStaff(reordered);
    setDragOverId(null);
    dragItem.current = null;
    dragOverItem.current = null;

    startTransition(async () => {
      const result = await reorderStaff(reordered.map((s) => s.id));
      if (result.error) setError(result.error);
    });
  }

  function confirmDelete(staffId: string) {
    startTransition(async () => {
      const result = await deleteStaffMember(staffId);
      if (result.error) {
        setError(result.error);
      } else {
        setStaff((prev) => prev.filter((s) => s.id !== staffId));
      }
      setDeletingId(null);
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {staff.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          disabled={maxStaff !== undefined && staff.length >= maxStaff}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Nuovo barbiere
        </button>
      </div>

      {/* Plan limit banner */}
      {maxStaff !== undefined && staff.length >= maxStaff && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-amber-950/30 p-3">
          <Crown className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-200">
              Limite di {maxStaff} barbieri raggiunto
            </p>
            <p className="text-xs text-amber-400">
              Passa a un piano superiore per aggiungere più barbieri.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-xl bg-card border border-border p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Nuovo barbiere</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded p-1 hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form action={handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="staff-name" className="block text-sm font-medium text-foreground">
                Nome
              </label>
              <input
                id="staff-name"
                name="name"
                required
                className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Mario Rossi"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Aggiungi
            </button>
          </form>
        </div>
      )}

      {/* Staff list */}
      {staff.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <UserCog className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nessun barbiere</p>
          <p className="mt-1 text-sm">Aggiungi il primo barbiere per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: draggable div requires drag event handlers
            <div
              key={member.id}
              draggable
              onDragStart={() => handleDragStart(member.id)}
              onDragEnter={() => handleDragEnter(member.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "rounded-xl bg-card border border-border transition-all",
                !member.active && "opacity-60",
                dragOverId === member.id && "border-primary/50 bg-primary/5",
              )}
            >
              {/* Main row */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle requires onMouseDown on div */}
                  <div
                    className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    onMouseDown={(e) =>
                      e.currentTarget.closest("[draggable]")?.setAttribute("draggable", "true")
                    }
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {editingId === member.id ? (
                      <form
                        action={(formData) => handleUpdate(member.id, formData)}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="active" value={String(member.active)} />
                        <input
                          name="name"
                          required
                          defaultValue={member.name}
                          className="rounded-lg border border-input bg-muted px-2 py-1 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                          Annulla
                        </button>
                      </form>
                    ) : (
                      <>
                        <h3 className="font-semibold text-foreground">{member.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {member.active ? "Attivo" : "Disattivato"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {services.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedServices(expandedServices === member.id ? null : member.id)
                      }
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      Servizi
                      {expandedServices === member.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedHours(expandedHours === member.id ? null : member.id)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Orari
                    {expandedHours === member.id ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(member.id, member.active)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title={member.active ? "Disattiva" : "Attiva"}
                  >
                    {member.active ? (
                      <ToggleRight className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(member.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(member.id)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {deletingId === member.id && (
                <div className="border-t border-border bg-destructive/5 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Eliminare {member.name}?
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Tutti i suoi appuntamenti resteranno ma senza barbiere assegnato.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => confirmDelete(member.id)}
                          disabled={isPending}
                          className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                          Elimina
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Services panel */}
              {expandedServices === member.id && services.length > 0 && (
                <StaffServicesEditor
                  staffId={member.id}
                  services={services}
                  selectedServiceIds={staffServices
                    .filter((ss) => ss.staffId === member.id)
                    .map((ss) => ss.serviceId)}
                  onSave={(serviceIds) => {
                    setStaffServices((prev) => [
                      ...prev.filter((ss) => ss.staffId !== member.id),
                      ...serviceIds.map((serviceId) => ({ staffId: member.id, serviceId })),
                    ]);
                  }}
                />
              )}

              {/* Working hours panel */}
              {expandedHours === member.id && (
                <WorkingHoursEditor
                  staffId={member.id}
                  workingHours={member.working_hours}
                  onSave={(hours) => {
                    setStaff((prev) =>
                      prev.map((s) => (s.id === member.id ? { ...s, working_hours: hours } : s)),
                    );
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Working Hours Editor ────────────────────────────────────────────

interface WorkingHoursEditorProps {
  staffId: string;
  workingHours: Record<string, WorkingDay> | null;
  onSave: (hours: Record<string, WorkingDay>) => void;
}

function WorkingHoursEditor({ staffId, workingHours, onSave }: WorkingHoursEditorProps) {
  const defaultHours: Record<string, WorkingDay> = {};
  for (const day of DAY_ORDER) {
    defaultHours[day] = workingHours?.[day] || { start: "09:00", end: "19:00", off: true };
  }

  const [hours, setHours] = useState<Record<string, WorkingDay>>(defaultHours);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function updateDay(day: string, field: keyof WorkingDay, value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateStaffWorkingHours(staffId, hours);
      if (!result.error) {
        onSave(hours);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="border-t border-border px-4 pb-4 pt-3">
      <div className="space-y-2">
        {DAY_ORDER.map((day) => (
          <div key={day} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 font-medium text-foreground">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!hours[day].off}
                onChange={(e) => updateDay(day, "off", !e.target.checked)}
                className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">
                {hours[day].off ? "Chiuso" : "Aperto"}
              </span>
            </label>
            {!hours[day].off && (
              <>
                <input
                  type="time"
                  value={hours[day].start}
                  onChange={(e) => updateDay(day, "start", e.target.value)}
                  className="rounded border border-input bg-muted px-2 py-1 text-xs"
                />
                <span className="text-muted-foreground">&mdash;</span>
                <input
                  type="time"
                  value={hours[day].end}
                  onChange={(e) => updateDay(day, "end", e.target.value)}
                  className="rounded border border-input bg-muted px-2 py-1 text-xs"
                />
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Salva orari
        </button>
        {saved && <span className="text-xs text-emerald-400">Salvato!</span>}
      </div>
    </div>
  );
}

// ─── Staff Services Editor ──────────────────────────────────────────

interface StaffServicesEditorProps {
  staffId: string;
  services: ServiceItem[];
  selectedServiceIds: string[];
  onSave: (serviceIds: string[]) => void;
}

function StaffServicesEditor({
  staffId,
  services,
  selectedServiceIds,
  onSave,
}: StaffServicesEditorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedServiceIds));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleService(serviceId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    const serviceIds = Array.from(selected);
    startTransition(async () => {
      const result = await updateStaffServices(staffId, serviceIds);
      if (!result.error) {
        onSave(serviceIds);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  const activeServices = services.filter((s) => s.active);

  return (
    <div className="border-t border-border px-4 pb-4 pt-3">
      <p className="mb-2 text-xs text-muted-foreground">
        Seleziona i servizi che questo barbiere può eseguire. Se nessuno è selezionato, potrà
        eseguire tutti i servizi.
      </p>
      <div className="space-y-1.5">
        {activeServices.map((service) => (
          <label key={service.id} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selected.has(service.id)}
              onChange={() => toggleService(service.id)}
              className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
            />
            <span className="text-foreground">{service.name}</span>
          </label>
        ))}
      </div>
      {activeServices.length === 0 && (
        <p className="text-xs text-muted-foreground">Nessun servizio attivo disponibile.</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Salva servizi
        </button>
        {saved && <span className="text-xs text-emerald-400">Salvato!</span>}
      </div>
    </div>
  );
}
