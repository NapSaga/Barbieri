"use client";

import { AlertTriangle, Clock, Euro, UserX } from "lucide-react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { FadeIn, SectionWrapper, StaggerContainer, StaggerItem } from "./motion-wrapper";

const losses = [
  {
    icon: UserX,
    value: 800,
    prefix: "",
    suffix: "/mese",
    label: "Persi per no-show",
    detail: "3-5 clienti a settimana che non si presentano",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Clock,
    value: 25,
    prefix: "",
    suffix: "h/mese",
    label: "Sprecate su WhatsApp",
    detail: "45-90 min al giorno per gestire messaggi manuali",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Euro,
    value: 1500,
    prefix: "",
    suffix: "/mese",
    label: "Clienti che non tornano",
    detail: "30-40% dei nuovi clienti non prenota mai piu",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const quotes = [
  {
    text: "Ricevendo richieste via Facebook, via WhatsApp, via telefono, dal vivo e ultimamente anche da Instagram era un vero disastro.",
    author: "Barbiere, Milano",
  },
  {
    text: "WhatsApp ti fa lavorare su fili che si intrecciano e confondono.",
    author: "Barbiere, Roma",
  },
];

function AnimatedCounter({
  value,
  prefix,
  suffix,
}: {
  value: number;
  prefix: string;
  suffix: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    const n = Math.round(v);
    return n >= 1000 ? `${prefix}${n.toLocaleString("it-IT")}${suffix}` : `${prefix}${n}${suffix}`;
  });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 1.5,
        ease: [0.21, 0.47, 0.32, 0.98],
      });
      return controls.stop;
    }
  }, [isInView, count, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function ProblemSection() {
  return (
    <SectionWrapper id="problema">
      <FadeIn>
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            Il costo nascosto
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ogni mese la tua barberia perde
            <br />
            <span className="text-red-500">fino a 3.000 euro</span> senza saperlo
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            No-show, WhatsApp manuale, clienti che spariscono. Problemi che ogni barbiere conosce ma
            che nessun gestionale risolve davvero.
          </p>
        </div>
      </FadeIn>

      {/* Loss cards */}
      <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-3" staggerDelay={0.15}>
        {losses.map((loss) => (
          <StaggerItem key={loss.label}>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div
                className={cn(
                  "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
                  loss.bg,
                )}
              >
                <loss.icon className={cn("h-6 w-6", loss.color)} />
              </div>
              <p className="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
                <AnimatedCounter value={loss.value} prefix={loss.prefix} suffix={loss.suffix} />
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{loss.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{loss.detail}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quotes */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {quotes.map((quote) => (
          <FadeIn key={quote.author} delay={0.3}>
            <blockquote className="rounded-xl border border-border bg-card/50 p-6">
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                &ldquo;{quote.text}&rdquo;
              </p>
              <footer className="mt-3 text-xs font-medium text-foreground">
                -- {quote.author}
              </footer>
            </blockquote>
          </FadeIn>
        ))}
      </div>

      {/* Total loss callout */}
      <FadeIn delay={0.4}>
        <div className="mt-8 rounded-xl border-2 border-red-500/30 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Perdita totale stimata per una barberia con 3 poltrone
          </p>
          <p className="mt-2 text-4xl font-bold text-red-500 sm:text-5xl">-2.000 / 3.000 al mese</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Soldi che escono dalla porta senza che tu te ne accorga.
          </p>
        </div>
      </FadeIn>
    </SectionWrapper>
  );
}
