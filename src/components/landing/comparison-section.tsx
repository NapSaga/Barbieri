"use client";

import { BarChart3, Check, X } from "lucide-react";
import { FadeIn, SectionWrapper } from "./motion-wrapper";

const rows = [
  { feature: "Prenotazione online", classic: true, barberos: true },
  { feature: "Calendario multi-poltrona", classic: true, barberos: true },
  { feature: "Conferma WhatsApp automatica", classic: false, barberos: true },
  { feature: "3 Reminder WhatsApp automatici", classic: false, barberos: true },
  { feature: "Cancellazione auto se non conferma", classic: false, barberos: true },
  { feature: "Lista d'attesa con notifica WhatsApp", classic: false, barberos: true },
  { feature: "Riattivazione clienti dormienti", classic: false, barberos: true },
  { feature: "Recensioni Google automatiche", classic: false, barberos: true },
  { feature: "Tag automatici clienti", classic: false, barberos: true },
  { feature: "Anti-double booking (5 livelli)", classic: false, barberos: true },
];

export function ComparisonSection() {
  return (
    <SectionWrapper id="confronto">
      <FadeIn>
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            Il confronto
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Perche costa di piu
            <br />e perche conviene
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            I gestionali da 30 euro al mese ti danno un calendario. BarberOS ti fa recuperare
            migliaia di euro al mese che oggi stai perdendo.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left font-semibold text-foreground sm:px-6">
                    Funzionalita
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground sm:px-6">
                    <span className="block text-sm">Gestionali classici</span>
                    <span className="block text-xs font-normal">0-35 euro/mese</span>
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-foreground sm:px-6">
                    <span className="block text-sm">BarberOS</span>
                    <span className="block text-xs font-normal text-emerald-500">
                      Automazione completa
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.feature} className="transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3 text-foreground sm:px-6">{row.feature}</td>
                    <td className="px-4 py-3 text-center sm:px-6">
                      {row.classic ? (
                        <Check className="mx-auto h-4 w-4 text-muted-foreground" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-red-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center sm:px-6">
                      <Check className="mx-auto h-4 w-4 text-emerald-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border bg-primary/5 px-4 py-4 sm:px-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Il punto:</span> un gestionale da 30
              euro al mese ti da un calendario. BarberOS ti fa{" "}
              <span className="font-semibold text-foreground">
                recuperare migliaia di euro al mese
              </span>{" "}
              perche nessun altro ha l'automazione WhatsApp che elimina i no-show e riempie i buchi
              in agenda.
            </p>
          </div>
        </div>
      </FadeIn>
    </SectionWrapper>
  );
}
