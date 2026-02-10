"use client";

import { useState, useTransition } from "react";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Clock,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createStaffMember,
  updateStaffMember,
  updateStaffWorkingHours,
  deleteStaffMember,
} from "@/actions/staff";

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

interface StaffManagerProps {
  initialStaff: StaffMemberData[];
}

export function StaffManager({ initialStaff }: StaffManagerProps) {
  const [staff, setStaff] = useState<StaffMemberData[]>(initialStaff);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedHours, setExpandedHours] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  function handleDelete(staffId: string) {
    if (!confirm("Sei sicuro di voler eliminare questo barbiere? Tutti i suoi appuntamenti resteranno ma senza barbiere assegnato.")) return;
    startTransition(async () => {
      const result = await deleteStaffMember(staffId);
      if (result.error) {
        setError(result.error);
      } else {
        setStaff((prev) => prev.filter((s) => s.id !== staffId));
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-7 w-7 text-zinc-300" />
          <h1 className="text-2xl font-bold text-zinc-100">Staff</h1>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            {staff.length}
          </span>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Nuovo barbiere
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-400">{error}</div>}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-xl bg-zinc-900 border border-zinc-800 p-4 shadow-md shadow-black/20">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100">Nuovo barbiere</h3>
            <button onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-zinc-800">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form action={handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300">Nome</label>
              <input
                name="name"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Mario Rossi"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Aggiungi
            </button>
          </form>
        </div>
      )}

      {/* Staff list */}
      {staff.length === 0 && !showForm ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
          <UserCog className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
          <p className="font-medium">Nessun barbiere</p>
          <p className="mt-1 text-sm">Aggiungi il primo barbiere per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className={cn(
                "rounded-xl bg-zinc-900 border border-zinc-800 transition-opacity",
                !member.active && "opacity-60",
              )}
            >
              {/* Main row */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
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
                          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded bg-white px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200"
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800"
                        >
                          Annulla
                        </button>
                      </form>
                    ) : (
                      <>
                        <h3 className="font-semibold text-zinc-100">{member.name}</h3>
                        <p className="text-xs text-zinc-500">
                          {member.active ? "Attivo" : "Disattivato"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setExpandedHours(expandedHours === member.id ? null : member.id)
                    }
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-800"
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
                    onClick={() => handleToggle(member.id, member.active)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                    title={member.active ? "Disattiva" : "Attiva"}
                  >
                    {member.active ? (
                      <ToggleRight className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingId(member.id)}
                    className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-zinc-600 hover:bg-red-950/50 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Working hours panel */}
              {expandedHours === member.id && (
                <WorkingHoursEditor
                  staffId={member.id}
                  workingHours={member.working_hours}
                  onSave={(hours) => {
                    setStaff((prev) =>
                      prev.map((s) =>
                        s.id === member.id ? { ...s, working_hours: hours } : s,
                      ),
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
    <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
      <div className="space-y-2">
        {DAY_ORDER.map((day) => (
          <div key={day} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 font-medium text-zinc-300">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!hours[day].off}
                onChange={(e) => updateDay(day, "off", !e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 text-zinc-300 focus:ring-zinc-500"
              />
              <span className="text-xs text-zinc-500">{hours[day].off ? "Chiuso" : "Aperto"}</span>
            </label>
            {!hours[day].off && (
              <>
                <input
                  type="time"
                  value={hours[day].start}
                  onChange={(e) => updateDay(day, "start", e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-xs"
                />
                <span className="text-zinc-600">&mdash;</span>
                <input
                  type="time"
                  value={hours[day].end}
                  onChange={(e) => updateDay(day, "end", e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-xs"
                />
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Salva orari
        </button>
        {saved && <span className="text-xs text-emerald-400">Salvato!</span>}
      </div>
    </div>
  );
}
