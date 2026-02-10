"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  CreditCard,
  Loader2,
  Settings,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createCheckoutSession, type SubscriptionInfo } from "@/actions/billing";
import { PLANS, STRIPE_CONFIG, type PlanId } from "@/lib/stripe-plans";
import Link from "next/link";

const PLAN_ORDER: PlanId[] = ["essential", "professional", "enterprise"];

export function ExpiredView({
  subscriptionInfo,
}: {
  subscriptionInfo: SubscriptionInfo | null;
}) {
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Abbonamento non attivo
        </h1>
        <p className="mt-2 max-w-md text-gray-500">
          Il tuo abbonamento è scaduto o è stato cancellato. Scegli un piano per
          continuare a usare BarberOS.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid w-full max-w-4xl gap-5 sm:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isEnterprise = planId === "enterprise";
          const isHighlighted = plan.highlighted;

          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-xl border-2 bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
                isHighlighted
                  ? "border-blue-500 shadow-lg shadow-blue-100"
                  : "border-gray-200",
              )}
            >
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Consigliato
                </span>
              )}

              <div className="mb-1 flex items-center gap-2">
                <Crown
                  className={cn(
                    "h-5 w-5",
                    isHighlighted ? "text-blue-600" : "text-gray-400",
                  )}
                />
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              </div>
              <p className="text-sm text-gray-500">{plan.description}</p>

              <div className="mt-4 mb-5">
                {isEnterprise ? (
                  <span className="text-2xl font-bold text-gray-900">
                    Custom
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.priceLabel}
                    </span>
                    <span className="text-sm text-gray-500">/mese</span>
                  </>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {isEnterprise ? (
                <a
                  href={`mailto:${STRIPE_CONFIG.contactEmail}?subject=BarberOS Enterprise`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Contattaci
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckout(planId)}
                  disabled={isPending}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50",
                    isHighlighted
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                  )}
                >
                  {isPending && pendingPlan === planId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Abbonati
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer links */}
      <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1.5 hover:text-gray-600"
        >
          <Settings className="h-4 w-4" />
          Impostazioni
        </Link>
        <p>
          Contratto 12 mesi. Garanzia risultati: se dopo 3 mesi non vedi un
          ritorno almeno 2x, esci senza penali.
        </p>
      </div>
    </div>
  );
}
