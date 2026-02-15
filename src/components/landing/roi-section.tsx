"use client";

import { ArrowRight, CalendarCheck, Euro, Scissors, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeIn, SectionWrapper } from "./motion-wrapper";

// ---- Constants (same as roi-simulator.tsx) ----

const NOSHOW_REDUCTION_PCT = 70;
const WAITLIST_FILL_PCT = 40;
const REACTIVATION_CLIENTS_PER_CHAIR = 2;

function fmtEuro(n: number) {
  return `${Math.round(n).toLocaleString("it-IT")}`;
}

// ---- Slider sub-component ----

function LandingSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`landing-slider-${label}`}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{label}</span>
        </label>
        <span className="shrink-0 rounded-md bg-primary/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-primary">
          {value}
          {suffix && <span className="ml-0.5 text-xs font-normal text-primary/70">{suffix}</span>}
        </span>
      </div>
      <input
        id={`landing-slider-${label}`}
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
        <span className="text-[10px] text-muted-foreground/60">
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

// ---- Main Component ----

export function RoiSection() {
  const [chairs, setChairs] = useState(3);
  const [aptsPerChair, setAptsPerChair] = useState(10);
  const [avgTicket, setAvgTicket] = useState(25);
  const [noShowPer10, setNoShowPer10] = useState(2);
  const workingDays = 27;

  // Calculations
  const totalDaily = chairs * aptsPerChair;
  const noShowRate = noShowPer10 / 10;
  const noShowsPerMonth = Math.round(totalDaily * noShowRate) * workingDays;
  const lostToNoShow = noShowsPerMonth * avgTicket;

  const noShowsEliminated = Math.round(noShowsPerMonth * (NOSHOW_REDUCTION_PCT / 100));
  const noShowsRemaining = noShowsPerMonth - noShowsEliminated;
  const recoveredNoShow = noShowsEliminated * avgTicket;
  const recoveredWaitlist = Math.round(noShowsRemaining * (WAITLIST_FILL_PCT / 100)) * avgTicket;
  const recoveredReactivation = REACTIVATION_CLIENTS_PER_CHAIR * chairs * avgTicket * 1.5;

  const totalRecovered = recoveredNoShow + recoveredWaitlist + recoveredReactivation;
  const planCost = chairs <= 2 ? 300 : 500;
  const planName = chairs <= 2 ? "Essential" : "Professional";
  const netGain = totalRecovered - planCost;
  const roi = planCost > 0 ? (totalRecovered / planCost).toFixed(1) : "---";

  return (
    <SectionWrapper id="roi" className="bg-card/30">
      <FadeIn>
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Euro className="h-3.5 w-3.5" />
            Simulatore ROI
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Quanto recuperi con BarberOS?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Inserisci i numeri della tua barberia e scopri subito quanto stai perdendo — e quanto
            puoi recuperare.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-border bg-card">
          <div className="grid gap-0 md:grid-cols-2">
            {/* LEFT: Inputs */}
            <div className="border-b border-border p-6 md:border-r md:border-b-0">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                La tua barberia
              </h3>
              <div className="space-y-6">
                <LandingSlider
                  label="Poltrone"
                  value={chairs}
                  onChange={setChairs}
                  min={1}
                  max={10}
                  step={1}
                  suffix=""
                  icon={Scissors}
                />
                <LandingSlider
                  label="Appuntamenti per poltrona/giorno"
                  value={aptsPerChair}
                  onChange={setAptsPerChair}
                  min={4}
                  max={20}
                  step={1}
                  suffix=""
                  icon={CalendarCheck}
                />
                <LandingSlider
                  label="Scontrino medio"
                  value={avgTicket}
                  onChange={setAvgTicket}
                  min={10}
                  max={80}
                  step={5}
                  suffix=" euro"
                  icon={Euro}
                />
                <LandingSlider
                  label="No-show su 10 clienti"
                  value={noShowPer10}
                  onChange={setNoShowPer10}
                  min={0}
                  max={5}
                  step={1}
                  suffix=""
                  icon={UserX}
                />
              </div>
            </div>

            {/* RIGHT: Results */}
            <div className="p-6">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Il tuo risultato
              </h3>

              {/* Loss */}
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs text-muted-foreground">Oggi perdi per no-show</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-red-500">
                  -{fmtEuro(lostToNoShow)} euro/mese
                </p>
              </div>

              {/* Recovery */}
              <div className="mb-4 space-y-2">
                <ResultRow
                  label="No-show eliminati"
                  value={`+${fmtEuro(recoveredNoShow)} euro`}
                  positive
                />
                <ResultRow
                  label="Lista d'attesa"
                  value={`+${fmtEuro(recoveredWaitlist)} euro`}
                  positive
                />
                <ResultRow
                  label="Clienti riattivati"
                  value={`+${fmtEuro(Math.round(recoveredReactivation))} euro`}
                  positive
                />
              </div>

              {/* Summary */}
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-foreground">Incasso extra</p>
                  <p className="text-xl font-bold tabular-nums text-emerald-500">
                    +{fmtEuro(totalRecovered)} euro/mese
                  </p>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-muted-foreground">Costo {planName}</p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    -{fmtEuro(planCost)} euro/mese
                  </p>
                </div>
                <div className="border-t border-primary/20 pt-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-bold text-foreground">Guadagno netto</p>
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        netGain >= 0 ? "text-emerald-500" : "text-red-500",
                      )}
                    >
                      {netGain >= 0 ? "+" : ""}
                      {fmtEuro(netGain)} euro/mese
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className="text-lg font-bold tabular-nums text-primary">{roi}x</p>
                </div>
                <p className="text-center text-[11px] text-muted-foreground/60">
                  Ogni 1 euro investito in BarberOS ti genera {roi} euro di ritorno
                </p>
              </div>

              {/* CTA */}
              <div className="mt-4">
                <Button className="w-full" size="lg" asChild>
                  <Link href="/register">
                    Inizia la prova gratuita
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </SectionWrapper>
  );
}

function ResultRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          positive ? "text-emerald-500" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
