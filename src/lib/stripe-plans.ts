// Plan definitions & config — safe to import from client components

export type PlanId = "essential" | "professional" | "enterprise";

export interface PlanDef {
  id: PlanId;
  name: string;
  description: string;
  priceCents: number; // monthly, in EUR cents
  priceLabel: string;
  seats: string;
  features: string[];
  stripeProductId: string;
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, PlanDef> = {
  essential: {
    id: "essential",
    name: "Essential",
    description: "1-2 poltrone",
    priceCents: 30000,
    priceLabel: "€300",
    seats: "1-2 poltrone",
    features: [
      "Fino a 2 barbieri",
      "Prenotazione online con link dedicato",
      "Calendario interattivo multi-poltrona",
      "CRM clienti con tag, note e storico visite",
      "WhatsApp: richiesta conferma + 2 reminder automatici",
      "WhatsApp: cancellazione automatica se il cliente non conferma",
      "WhatsApp: notifica pre-appuntamento 2h prima",
      "Lista d'attesa con notifica automatica",
      "Analytics: fatturato, appuntamenti, no-show, nuovi clienti",
      "Personalizzazione pagina booking (colori, logo, font, copertina)",
      "Gestione chiusure straordinarie",
    ],
    stripeProductId: "prod_TwyoUI0JLvWcj3",
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "3-5 poltrone",
    priceCents: 50000,
    priceLabel: "€500",
    seats: "3-5 poltrone",
    features: [
      "Tutto Essential +",
      "Fino a 5 barbieri",
      "WhatsApp: riattivazione clienti che non vengono da tempo",
      "WhatsApp: richiesta recensione Google dopo l'appuntamento",
      "Tag automatici clienti (Affidabile / Non conferma)",
      "Supporto prioritario",
    ],
    stripeProductId: "prod_TwypWo5jLd3doz",
    highlighted: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Multi-sede",
    priceCents: 0,
    priceLabel: "Custom",
    seats: "Illimitato",
    features: [
      "Tutto Professional +",
      "Barbieri illimitati",
      "Configurazione dedicata",
      "SLA garantito",
      "Account manager dedicato",
      "Multi-sede",
    ],
    stripeProductId: "prod_TwyphvT1F82GrB",
  },
};

export const STRIPE_CONFIG = {
  portalReturnUrl: "/dashboard/settings",
  checkoutSuccessUrl: "/dashboard/settings?billing=success",
  checkoutCancelUrl: "/dashboard/settings?billing=cancel",
  trialDays: 7,
  contactEmail: "giovannidifonzobusiness@gmail.com",
  setupFeeCents: 50000,
  setupFeeLabel: "€500",
} as const;
