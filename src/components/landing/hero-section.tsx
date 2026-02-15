"use client";

import { ArrowRight, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const stats = [
  { value: "90.000+", label: "Barberie in Italia", icon: Calendar },
  { value: "-70%", label: "No-show con BarberOS", icon: MessageSquare },
  { value: "12.7x", label: "ROI medio", icon: TrendingUp },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-16 sm:px-6 lg:px-8">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Radial glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge */}
        <FadeIn delay={0.1}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            I primi 10 barbieri non pagano il setup
          </div>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.2}>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Il sistema operativo
            <br />
            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              per la tua barberia
            </span>
          </h1>
        </FadeIn>

        {/* Subheadline */}
        <FadeIn delay={0.35}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
            L'unico gestionale con{" "}
            <span className="font-semibold text-foreground">automazione WhatsApp completa</span>.
            Elimina i no-show, riempi i buchi in agenda e fai crescere il fatturato.
            Automaticamente.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.5}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/register">
                Prova gratis 7 giorni
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
              <a href="#roi">Calcola il tuo ROI</a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Zero commissioni. Nessuna carta richiesta. Disdici quando vuoi.
          </p>
        </FadeIn>
      </div>

      {/* Stats bar */}
      <StaggerContainer
        className="relative mt-16 w-full max-w-3xl sm:mt-20"
        staggerDelay={0.15}
        delay={0.6}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
                <stat.icon className="mb-1 h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
          className="flex h-8 w-5 items-start justify-center rounded-full border border-border p-1"
        >
          <div className="h-1.5 w-1 rounded-full bg-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
}
