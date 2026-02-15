"use client";

import { Bell, CalendarCheck, Clock, MessageSquare, Star, Users, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn, SectionWrapper, StaggerContainer, StaggerItem } from "./motion-wrapper";

const steps = [
  {
    step: 1,
    icon: CalendarCheck,
    title: "Il cliente prenota online",
    description: "Dal link dedicato, 24 ore su 24. Si sceglie barbiere, servizio e orario.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    step: 2,
    icon: MessageSquare,
    title: "Conferma WhatsApp istantanea",
    description: "Il cliente riceve un messaggio WhatsApp con tutti i dettagli dell'appuntamento.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    step: 3,
    icon: Bell,
    title: "Richiesta conferma il giorno prima",
    description:
      "WhatsApp automatico: 'Ci vediamo domani alle 10:00? Rispondi CONFERMA o CANCELLA.'",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    step: 4,
    icon: Clock,
    title: "Reminder 2 ore prima",
    description: "Ultimo promemoria automatico. Il cliente non puo dimenticarsene.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    step: 5,
    icon: XCircle,
    title: "Cancellazione automatica",
    description: "Se il cliente non conferma, l'appuntamento viene cancellato e lo slot si libera.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    step: 6,
    icon: Users,
    title: "Notifica lista d'attesa",
    description:
      "Il primo in lista riceve un WhatsApp con il link per prenotare lo slot appena liberato.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    step: 7,
    icon: Star,
    title: "Recensione Google automatica",
    description:
      "Dopo l'appuntamento, il cliente riceve il link per lasciare una recensione su Google.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
];

const results = [
  { value: "-70%", label: "No-show", color: "text-emerald-500" },
  { value: "100%", label: "Slot riempiti", color: "text-blue-500" },
  { value: "+500%", label: "Recensioni Google", color: "text-yellow-500" },
  { value: "0 min", label: "Lavoro manuale", color: "text-violet-500" },
];

export function WhatsAppSection() {
  return (
    <SectionWrapper id="whatsapp" className="bg-card/30">
      <FadeIn>
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <MessageSquare className="h-3.5 w-3.5" />
            Il vantaggio competitivo
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            L'automazione WhatsApp che
            <br />
            <span className="text-emerald-500">nessun altro ha</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Ogni barbiere in Italia usa WhatsApp, ma lo fa manualmente. BarberOS e l'unico
            gestionale che automatizza tutto il flusso, dalla prenotazione alla recensione.
          </p>
        </div>
      </FadeIn>

      {/* Timeline */}
      <div className="relative mt-12">
        {/* Vertical line */}
        <div className="absolute top-0 bottom-0 left-6 hidden w-px bg-border sm:block md:left-1/2 md:-translate-x-px" />

        <StaggerContainer className="space-y-4" staggerDelay={0.1}>
          {steps.map((step, i) => (
            <StaggerItem key={step.step}>
              <div
                className={cn(
                  "relative flex items-start gap-4 sm:gap-6",
                  "md:even:flex-row-reverse md:even:text-right",
                )}
              >
                {/* Connector dot (desktop) */}
                <div className="hidden md:absolute md:left-1/2 md:block md:-translate-x-1/2">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-background",
                    )}
                  >
                    <step.icon className={cn("h-5 w-5", step.color)} />
                  </div>
                </div>

                {/* Mobile icon */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full md:hidden",
                    step.bg,
                  )}
                >
                  <step.icon className={cn("h-5 w-5", step.color)} />
                </div>

                {/* Content card */}
                <div
                  className={cn(
                    "flex-1 rounded-xl border border-border bg-card p-4",
                    i % 2 === 0 ? "md:mr-[calc(50%+2rem)]" : "md:ml-[calc(50%+2rem)]",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 flex items-center gap-2",
                      i % 2 !== 0 && "md:flex-row-reverse",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                        step.bg,
                        step.color,
                      )}
                    >
                      {step.step}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p
                    className={cn(
                      "text-xs leading-relaxed text-muted-foreground",
                      i % 2 !== 0 && "md:text-right",
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Results */}
      <FadeIn delay={0.3}>
        <div className="mt-12 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-emerald-500">
            Risultato
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {results.map((result) => (
              <div key={result.label} className="text-center">
                <p className={cn("text-2xl font-bold tabular-nums sm:text-3xl", result.color)}>
                  {result.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{result.label}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Bottom note */}
      <FadeIn delay={0.4}>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Tutto questo succede in automatico, 24 ore su 24, senza che tu tocchi il telefono.
        </p>
      </FadeIn>
    </SectionWrapper>
  );
}
