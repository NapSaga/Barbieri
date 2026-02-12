"use client";

import {
  ArrowRight,
  Ban,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Euro,
  MessageSquare,
  Scissors,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_CHAIRS = 3;
const DEFAULT_APPOINTMENTS_PER_CHAIR = 10;
const DEFAULT_AVG_TICKET = 25;
const DEFAULT_NO_SHOW_OUT_OF_10 = 2; // su 10 clienti, 2 non si presentano
const DEFAULT_WORKING_DAYS = 27; // 31 - 4 lunedì

// ─── BarberOS Impact Constants ───────────────────────────────────────

const NOSHOW_REDUCTION_PCT = 70; // BarberOS riduce i no-show del 70%
const WAITLIST_FILL_PCT = 40; // 40% degli slot cancellati vengono riempiti dalla lista d'attesa
const REACTIVATION_CLIENTS_PER_CHAIR = 2; // ~2 clienti dormienti riattivati per poltrona al mese
const TIME_SAVED_MIN_PER_DAY = 45; // minuti risparmiati al giorno su gestione manuale

// ─── Advantage Cards ─────────────────────────────────────────────────

const ADVANTAGES = [
  {
    icon: MessageSquare,
    title: "WhatsApp Automatico",
    description:
      "Conferma appuntamento, 2 reminder, notifica 2h prima. Il cliente non dimentica mai. Zero lavoro manuale per te.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Ban,
    title: "Cancellazione Automatica",
    description:
      "Se il cliente non conferma, l'appuntamento viene cancellato automaticamente e il primo in lista d'attesa viene notificato. Nessun buco in agenda.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Clock,
    title: "Lista d'Attesa Intelligente",
    description:
      "Quando si libera uno slot, il sistema notifica automaticamente via WhatsApp chi è in attesa. Lo slot viene riempito senza che tu faccia nulla.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: CalendarCheck,
    title: "Prenotazione Online 24/7",
    description:
      "I clienti prenotano dal loro telefono, a qualsiasi ora. Link dedicato per il tuo negozio, condivisibile su Instagram, Google, WhatsApp.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Users,
    title: "CRM Clienti Completo",
    description:
      "Storico visite, tag automatici (Affidabile / Non conferma), note personalizzate. Conosci ogni cliente nel dettaglio.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Star,
    title: "Recensioni Google Automatiche",
    description:
      "Dopo ogni appuntamento completato, il cliente riceve un messaggio WhatsApp con il link per lasciare una recensione. Più stelle, più clienti.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: TrendingUp,
    title: "Riattivazione Clienti Dormienti",
    description:
      "Il sistema identifica chi non viene da tempo e invia automaticamente un WhatsApp personalizzato con il link per prenotare. Recupera clienti persi.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Scissors,
    title: "Calendario Multi-Poltrona",
    description:
      "Gestisci più barbieri con orari diversi, servizi diversi, break personalizzati. Tutto in un calendario interattivo con vista giornaliera.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: Smartphone,
    title: "App Nativa (PWA)",
    description:
      "Installabile su iPhone e Android come un'app vera. Funziona offline, notifiche push, accesso rapido dalla home screen.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Zero Double Booking",
    description:
      "5 livelli di protezione contro le doppie prenotazioni. Slot passati nascosti, conflict check server-side, validazione in tempo reale.",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function fmtEuro(n: number) {
  return `€${Math.round(n).toLocaleString("it-IT")}`;
}

// ─── Component ───────────────────────────────────────────────────────

export function RoiSimulator() {
  const [chairs, setChairs] = useState(DEFAULT_CHAIRS);
  const [aptsPerChair, setAptsPerChair] = useState(DEFAULT_APPOINTMENTS_PER_CHAIR);
  const [avgTicket, setAvgTicket] = useState(DEFAULT_AVG_TICKET);
  const [noShowPer10, setNoShowPer10] = useState(DEFAULT_NO_SHOW_OUT_OF_10);
  const [workingDays, setWorkingDays] = useState(DEFAULT_WORKING_DAYS);
  const [showAllAdvantages, setShowAllAdvantages] = useState(false);

  // ─── Calculations ────────────────────────────────────────────────

  const totalDailyAppointments = chairs * aptsPerChair;
  const noShowRate = noShowPer10 / 10; // 0.0 - 1.0

  // FATTURATO
  const potentialMonthly = totalDailyAppointments * avgTicket * workingDays;
  const noShowsPerDay = Math.round(totalDailyAppointments * noShowRate);
  const noShowsPerMonth = noShowsPerDay * workingDays;
  const lostToNoShow = noShowsPerMonth * avgTicket;
  const currentRevenue = potentialMonthly - lostToNoShow;

  // CON BARBEROS
  const noShowsEliminated = Math.round(noShowsPerMonth * (NOSHOW_REDUCTION_PCT / 100));
  const noShowsRemaining = noShowsPerMonth - noShowsEliminated;
  const recoveredFromNoShow = noShowsEliminated * avgTicket;

  const slotsFilledByWaitlist = Math.round(noShowsRemaining * (WAITLIST_FILL_PCT / 100));
  const recoveredFromWaitlist = slotsFilledByWaitlist * avgTicket;

  const reactivatedClients = REACTIVATION_CLIENTS_PER_CHAIR * chairs;
  const recoveredFromReactivation = reactivatedClients * avgTicket * 1.5; // media 1.5 visite

  const totalRecovered = recoveredFromNoShow + recoveredFromWaitlist + recoveredFromReactivation;
  const revenueWithBarberOS = currentRevenue + totalRecovered;

  const timeSavedHours = Math.round((TIME_SAVED_MIN_PER_DAY * workingDays) / 60);

  // COSTI E ROI
  const planCost = chairs <= 2 ? 300 : 500;
  const planName = chairs <= 2 ? "Essential" : "Professional";
  const netGain = totalRecovered - planCost;
  const roiMultiplier = planCost > 0 ? (totalRecovered / planCost).toFixed(1) : "∞";

  // PAYBACK
  const paybackMonths =
    netGain > 0 ? 1 : totalRecovered > 0 ? Math.ceil(planCost / totalRecovered) : 0;

  // FATTURATO ANNUO per contesto
  const annualRevenue = currentRevenue * 12;
  const annualWithBarberOS = revenueWithBarberOS * 12;

  const visibleAdvantages = showAllAdvantages ? ADVANTAGES : ADVANTAGES.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">ROI & Vantaggi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scopri quanto guadagna la tua barberia e quanto di più potresti incassare con BarberOS.
        </p>
      </div>

      {/* Market Stats Banner */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MarketStat
          value="90.000+"
          label="Barberie in Italia"
          detail="1 ogni 590 abitanti — tra le densità più alte d'Europa"
        />
        <MarketStat
          value="Solo 20-30%"
          label="Usa un gestionale"
          detail="La maggioranza si affida ancora ad agenda cartacea e telefono"
        />
        <MarketStat
          value="45%"
          label="Prenota fuori orario"
          detail="Il 60% da mobile — il bisogno di prenotazione online è enorme"
        />
      </div>

      {/* Simulator */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Euro className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Simulatore Fatturato</h2>
              <p className="text-xs text-muted-foreground">
                Inserisci i numeri della tua barberia — vedi subito il risultato
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* ── LEFT: Inputs ── */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                La tua barberia
              </h3>

              <SliderInput
                label="Poltrone (barbieri)"
                value={chairs}
                onChange={setChairs}
                min={1}
                max={10}
                step={1}
                suffix=""
                icon={Scissors}
                hint={`${chairs} ${chairs === 1 ? "barbiere" : "barbieri"} che lavorano`}
              />
              <SliderInput
                label="Appuntamenti per poltrona al giorno"
                value={aptsPerChair}
                onChange={setAptsPerChair}
                min={4}
                max={20}
                step={1}
                suffix=""
                icon={CalendarCheck}
                hint={`Totale: ${totalDailyAppointments} appuntamenti/giorno su ${chairs} poltrone`}
              />
              <SliderInput
                label="Scontrino medio"
                value={avgTicket}
                onChange={setAvgTicket}
                min={10}
                max={80}
                step={5}
                suffix="€"
                icon={Euro}
                hint="Quanto paga in media un cliente"
              />
              <SliderInput
                label="Su 10 clienti, quanti non si presentano?"
                value={noShowPer10}
                onChange={setNoShowPer10}
                min={0}
                max={5}
                step={1}
                suffix=""
                icon={UserX}
                hint={
                  noShowPer10 === 0
                    ? "Nessun no-show — complimenti!"
                    : `${noShowPer10} su 10 non si presentano (${noShowPer10 * 10}%)`
                }
              />
              <SliderInput
                label="Giorni lavorativi al mese"
                value={workingDays}
                onChange={setWorkingDays}
                min={20}
                max={31}
                step={1}
                suffix="gg"
                icon={Clock}
                hint="Di solito 27 (tutti i giorni tranne i lunedì)"
              />
            </div>

            {/* ── RIGHT: Results ── */}
            <div className="space-y-5">
              {/* SITUAZIONE ATTUALE */}
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Situazione attuale
              </h3>

              <div className="space-y-2">
                <SummaryRow
                  label={`Fatturato potenziale (se tutti si presentano)`}
                  value={fmtEuro(potentialMonthly)}
                  muted
                />
                <SummaryRow
                  label={`Perdi per no-show (${noShowsPerMonth} appuntamenti saltati)`}
                  value={`−${fmtEuro(lostToNoShow)}`}
                  negative
                />
                <div className="border-t border-border" />
                <SummaryRow
                  label="Il tuo fatturato reale oggi"
                  value={fmtEuro(currentRevenue)}
                  bold
                  size="lg"
                />
              </div>

              {/* CON BARBEROS */}
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Con BarberOS recuperi
              </h3>

              <div className="space-y-2">
                <SummaryRow
                  label={`No-show eliminati (${noShowsEliminated} clienti che ora si presentano)`}
                  value={`+${fmtEuro(recoveredFromNoShow)}`}
                  positive
                />
                <SummaryRow
                  label={`Lista d'attesa (${slotsFilledByWaitlist} slot riempiti automaticamente)`}
                  value={`+${fmtEuro(recoveredFromWaitlist)}`}
                  positive
                />
                <SummaryRow
                  label={`Clienti riattivati (${reactivatedClients} che tornano a prenotare)`}
                  value={`+${fmtEuro(Math.round(recoveredFromReactivation))}`}
                  positive
                />
                <SummaryRow label={`Tempo risparmiato`} value={`${timeSavedHours}h/mese`} muted />
              </div>

              {/* RIEPILOGO FINALE */}
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2.5">
                <SummaryRow
                  label="Fatturato con BarberOS"
                  value={fmtEuro(revenueWithBarberOS)}
                  bold
                  size="lg"
                />
                <SummaryRow
                  label="Incasso extra rispetto a oggi"
                  value={`+${fmtEuro(totalRecovered)}`}
                  positive
                  bold
                />

                <div className="border-t border-primary/20" />

                <SummaryRow
                  label={`Costo piano ${planName}`}
                  value={`−${fmtEuro(planCost)}/mese`}
                  muted
                />
                <SummaryRow
                  label="Guadagno netto dopo il costo"
                  value={`${netGain >= 0 ? "+" : ""}${fmtEuro(netGain)}/mese`}
                  bold
                  size="lg"
                  positive={netGain >= 0}
                  negative={netGain < 0}
                />

                <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 mt-1">
                  <p className="text-sm text-muted-foreground">Ritorno sull'investimento</p>
                  <p className="text-lg font-bold text-primary tabular-nums">{roiMultiplier}x</p>
                </div>

                <p className="text-[11px] text-muted-foreground/60 text-center">
                  Ogni €1 investito in BarberOS ti genera €{roiMultiplier} di ritorno
                  {paybackMonths <= 1 && " — si ripaga dal primo mese"}
                </p>
              </div>

              {/* Contesto annuale */}
              <div className="rounded-lg border border-border bg-background/50 p-3 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  In un anno
                </p>
                <SummaryRow label="Fatturato annuo attuale" value={fmtEuro(annualRevenue)} muted />
                <SummaryRow
                  label="Fatturato annuo con BarberOS"
                  value={fmtEuro(annualWithBarberOS)}
                  bold
                  positive
                />
                <SummaryRow
                  label="Guadagno extra annuo (al netto del piano)"
                  value={`+${fmtEuro(netGain * 12)}`}
                  bold
                  positive={netGain >= 0}
                  negative={netGain < 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Perché costa di più (e perché conviene)
              </h2>
              <p className="text-xs text-muted-foreground">
                I gestionali da €30/mese non hanno WhatsApp automatico — tu continui a perdere
                clienti
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-semibold text-foreground">Funzionalità</th>
                  <th className="pb-3 text-center font-semibold text-muted-foreground">
                    Gestionali classici
                    <br />
                    <span className="text-xs font-normal">€0-35/mese</span>
                  </th>
                  <th className="pb-3 text-center font-semibold text-primary">
                    BarberOS
                    <br />
                    <span className="text-xs font-normal">{fmtEuro(planCost)}/mese</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <ComparisonRow feature="Prenotazione online" classic has />
                <ComparisonRow feature="Calendario multi-poltrona" classic has />
                <ComparisonRow feature="Conferma WhatsApp automatica" has />
                <ComparisonRow feature="Reminder WhatsApp (x3)" has />
                <ComparisonRow feature="Cancellazione auto se non conferma" has />
                <ComparisonRow feature="Lista d'attesa con notifica WhatsApp" has />
                <ComparisonRow feature="Riattivazione clienti dormienti" has />
                <ComparisonRow feature="Recensioni Google automatiche" has />
                <ComparisonRow feature="Tag automatici clienti" has />
                <ComparisonRow feature="Zero double booking (5 livelli)" has />
              </tbody>
            </table>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Il punto:</span> un gestionale da
              €30/mese ti dà un calendario. BarberOS ti fa{" "}
              <span className="font-semibold text-foreground">
                recuperare {fmtEuro(totalRecovered)} al mese
              </span>{" "}
              che oggi stai perdendo — perché nessun altro ha l'automazione WhatsApp che elimina i
              no-show e riempie i buchi in agenda.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp USP */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
              <MessageSquare className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                Perché WhatsApp cambia tutto
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ogni barbiere in Italia usa WhatsApp per parlare con i clienti — ma lo fa{" "}
                <span className="font-semibold text-foreground">manualmente</span>: messaggi uno per
                uno, reminder a voce, nessun sistema. Nessun gestionale per barbieri offre
                l'automazione WhatsApp completa.{" "}
                <span className="font-semibold text-foreground">BarberOS è l'unico.</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <WhatsAppFeature
                  title="Conferma automatica"
                  description="Il cliente riceve un WhatsApp per confermare. Se non risponde, l'appuntamento viene cancellato e lo slot si libera."
                />
                <WhatsAppFeature
                  title="2 Reminder + notifica 2h prima"
                  description="Il cliente non dimentica mai. Tre messaggi automatici prima dell'appuntamento, zero lavoro per te."
                />
                <WhatsAppFeature
                  title="Lista d'attesa automatica"
                  description="Quando si libera uno slot, il primo in lista riceve un WhatsApp con il link per prenotare. Lo slot si riempie da solo."
                />
                <WhatsAppFeature
                  title="Recensioni Google"
                  description="Dopo ogni appuntamento, il cliente riceve il link per lasciare una recensione. Più stelle su Google = più clienti nuovi."
                />
                <WhatsAppFeature
                  title="Riattivazione clienti"
                  description="Chi non viene da tempo riceve un WhatsApp personalizzato con il link per prenotare. Recuperi clienti che avevi perso."
                />
                <WhatsAppFeature
                  title="Tag automatici"
                  description="Il sistema tagga i clienti come 'Affidabile' o 'Non conferma' in base al loro comportamento. Sai subito con chi hai a che fare."
                />
              </div>
              <p className="text-xs text-muted-foreground/70 pt-1">
                Tutto questo succede in automatico, 24 ore su 24, senza che tu tocchi il telefono.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advantages Grid */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Tutti i Vantaggi</h2>
              <p className="text-xs text-muted-foreground">
                Cosa ottieni con BarberOS che nessun altro offre
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleAdvantages.map((adv) => (
              <div
                key={adv.title}
                className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div
                  className={cn(
                    "mb-3 flex h-10 w-10 items-center justify-center rounded-lg",
                    adv.bg,
                  )}
                >
                  <adv.icon className={cn("h-5 w-5", adv.color)} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{adv.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {adv.description}
                </p>
              </div>
            ))}
          </div>

          {ADVANTAGES.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllAdvantages(!showAllAdvantages)}
              className="mx-auto mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              {showAllAdvantages ? (
                <>
                  Mostra meno <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Mostra tutti ({ADVANTAGES.length}) <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-6 text-center">
        <h3 className="text-lg font-bold text-foreground">Pronto a far crescere il tuo negozio?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Con i tuoi numeri, BarberOS si ripaga{" "}
          {paybackMonths <= 1 ? "dal primo mese" : `in ${paybackMonths} mesi`} e ti genera{" "}
          <span className="font-semibold text-foreground">+{fmtEuro(netGain * 12)}/anno</span>{" "}
          netti.
        </p>
        <a
          href="/dashboard/settings"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Vai ai Piani <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`slider-${label}`}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{label}</span>
        </label>
        <span className="shrink-0 rounded-md bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary tabular-nums">
          {value}
          {suffix && <span className="ml-0.5 text-xs font-normal text-primary/70">{suffix}</span>}
        </span>
      </div>
      <input
        id={`slider-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="roi-slider w-full cursor-pointer"
        style={{ "--slider-pct": `${pct}%` } as React.CSSProperties}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60">
          {min}
          {suffix}
        </span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        <span className="text-[10px] text-muted-foreground/60">
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  size,
  positive,
  negative,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  size?: "lg";
  positive?: boolean;
  negative?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p
        className={cn("text-sm", bold ? "font-semibold text-foreground" : "text-muted-foreground")}
      >
        {label}
      </p>
      <p
        className={cn(
          "shrink-0 tabular-nums",
          size === "lg" ? "text-lg font-bold" : "text-sm font-semibold",
          positive && "text-emerald-600 dark:text-emerald-400",
          negative && "text-red-500",
          muted && "text-muted-foreground",
          !positive && !negative && !muted && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function WhatsAppFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-emerald-500/20 bg-background/60 p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function MarketStat({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-2xl font-bold text-primary tabular-nums">{value}</p>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ComparisonRow({
  feature,
  classic,
  has,
}: {
  feature: string;
  classic?: boolean;
  has?: boolean;
}) {
  return (
    <tr>
      <td className="py-2.5 text-foreground">{feature}</td>
      <td className="py-2.5 text-center">
        {classic ? (
          <Check className="mx-auto h-4 w-4 text-muted-foreground" />
        ) : (
          <X className="mx-auto h-4 w-4 text-red-400" />
        )}
      </td>
      <td className="py-2.5 text-center">
        {has ? (
          <Check className="mx-auto h-4 w-4 text-emerald-500" />
        ) : (
          <X className="mx-auto h-4 w-4 text-red-400" />
        )}
      </td>
    </tr>
  );
}
