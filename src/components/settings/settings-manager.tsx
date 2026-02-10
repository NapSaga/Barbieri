"use client";

import { useState, useTransition } from "react";
import {
  Settings,
  Store,
  Clock,
  MessageSquare,
  Star,
  Shield,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  CalendarOff,
  Trash2,
  Plus,
  CreditCard,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateBusinessInfo,
  updateBusinessOpeningHours,
  updateBusinessThresholds,
  upsertMessageTemplate,
} from "@/actions/business";
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_LABELS,
  TEMPLATE_DESCRIPTIONS,
  type MessageTemplate,
  type MessageTemplateType,
} from "@/lib/templates";
import {
  addClosure,
  removeClosure,
  type ClosureEntry,
} from "@/actions/closures";
import {
  createCheckoutSession,
  createPortalSession,
  type SubscriptionInfo,
} from "@/actions/billing";
import { PLANS, STRIPE_CONFIG, type PlanId } from "@/lib/stripe-plans";

// ─── Types ──────────────────────────────────────────────────────────

interface OpeningDay {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  google_review_link: string | null;
  opening_hours: Record<string, OpeningDay> | null;
  timezone: string;
  dormant_threshold_days: number | null;
  no_show_threshold: number | null;
}

interface SettingsManagerProps {
  business: BusinessData;
  initialTemplates: MessageTemplate[];
  whatsappEnabled: boolean;
  initialClosures?: ClosureEntry[];
  subscriptionInfo?: SubscriptionInfo | null;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Lunedì",
  tuesday: "Martedì",
  wednesday: "Mercoledì",
  thursday: "Giovedì",
  friday: "Venerdì",
  saturday: "Sabato",
  sunday: "Domenica",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const TEMPLATE_TYPES: MessageTemplateType[] = [
  "confirmation",
  "confirm_request",
  "confirm_reminder",
  "pre_appointment",
  "cancellation",
  "review_request",
  "reactivation",
  "waitlist_notify",
];

const TEMPLATE_VARIABLES: Record<string, string> = {
  "{{client_name}}": "Nome del cliente",
  "{{service_name}}": "Nome del servizio",
  "{{date}}": "Data appuntamento",
  "{{time}}": "Ora appuntamento",
  "{{deadline}}": "Ora limite conferma",
  "{{business_name}}": "Nome barberia",
  "{{business_address}}": "Indirizzo barberia",
  "{{booking_link}}": "Link pagina prenotazione",
  "{{review_link}}": "Link recensione Google",
};

// ─── Main Component ─────────────────────────────────────────────────

export function SettingsManager({ business, initialTemplates, whatsappEnabled, initialClosures = [], subscriptionInfo }: SettingsManagerProps) {
  const [openSection, setOpenSection] = useState<string | null>("info");

  function toggleSection(section: string) {
    setOpenSection(openSection === section ? null : section);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-7 w-7 text-zinc-300" />
        <h1 className="text-2xl font-bold text-zinc-100">Impostazioni</h1>
      </div>

      <div className="space-y-3">
        <SettingsSection
          id="info"
          icon={<Store className="h-5 w-5" />}
          title="Dati barberia"
          description="Nome, indirizzo, telefono, link Google"
          isOpen={openSection === "info"}
          onToggle={() => toggleSection("info")}
        >
          <BusinessInfoForm business={business} />
        </SettingsSection>

        <SettingsSection
          id="hours"
          icon={<Clock className="h-5 w-5" />}
          title="Orari di apertura"
          description="Giorni e orari di apertura della barberia"
          isOpen={openSection === "hours"}
          onToggle={() => toggleSection("hours")}
        >
          <OpeningHoursForm openingHours={business.opening_hours} />
        </SettingsSection>

        <SettingsSection
          id="whatsapp"
          icon={<Smartphone className="h-5 w-5" />}
          title="WhatsApp"
          description={whatsappEnabled ? "Connesso via Twilio" : "Non configurato — messaggi in modalità test"}
          isOpen={openSection === "whatsapp"}
          onToggle={() => toggleSection("whatsapp")}
        >
          <WhatsAppStatusSection enabled={whatsappEnabled} />
        </SettingsSection>

        <SettingsSection
          id="templates"
          icon={<MessageSquare className="h-5 w-5" />}
          title="Messaggi WhatsApp"
          description="Personalizza i testi dei messaggi automatici"
          isOpen={openSection === "templates"}
          onToggle={() => toggleSection("templates")}
        >
          <MessageTemplatesForm initialTemplates={initialTemplates} />
        </SettingsSection>

        <SettingsSection
          id="review"
          icon={<Star className="h-5 w-5" />}
          title="Recensioni Google"
          description="Configura il link per le recensioni automatiche"
          isOpen={openSection === "review"}
          onToggle={() => toggleSection("review")}
        >
          <GoogleReviewInfo business={business} />
        </SettingsSection>

        <SettingsSection
          id="thresholds"
          icon={<Shield className="h-5 w-5" />}
          title="Regole automatiche"
          description="No-show, clienti dormienti, soglie"
          isOpen={openSection === "thresholds"}
          onToggle={() => toggleSection("thresholds")}
        >
          <ThresholdsForm business={business} />
        </SettingsSection>

        <SettingsSection
          id="closures"
          icon={<CalendarOff className="h-5 w-5" />}
          title="Chiusure straordinarie"
          description="Ferie, festivi, giorni di chiusura extra"
          isOpen={openSection === "closures"}
          onToggle={() => toggleSection("closures")}
        >
          <ClosuresForm initialClosures={initialClosures} />
        </SettingsSection>

        <SettingsSection
          id="billing"
          icon={<CreditCard className="h-5 w-5" />}
          title="Abbonamento"
          description={getBillingDescription(subscriptionInfo)}
          isOpen={openSection === "billing"}
          onToggle={() => toggleSection("billing")}
        >
          <BillingSection subscriptionInfo={subscriptionInfo} />
        </SettingsSection>
      </div>
    </div>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────

function SettingsSection({
  id,
  icon,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">{title}</h3>
            <p className="text-sm text-zinc-500">{description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-zinc-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-zinc-600" />
        )}
      </button>
      {isOpen && <div className="border-t border-zinc-800 p-4">{children}</div>}
    </div>
  );
}

// ─── SaveButton helper ──────────────────────────────────────────────

function SaveButton({
  isPending,
  saved,
  label = "Salva",
}: {
  isPending: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <Check className="h-4 w-4" />
      ) : null}
      {saved ? "Salvato!" : label}
    </button>
  );
}

// ─── Business Info Form ─────────────────────────────────────────────

function BusinessInfoForm({ business }: { business: BusinessData }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await updateBusinessInfo({
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        phone: formData.get("phone") as string,
        google_review_link: formData.get("google_review_link") as string,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-300">Nome barberia</label>
          <input
            name="name"
            required
            defaultValue={business.name}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">Telefono</label>
          <input
            name="phone"
            type="tel"
            defaultValue={business.phone || ""}
            placeholder="+39 333 1234567"
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Indirizzo</label>
        <input
          name="address"
          defaultValue={business.address || ""}
          placeholder="Via Roma 1, 20100 Milano"
          className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300">Link recensione Google</label>
        <input
          name="google_review_link"
          type="url"
          defaultValue={business.google_review_link || ""}
          placeholder="https://g.page/r/..."
          className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Cerca la tua attività su Google Maps → Condividi → Copia link recensione
        </p>
      </div>

      <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
        <span className="font-medium">Slug prenotazione:</span>{" "}
        <code className="rounded bg-zinc-700 px-1.5 py-0.5 text-zinc-300">/book/{business.slug}</code>
      </div>

      {error && <div className="rounded-lg bg-red-950/50 p-3 text-sm text-red-400">{error}</div>}

      <SaveButton isPending={isPending} saved={saved} />
    </form>
  );
}

// ─── Opening Hours Form ─────────────────────────────────────────────

function OpeningHoursForm({
  openingHours,
}: {
  openingHours: Record<string, OpeningDay> | null;
}) {
  const defaultHours: Record<string, OpeningDay> = {};
  for (const day of DAY_ORDER) {
    defaultHours[day] = openingHours?.[day] || {
      open: "09:00",
      close: "19:00",
      closed: day === "sunday",
    };
  }

  const [hours, setHours] = useState<Record<string, OpeningDay>>(defaultHours);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(day: string, field: keyof OpeningDay, value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateBusinessOpeningHours(hours);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-2">
        {DAY_ORDER.map((day) => (
          <div key={day} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 font-medium text-zinc-300">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!hours[day].closed}
                onChange={(e) => updateDay(day, "closed", !e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 text-zinc-300 focus:ring-zinc-500"
              />
              <span className="text-xs text-zinc-500 w-12">
                {hours[day].closed ? "Chiuso" : "Aperto"}
              </span>
            </label>
            {!hours[day].closed && (
              <>
                <input
                  type="time"
                  value={hours[day].open}
                  onChange={(e) => updateDay(day, "open", e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-xs"
                />
                <span className="text-zinc-600">—</span>
                <input
                  type="time"
                  value={hours[day].close}
                  onChange={(e) => updateDay(day, "close", e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-xs"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
        <Info className="mr-1 inline h-3.5 w-3.5" />
        Questi orari determinano gli slot disponibili nella pagina di prenotazione pubblica.
        Gli orari dei singoli barbieri sono configurabili dalla sezione Staff.
      </div>

      {error && <div className="mt-3 rounded-lg bg-red-950/50 p-3 text-sm text-red-400">{error}</div>}

      <div className="mt-4">
        <SaveButton isPending={isPending} saved={saved} label="Salva orari" />
      </div>
    </form>
  );
}

// ─── Message Templates Form ─────────────────────────────────────────

function MessageTemplatesForm({
  initialTemplates,
}: {
  initialTemplates: MessageTemplate[];
}) {
  const [editingType, setEditingType] = useState<MessageTemplateType | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);

  function getTemplateBody(type: MessageTemplateType): string {
    const existing = templates.find((t) => t.type === type);
    return existing?.body_template || DEFAULT_TEMPLATES[type];
  }

  function isTemplateActive(type: MessageTemplateType): boolean {
    const existing = templates.find((t) => t.type === type);
    return existing?.active ?? true;
  }

  return (
    <div>
      <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
        <Info className="mr-1 inline h-3.5 w-3.5" />
        Variabili disponibili:{" "}
        {Object.entries(TEMPLATE_VARIABLES).map(([key, desc]) => (
          <span key={key} className="inline-block mr-2" title={desc}>
            <code className="rounded bg-zinc-700 px-1 py-0.5">{key}</code>
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {TEMPLATE_TYPES.map((type) => (
          <div key={type} className="rounded-lg border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-zinc-100">{TEMPLATE_LABELS[type]}</h4>
                  {!isTemplateActive(type) && (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                      Disattivato
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{TEMPLATE_DESCRIPTIONS[type]}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingType(editingType === type ? null : type)}
                className="ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                {editingType === type ? "Chiudi" : "Modifica"}
              </button>
            </div>

            {editingType === type && (
              <TemplateEditor
                type={type}
                currentBody={getTemplateBody(type)}
                currentActive={isTemplateActive(type)}
                onSaved={(body, active) => {
                  setTemplates((prev) => {
                    const idx = prev.findIndex((t) => t.type === type);
                    const updated = { id: "", type, body_template: body, active };
                    if (idx >= 0) {
                      const next = [...prev];
                      next[idx] = { ...next[idx], body_template: body, active };
                      return next;
                    }
                    return [...prev, updated];
                  });
                  setEditingType(null);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateEditor({
  type,
  currentBody,
  currentActive,
  onSaved,
}: {
  type: MessageTemplateType;
  currentBody: string;
  currentActive: boolean;
  onSaved: (body: string, active: boolean) => void;
}) {
  const [body, setBody] = useState(currentBody);
  const [active, setActive] = useState(currentActive);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await upsertMessageTemplate(type, body, active);
      if (result.error) {
        setError(result.error);
      } else {
        onSaved(body, active);
      }
    });
  }

  function handleReset() {
    setBody(DEFAULT_TEMPLATES[type]);
  }

  return (
    <div className="border-t border-zinc-800 p-3 bg-zinc-800/30">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Salva template
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-800"
          >
            Ripristina default
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActive(!active)}
          className="flex items-center gap-1.5 text-xs text-zinc-500"
        >
          {active ? (
            <ToggleRight className="h-5 w-5 text-emerald-500" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
          {active ? "Attivo" : "Disattivato"}
        </button>
      </div>

      {error && <div className="mt-2 rounded-lg bg-red-950/50 p-2 text-xs text-red-400">{error}</div>}
    </div>
  );
}

// ─── Google Review Info ─────────────────────────────────────────────

function GoogleReviewInfo({ business }: { business: BusinessData }) {
  const hasLink = !!business.google_review_link;

  return (
    <div>
      {hasLink ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-950/30 p-3 text-sm text-emerald-300">
            <Check className="h-4 w-4" />
            Link Google Review configurato
          </div>
          <p className="text-sm text-zinc-400">
            Dopo ogni appuntamento completato, il sistema invierà automaticamente un messaggio
            WhatsApp con il link alla tua recensione Google (max 1 ogni 30 giorni per cliente).
          </p>
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500 break-all">
            {business.google_review_link}
          </div>
          <p className="text-xs text-zinc-500">
            Puoi modificare il link dalla sezione &quot;Dati barberia&quot; sopra.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-amber-950/30 p-3 text-sm text-amber-300">
            <Info className="h-4 w-4" />
            Link Google Review non configurato
          </div>
          <p className="text-sm text-zinc-400">
            Per attivare le richieste automatiche di recensione, aggiungi il link dalla sezione
            &quot;Dati barberia&quot;.
          </p>
          <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-400">
            <p className="font-medium mb-1">Come trovare il link:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Cerca la tua barberia su Google Maps</li>
              <li>Clicca &quot;Scrivi una recensione&quot;</li>
              <li>Copia l&apos;URL dalla barra del browser</li>
              <li>In alternativa: Google Business → Richiedi recensioni → Copia link</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Thresholds Form ────────────────────────────────────────────────

function ThresholdsForm({ business }: { business: BusinessData }) {
  const [dormantDays, setDormantDays] = useState(business.dormant_threshold_days ?? 28);
  const [noShowThreshold, setNoShowThreshold] = useState(business.no_show_threshold ?? 2);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateBusinessThresholds({
        dormant_threshold_days: dormantDays,
        no_show_threshold: noShowThreshold,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300">
          Soglia cliente dormiente (giorni)
        </label>
        <p className="text-xs text-zinc-500 mb-1">
          Dopo quanti giorni senza prenotazione inviare il messaggio di riattivazione
        </p>
        <input
          type="number"
          min={7}
          max={90}
          value={dormantDays}
          onChange={(e) => {
            setDormantDays(Number(e.target.value));
            setSaved(false);
          }}
          className="mt-1 block w-32 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300">
          Soglia no-show (numero)
        </label>
        <p className="text-xs text-zinc-500 mb-1">
          Dopo quanti no-show il cliente viene flaggato come &quot;alto rischio&quot;
        </p>
        <input
          type="number"
          min={1}
          max={10}
          value={noShowThreshold}
          onChange={(e) => {
            setNoShowThreshold(Number(e.target.value));
            setSaved(false);
          }}
          className="mt-1 block w-32 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {error && <div className="rounded-lg bg-red-950/50 p-3 text-sm text-red-400">{error}</div>}

      <SaveButton isPending={isPending} saved={saved} />
    </form>
  );
}

// ─── WhatsApp Status Section ────────────────────────────────────────

function WhatsAppStatusSection({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/30 p-3 text-sm text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <div>
            <span className="font-medium">WhatsApp attivo</span> — I messaggi vengono inviati ai clienti tramite Twilio.
          </div>
        </div>

        <div className="text-sm text-zinc-400 space-y-2">
          <p>
            I messaggi automatici (conferma, reminder, recensioni, riattivazione) sono attivi
            e verranno inviati ai clienti secondo i template configurati nella sezione
            &quot;Messaggi WhatsApp&quot;.
          </p>
          <p>
            I clienti possono rispondere <code className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs font-medium">ANNULLA</code> per
            cancellare un appuntamento, o <code className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs font-medium">SI</code> per
            confermare dalla lista d&apos;attesa.
          </p>
        </div>

        <div className="rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-500">
          <p className="font-medium mb-1">Webhook configurato su:</p>
          <code className="text-zinc-300">{`{tuodominio}/api/whatsapp/webhook`}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-amber-950/30 p-3 text-sm text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <div>
          <span className="font-medium">Modalità test</span> — I messaggi vengono solo registrati nel log, non inviati ai clienti.
        </div>
      </div>

      <div className="text-sm text-zinc-400">
        <p>
          Per attivare l&apos;invio reale di messaggi WhatsApp, serve configurare un account Twilio
          con WhatsApp Business API. Nessuna azione richiesta da parte tua — il tuo sviluppatore
          configurerà le credenziali.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-400">
        <p className="font-medium mb-2">Guida setup per sviluppatore:</p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            Crea account su{" "}
            <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:underline inline-flex items-center gap-0.5">
              twilio.com <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>Abilita WhatsApp Sandbox per testing</li>
          <li>
            Aggiungi le variabili d&apos;ambiente:
            <div className="mt-1 ml-4 space-y-0.5 font-mono text-[11px] text-zinc-500">
              <div>TWILIO_ACCOUNT_SID</div>
              <div>TWILIO_AUTH_TOKEN</div>
              <div>TWILIO_WHATSAPP_FROM</div>
              <div>SUPABASE_SERVICE_ROLE_KEY</div>
            </div>
          </li>
          <li>
            Configura il webhook URL nella console Twilio:
            <div className="mt-1 ml-4 font-mono text-[11px] text-zinc-300">
              POST https://tuodominio.com/api/whatsapp/webhook
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}

// ─── Closures Form ──────────────────────────────────────────────────

function ClosuresForm({ initialClosures }: { initialClosures: ClosureEntry[] }) {
  const [closures, setClosures] = useState<ClosureEntry[]>(initialClosures);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const futureClosures = closures.filter((c) => c.date >= today);
  const pastClosures = closures.filter((c) => c.date < today);

  function handleAdd() {
    if (!newDate) return;
    setError(null);
    startTransition(async () => {
      const result = await addClosure(newDate, newReason || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        setClosures((prev) => [
          ...prev,
          { id: crypto.randomUUID(), date: newDate, reason: newReason || null, created_at: new Date().toISOString() },
        ].sort((a, b) => a.date.localeCompare(b.date)));
        setNewDate("");
        setNewReason("");
      }
    });
  }

  function handleRemove(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await removeClosure(id);
      if (result.success) {
        setClosures((prev) => prev.filter((c) => c.id !== id));
      }
      setDeletingId(null);
    });
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <div className="space-y-4">
      {/* Add new closure */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Data</label>
          <input
            type="date"
            value={newDate}
            min={today}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Motivo (opzionale)</label>
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Es. Ferie, Festivo..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newDate || isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Aggiungi
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Future closures */}
      {futureClosures.length > 0 ? (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase text-zinc-600">Prossime chiusure</h4>
          {futureClosures.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-zinc-100">{formatDate(c.date)}</span>
                {c.reason && <span className="ml-2 text-xs text-zinc-500">— {c.reason}</span>}
              </div>
              <button
                onClick={() => handleRemove(c.id)}
                disabled={deletingId === c.id}
                className="rounded-md p-1.5 text-zinc-600 hover:bg-red-950/50 hover:text-red-400 disabled:opacity-50"
              >
                {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">Nessuna chiusura programmata.</p>
      )}

      {/* Past closures (collapsed) */}
      {pastClosures.length > 0 && (
        <details className="text-xs text-zinc-600">
          <summary className="cursor-pointer hover:text-zinc-400">{pastClosures.length} chiusure passate</summary>
          <div className="mt-2 space-y-1">
            {pastClosures.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-zinc-600">
                <span>{formatDate(c.date)}</span>
                {c.reason && <span>— {c.reason}</span>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Billing Helpers ────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Attivo", color: "emerald" },
  trialing: { label: "Prova gratuita", color: "blue" },
  past_due: { label: "Pagamento in ritardo", color: "amber" },
  cancelled: { label: "Cancellato", color: "red" },
  incomplete: { label: "Incompleto", color: "gray" },
};

function getBillingDescription(info: SubscriptionInfo | null | undefined): string {
  if (!info) return "Gestisci il tuo piano";
  const s = STATUS_LABELS[info.status];
  return s ? s.label : "Gestisci il tuo piano";
}

function formatBillingDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Billing Section ────────────────────────────────────────────────

const PLAN_ORDER: PlanId[] = ["essential", "professional", "enterprise"];

function BillingSection({ subscriptionInfo }: { subscriptionInfo?: SubscriptionInfo | null }) {
  const [isPending, startTransition] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const info = subscriptionInfo;
  const status = info?.status || "trialing";
  const statusMeta = STATUS_LABELS[status] || STATUS_LABELS.incomplete;

  const isActive = status === "active";
  const isTrialing = status === "trialing";
  const isPastDue = status === "past_due";
  const isCancelled = status === "cancelled";
  const hasSubscription = isActive || isPastDue;

  function handleCheckout(planId: PlanId) {
    setPendingPlan(planId);
    startTransition(async () => {
      await createCheckoutSession(planId);
      setPendingPlan(null);
    });
  }

  function handlePortal() {
    startTransition(async () => {
      await createPortalSession();
    });
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg p-4",
          statusMeta.color === "emerald" && "bg-emerald-50",
          statusMeta.color === "blue" && "bg-blue-50",
          statusMeta.color === "amber" && "bg-amber-50",
          statusMeta.color === "red" && "bg-red-50",
          statusMeta.color === "gray" && "bg-gray-50",
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            statusMeta.color === "emerald" && "bg-emerald-100 text-emerald-600",
            statusMeta.color === "blue" && "bg-blue-100 text-blue-600",
            statusMeta.color === "amber" && "bg-amber-100 text-amber-600",
            statusMeta.color === "red" && "bg-red-100 text-red-600",
            statusMeta.color === "gray" && "bg-gray-100 text-gray-600",
          )}
        >
          {isActive ? <Crown className="h-5 w-5" /> : isCancelled ? <AlertTriangle className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
        </div>
        <div>
          <h4
            className={cn(
              "font-semibold",
              statusMeta.color === "emerald" && "text-emerald-800",
              statusMeta.color === "blue" && "text-blue-800",
              statusMeta.color === "amber" && "text-amber-800",
              statusMeta.color === "red" && "text-red-800",
              statusMeta.color === "gray" && "text-gray-800",
            )}
          >
            {statusMeta.label}
            {isActive && info?.planName && ` — ${info.planName}`}
          </h4>
          <p
            className={cn(
              "text-sm",
              statusMeta.color === "emerald" && "text-emerald-600",
              statusMeta.color === "blue" && "text-blue-600",
              statusMeta.color === "amber" && "text-amber-600",
              statusMeta.color === "red" && "text-red-600",
              statusMeta.color === "gray" && "text-gray-600",
            )}
          >
            {isTrialing && info?.trialEnd && `La prova gratuita scade il ${formatBillingDate(info.trialEnd)}`}
            {isTrialing && !info?.trialEnd && `${STRIPE_CONFIG.trialDays} giorni di prova gratuita`}
            {isActive && info?.currentPeriodEnd && `Prossimo rinnovo: ${formatBillingDate(info.currentPeriodEnd)}`}
            {isActive && info?.cancelAtPeriodEnd && ` (si disattiva alla scadenza)`}
            {isPastDue && "Aggiorna il metodo di pagamento per continuare a usare BarberOS"}
            {isCancelled && "Il tuo abbonamento è stato cancellato"}
          </p>
        </div>
      </div>

      {/* Manage button for active subscribers */}
      {hasSubscription && (
        <button
          type="button"
          onClick={handlePortal}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {isPending && !pendingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          Gestisci abbonamento
        </button>
      )}

      {/* Plan cards — show when no active subscription */}
      {(!hasSubscription || isCancelled || isTrialing) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const isEnterprise = planId === "enterprise";
            const isCurrentPlan = info?.planId === planId;
            const isHighlighted = plan.highlighted;

            return (
              <div
                key={planId}
                className={cn(
                  "relative flex flex-col rounded-xl border-2 p-5 transition-shadow",
                  isHighlighted ? "border-blue-500 shadow-lg shadow-blue-100" : "border-gray-200",
                  isCurrentPlan && "ring-2 ring-emerald-500",
                )}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Consigliato
                  </span>
                )}

                <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                <p className="text-sm text-gray-500">{plan.description}</p>

                <div className="mt-3 mb-4">
                  {isEnterprise ? (
                    <span className="text-2xl font-bold text-gray-900">Custom</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900">{plan.priceLabel}</span>
                      <span className="text-sm text-gray-500">/mese</span>
                    </>
                  )}
                </div>

                <ul className="mb-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isEnterprise ? (
                  <a
                    href={`mailto:${STRIPE_CONFIG.contactEmail}?subject=BarberOS Enterprise`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Contattaci
                  </a>
                ) : isCurrentPlan ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle className="h-4 w-4" />
                    Piano attuale
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckout(planId)}
                    disabled={isPending}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50",
                      isHighlighted
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "bg-gray-900 text-white hover:bg-gray-800",
                    )}
                  >
                    {isPending && pendingPlan === planId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {isTrialing ? "Attiva" : "Abbonati"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Trial info */}
      {isTrialing && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Info className="mr-1 inline h-3.5 w-3.5" />
          Durante la prova gratuita di {STRIPE_CONFIG.trialDays} giorni puoi usare tutte le funzionalità.
          Al termine, scegli un piano per continuare.
        </div>
      )}

      {/* Contratto info */}
      <p className="text-xs text-gray-400">
        Contratto 12 mesi. Garanzia risultati: se dopo 3 mesi non vedi un ritorno almeno 2x, esci senza penali.
      </p>
    </div>
  );
}
