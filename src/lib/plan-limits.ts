// Plan limits & feature flags — safe to import from client components
// Central source of truth for what each plan allows

import type { PlanId } from "@/lib/stripe-plans";

export interface PlanLimits {
  maxStaff: number;
  whatsappAutoCancel: boolean;
  whatsappReactivation: boolean;
  whatsappReviewRequest: boolean;
  autoClientTags: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  essential: {
    maxStaff: 2,
    whatsappAutoCancel: true,
    whatsappReactivation: false,
    whatsappReviewRequest: false,
    autoClientTags: false,
  },
  professional: {
    maxStaff: 5,
    whatsappAutoCancel: true,
    whatsappReactivation: true,
    whatsappReviewRequest: true,
    autoClientTags: true,
  },
  enterprise: {
    maxStaff: 999,
    whatsappAutoCancel: true,
    whatsappReactivation: true,
    whatsappReviewRequest: true,
    autoClientTags: true,
  },
};

// During trial, give access based on the chosen plan.
// If no plan detected yet (shouldn't happen with new flow), default to professional.
export const TRIAL_LIMITS: PlanLimits = PLAN_LIMITS.professional;

export function getPlanLimitsForPlan(planId: PlanId | null, status: string): PlanLimits {
  if (status === "trialing") {
    // Respect the chosen plan during trial
    if (planId) return PLAN_LIMITS[planId] ?? TRIAL_LIMITS;
    return TRIAL_LIMITS;
  }
  if (!planId) return PLAN_LIMITS.essential;
  return PLAN_LIMITS[planId] ?? PLAN_LIMITS.essential;
}
