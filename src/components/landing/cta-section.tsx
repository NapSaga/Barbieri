"use client";

import { ArrowRight, CalendarCheck, Phone, Rocket, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn, SectionWrapper, StaggerContainer, StaggerItem } from "./motion-wrapper";

const steps = [
  {
    step: 1,
    icon: Phone,
    title: "Prova gratuita",
    description: "7 giorni per testare tutto il sistema. Zero rischi, zero carte di credito.",
  },
  {
    step: 2,
    icon: CalendarCheck,
    title: "Setup in 1 giorno",
    description: "Noi configuriamo tutto: clienti, servizi, WhatsApp, pagina booking.",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "Risultati dal primo mese",
    description: "Meno no-show, piu prenotazioni, piu recensioni. Garantito.",
  },
  {
    step: 4,
    icon: Rocket,
    title: "Crescita continua",
    description: "Il sistema lavora per te 24/7. Tu ti concentri sui tuoi clienti.",
  },
];

export function CtaSection() {
  return (
    <SectionWrapper>
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-8 sm:p-12">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pronto a far crescere
              <br />
              il tuo negozio?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              In 4 semplici passi passi da perdere migliaia di euro al mese a un sistema che lavora
              per te in automatico.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.12}
        >
          {steps.map((s) => (
            <StaggerItem key={s.step}>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Passo {s.step}</div>
                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.5}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/register">
                Inizia la prova gratuita
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
              <a href="mailto:giovannidifonzobusiness@gmail.com">Parla con noi</a>
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Garanzia 3 mesi: minimo 2x ritorno o esci senza penali.
          </p>
        </FadeIn>
      </div>
    </SectionWrapper>
  );
}
