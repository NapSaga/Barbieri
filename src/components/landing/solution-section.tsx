"use client";

import {
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  Clock,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn, SectionWrapper, StaggerContainer, StaggerItem } from "./motion-wrapper";

const pillars = [
  {
    id: "automatizza",
    badge: "Pilastro 1",
    title: "Automatizza",
    subtitle: "Basta messaggi manuali",
    description:
      "Prenotazione online, conferma e reminder WhatsApp, cancellazione automatica, lista d'attesa intelligente. Tutto gira senza che tu tocchi il telefono.",
    icon: Zap,
    color: "text-emerald-500",
    borderColor: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    features: [
      { icon: CalendarCheck, text: "Booking online 24/7 con link dedicato" },
      { icon: MessageSquare, text: "Conferma WhatsApp automatica" },
      { icon: Bell, text: "3 reminder prima dell'appuntamento" },
      { icon: Clock, text: "Lista d'attesa con notifica WhatsApp" },
    ],
  },
  {
    id: "cresci",
    badge: "Pilastro 2",
    title: "Fai Crescere",
    subtitle: "Recupera clienti persi",
    description:
      "Riattiva clienti dormienti, raccogli recensioni Google in automatico, attiva il programma referral. Ogni cliente diventa un motore di crescita.",
    icon: TrendingUp,
    color: "text-blue-500",
    borderColor: "border-blue-500/30",
    bg: "bg-blue-500/10",
    features: [
      { icon: Users, text: "Riattivazione clienti che non vengono da tempo" },
      { icon: Star, text: "Recensioni Google automatiche post-appuntamento" },
      { icon: TrendingUp, text: "CRM con tag e storico per ogni cliente" },
      { icon: MessageSquare, text: "Comunicazioni personalizzate via WhatsApp" },
    ],
  },
  {
    id: "controlla",
    badge: "Pilastro 3",
    title: "Controlla",
    subtitle: "Dati, non sensazioni",
    description:
      "Dashboard con fatturato in tempo reale, tasso di no-show, performance per poltrona. Sai esattamente cosa funziona e cosa no.",
    icon: BarChart3,
    color: "text-violet-500",
    borderColor: "border-violet-500/30",
    bg: "bg-violet-500/10",
    features: [
      { icon: BarChart3, text: "Dashboard fatturato e analytics giornalieri" },
      { icon: TrendingUp, text: "No-show rate e performance per barbiere" },
      { icon: CalendarCheck, text: "Calendario multi-poltrona interattivo" },
      { icon: Users, text: "Storico visite e tag automatici per ogni cliente" },
    ],
  },
];

export function SolutionSection() {
  return (
    <SectionWrapper id="soluzione">
      <FadeIn>
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <Check className="h-3.5 w-3.5" />
            La soluzione
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tre pilastri per una barberia
            <br />
            che funziona da sola
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            BarberOS non e un semplice calendario. E un sistema completo che automatizza, fa
            crescere e ti da il controllo della tua attivita.
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="mt-12 grid gap-6 lg:grid-cols-3" staggerDelay={0.15}>
        {pillars.map((pillar) => (
          <StaggerItem key={pillar.id}>
            <div
              className={cn(
                "group relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-colors hover:bg-card/80",
                pillar.borderColor,
              )}
            >
              {/* Header */}
              <div className="mb-4">
                <span
                  className={cn(
                    "mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    pillar.bg,
                    pillar.color,
                  )}
                >
                  {pillar.badge}
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      pillar.bg,
                    )}
                  >
                    <pillar.icon className={cn("h-5 w-5", pillar.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{pillar.title}</h3>
                    <p className="text-xs text-muted-foreground">{pillar.subtitle}</p>
                  </div>
                </div>
              </div>

              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>

              {/* Features */}
              <div className="mt-auto space-y-2.5">
                {pillar.features.map((feature) => (
                  <div key={feature.text} className="flex items-start gap-2.5">
                    <feature.icon className={cn("mt-0.5 h-4 w-4 shrink-0", pillar.color)} />
                    <p className="text-sm text-foreground">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionWrapper>
  );
}
