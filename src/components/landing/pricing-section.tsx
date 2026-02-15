"use client";

import { ArrowRight, Check, Crown, Mail } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeIn, SectionWrapper, StaggerContainer, StaggerItem } from "./motion-wrapper";

const plans = [
  {
    id: "essential",
    name: "Essential",
    description: "Per barberie con 1-2 poltrone",
    price: "300",
    period: "/mese",
    highlighted: false,
    features: [
      "Fino a 2 barbieri",
      "Prenotazione online con link dedicato",
      "Calendario interattivo multi-poltrona",
      "CRM clienti con tag, note e storico",
      "WhatsApp: conferma + 2 reminder automatici",
      "WhatsApp: cancellazione automatica",
      "Lista d'attesa con notifica automatica",
      "Dashboard analytics completa",
      "Personalizzazione pagina booking",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Per barberie con 3-5 poltrone",
    price: "500",
    period: "/mese",
    highlighted: true,
    features: [
      "Tutto Essential +",
      "Fino a 5 barbieri",
      "WhatsApp: riattivazione clienti dormienti",
      "WhatsApp: recensioni Google automatiche",
      "Tag automatici clienti",
      "Supporto prioritario",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Multi-sede, su misura",
    price: "Custom",
    period: "",
    highlighted: false,
    features: [
      "Tutto Professional +",
      "Barbieri illimitati",
      "Multi-sede",
      "Configurazione dedicata",
      "SLA garantito",
      "Account manager dedicato",
    ],
  },
];

export function PricingSection() {
  return (
    <SectionWrapper id="prezzi">
      <FadeIn>
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Crown className="h-3.5 w-3.5" />
            Prezzi trasparenti
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Investi nel tuo negozio,
            <br />
            non in un software
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Zero commissioni sulle prenotazioni. Un prezzo fisso che si ripaga in 3 giorni con il
            fatturato che recuperi.
          </p>
        </div>
      </FadeIn>

      {/* Setup fee banner */}
      <FadeIn delay={0.15}>
        <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Setup 500 euro una tantum</span> --
            configurazione, importazione dati, formazione e 30 giorni di supporto premium.
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-500">
            I primi 10 barbieri ricevono il setup GRATIS (risparmi 500 euro)
          </p>
        </div>
      </FadeIn>

      {/* Pricing cards */}
      <StaggerContainer className="mt-10 grid gap-6 lg:grid-cols-3" staggerDelay={0.15}>
        {plans.map((plan) => (
          <StaggerItem key={plan.id}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-6",
                plan.highlighted
                  ? "border-primary bg-card shadow-lg shadow-primary/5"
                  : "border-border bg-card",
              )}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Consigliato</Badge>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  {plan.price === "Custom" ? (
                    <span className="text-3xl font-bold text-foreground">Su misura</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tabular-nums text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">euro{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <p className="text-sm text-muted-foreground">{feature}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {plan.id === "enterprise" ? (
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:giovannidifonzobusiness@gmail.com">
                    <Mail className="mr-1 h-4 w-4" />
                    Contattaci
                  </a>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/register">
                    Prova gratis 7 giorni
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Trust line */}
      <FadeIn delay={0.4}>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          7 giorni di prova gratuita. Nessuna carta di credito richiesta. Disdici in qualsiasi
          momento.
        </p>
      </FadeIn>
    </SectionWrapper>
  );
}
