"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FadeIn, SectionWrapper } from "./motion-wrapper";

const faqs = [
  {
    question: "Perche 500 euro di setup quando altri gestionali sono gratis?",
    answer:
      "Perche noi non ti vendiamo un software e ti lasciamo solo. Con il setup includiamo: configurazione completa del sistema, importazione dei tuoi dati (clienti, servizi, orari), formazione personalizzata per te e il tuo team, e 30 giorni di supporto premium. Il setup si ripaga in 3 giorni con il fatturato che recuperi grazie all'automazione.",
  },
  {
    question: "Perche costa piu di 30 euro al mese?",
    answer:
      "Perche un gestionale da 30 euro al mese ti da un calendario. BarberOS ti fa recuperare 3.000 euro o piu al mese eliminando i no-show, riempiendo i buchi con la lista d'attesa e riattivando clienti dormienti. Il ROI medio e 12 volte l'investimento. Non e un costo: e l'investimento con il ritorno piu alto che puoi fare nel tuo negozio.",
  },
  {
    question: "E se non funziona?",
    answer:
      "Offriamo una garanzia di 3 mesi: se non ottieni almeno 2 volte il ritorno sull'investimento, puoi uscire senza penali. Ma in base ai dati, il 95% dei nostri clienti vede risultati dal primo mese.",
  },
  {
    question: "Come funziona la prova gratuita?",
    answer:
      "Hai 7 giorni per provare tutte le funzionalita del piano scelto. Non serve carta di credito per iniziare. Se decidi di continuare, scegli il piano e procedi con il pagamento. Se non ti convince, non paghi nulla.",
  },
  {
    question: "Come funziona l'automazione WhatsApp?",
    answer:
      "Usiamo l'API ufficiale di WhatsApp Business tramite Twilio. I messaggi arrivano dal tuo numero o da un numero dedicato alla tua barberia. I clienti ricevono conferme, reminder e notifiche esattamente come un messaggio WhatsApp normale. Non devono installare nessuna app aggiuntiva.",
  },
  {
    question: "Posso usarlo dal telefono?",
    answer:
      "Si. BarberOS e una Progressive Web App (PWA): la installi come un'app dal browser, funziona su iPhone e Android, e hai accesso a tutte le funzionalita dal tuo smartphone. E pensato per essere usato in mobilita.",
  },
  {
    question: "Quanto tempo serve per configurarlo?",
    answer:
      "Con il setup guidato, il sistema e operativo in 1 giorno. Noi ci occupiamo di tutto: importazione clienti, configurazione servizi e orari, setup WhatsApp, personalizzazione della pagina di prenotazione.",
  },
  {
    question: "Posso gestire piu barbieri con orari diversi?",
    answer:
      "Si. Il calendario multi-poltrona ti permette di gestire ogni barbiere con orari, servizi e pause personalizzate. Ogni barbiere ha il suo profilo e la sua agenda, tutto visibile in un'unica dashboard.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-foreground"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionWrapper id="faq" className="bg-card/30">
      <FadeIn>
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            Domande frequenti
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hai delle domande?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Le risposte alle domande che ci fanno piu spesso i barbieri.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-card px-6">
          {faqs.map((faq, i) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </FadeIn>
    </SectionWrapper>
  );
}
