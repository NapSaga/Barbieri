"use server";

import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const referralCodeSchema = z.string().regex(/^REF-[A-Z0-9]+-[A-Z0-9]{4}$/);

// ─── Helpers ────────────────────────────────────────────────────────

async function getAuthenticatedBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_id, name, referral_code, stripe_customer_id")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/login");

  return { supabase, user, business };
}

// ─── Get Referral Info ──────────────────────────────────────────────

export async function getReferralInfo() {
  const { supabase, business } = await getAuthenticatedBusiness();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("status, reward_amount_cents")
    .eq("referrer_business_id", business.id);

  const all = referrals || [];
  const converted = all.filter((r) => r.status === "converted" || r.status === "rewarded");
  const rewarded = all.filter((r) => r.status === "rewarded");
  const pending = all.filter((r) => r.status === "pending");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    referralCode: business.referral_code || "",
    referralLink: `${appUrl}/register?ref=${business.referral_code || ""}`,
    totalReferrals: all.length,
    convertedReferrals: converted.length,
    totalCreditsEarned: rewarded.reduce((sum, r) => sum + r.reward_amount_cents, 0),
    pendingCredits: pending.reduce((sum, r) => sum + r.reward_amount_cents, 0),
  };
}

// ─── Get Referrals List ─────────────────────────────────────────────

export async function getReferrals() {
  const { supabase, business } = await getAuthenticatedBusiness();

  const { data: referrals } = await supabase
    .from("referrals")
    .select(`
      id,
      status,
      reward_amount_cents,
      created_at,
      converted_at,
      rewarded_at,
      referred_business_id
    `)
    .eq("referrer_business_id", business.id)
    .order("created_at", { ascending: false });

  if (!referrals || referrals.length === 0) return [];

  // Fetch referred business names
  const businessIds = referrals.map((r) => r.referred_business_id);
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name")
    .in("id", businessIds);

  const nameMap = new Map((businesses || []).map((b) => [b.id, b.name]));

  return referrals.map((r) => ({
    id: r.id,
    referredBusinessName: nameMap.get(r.referred_business_id) || "Barberia",
    status: r.status,
    rewardAmountCents: r.reward_amount_cents,
    createdAt: r.created_at,
    convertedAt: r.converted_at,
    rewardedAt: r.rewarded_at,
  }));
}

// ─── Validate Referral Code (public, no auth) ──────────────────────

export async function validateReferralCode(
  code: string,
): Promise<{ valid: boolean; businessName?: string }> {
  const parsed = referralCodeSchema.safeParse(code);
  if (!parsed.success) return { valid: false };

  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("name")
    .eq("referral_code", code)
    .single();

  if (!data) return { valid: false };

  return { valid: true, businessName: data.name };
}
