"use client";

import { AlertTriangle, Check, CreditCard, Crown, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createCheckoutSession, type SubscriptionInfo } from "@/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS, type PlanId, STRIPE_CONFIG } from "@/lib/stripe-plans";
import { cn } from "@/lib/utils";

const PLAN_ORDER: PlanId[] = ["essential", "professional", "enterprise"];

export function ExpiredView({ subscriptionInfo: _subscriptionInfo }: { subscriptionInfo: SubscriptionInfo | null }) {
  const [isPending, startTransition] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  function handleCheckout(planId: PlanId) {
    setPendingPlan(planId);
    startTransition(async () => {
      await createCheckoutSession(planId);
      setPendingPlan(null);
    });
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Abbonamento non attivo</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Il tuo abbonamento è scaduto o è stato cancellato. Scegli un piano per continuare a usare
          BarberOS.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid w-full max-w-4xl gap-5 sm:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isEnterprise = planId === "enterprise";
          const isHighlighted = plan.highlighted;

          return (
            <Card
              key={planId}
              className={cn(
                "relative flex flex-col border-2 p-6 transition-shadow hover:shadow-md",
                isHighlighted ? "border-primary shadow-lg" : "border-border",
              )}
            >
              {isHighlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Consigliato</Badge>
              )}

              <div className="mb-1 flex items-center gap-2">
                <Crown
                  className={cn(
                    "h-5 w-5",
                    isHighlighted ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-4 mb-5">
                {isEnterprise ? (
                  <span className="text-2xl font-bold text-foreground">Custom</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-foreground">{plan.priceLabel}</span>
                    <span className="text-sm text-muted-foreground">/mese</span>
                  </>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {isEnterprise ? (
                <Button variant="outline" asChild>
                  <a href={`mailto:${STRIPE_CONFIG.contactEmail}?subject=BarberOS Enterprise`}>
                    Contattaci
                  </a>
                </Button>
              ) : (
                <Button
                  onClick={() => handleCheckout(planId)}
                  disabled={isPending}
                  variant={isHighlighted ? "default" : "secondary"}
                >
                  {isPending && pendingPlan === planId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Abbonati
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer links */}
      <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1.5 hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Impostazioni
        </Link>
        <p>
          Contratto 12 mesi. Garanzia risultati: se dopo 3 mesi non vedi un ritorno almeno 2x, esci
          senza penali.
        </p>
      </div>
    </div>
  );
}
