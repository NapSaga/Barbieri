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
      "Booking online con link personalizzato",
      "Calendario multi-poltrona",
      "CRM clienti con tag e note",
      "WhatsApp automatico (conferma, reminder, cancellazione)",
      "Lista d'attesa intelligente",
      "Analytics base",
      "Chiusure straordinarie",
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
      "AI integrata (riattivazione, suggerimenti)",
      "Analytics avanzati per poltrona e barbiere",
      "Campagne WhatsApp broadcast",
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
} as const;
