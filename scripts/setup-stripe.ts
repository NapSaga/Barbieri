/**
 * Setup script to create recurring monthly prices on Stripe for all plans.
 * Run once: npx tsx scripts/setup-stripe.ts
 *
 * Requires STRIPE_SECRET_KEY in .env.local 
 */

import Stripe from "stripe";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(import.meta.dirname ?? __dirname, "../.env.local");

// Load .env.local manually
function loadEnv() {
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.error("❌ Impossibile leggere .env.local — assicurati che esista");
    process.exit(1);
  }
}

loadEnv();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey || secretKey === "sk_live_...") {
  console.error("❌ STRIPE_SECRET_KEY non configurata in .env.local");
  console.error("   Vai su https://dashboard.stripe.com/apikeys e copia la Secret Key");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

// Plan definitions matching lib/stripe.ts
const PLAN_CONFIGS = [
  { envKey: "STRIPE_PRICE_ESSENTIAL", productId: "prod_TwyoUI0JLvWcj3", name: "Essential", amountCents: 30000, plan: "essential" },
  { envKey: "STRIPE_PRICE_PROFESSIONAL", productId: "prod_TwypWo5jLd3doz", name: "Professional", amountCents: 50000, plan: "professional" },
  // Enterprise is custom — no automatic price
];

async function ensureRecurringPrice(config: typeof PLAN_CONFIGS[0]): Promise<string> {
  // Check if product exists
  try {
    const product = await stripe.products.retrieve(config.productId);
    console.log(`✅ Prodotto trovato: ${product.name}`);
  } catch {
    console.error(`❌ Prodotto ${config.productId} (${config.name}) non trovato.`);
    process.exit(1);
  }

  // Check if a recurring price already exists
  const existingPrices = await stripe.prices.list({
    product: config.productId,
    active: true,
    type: "recurring",
    limit: 1,
  });

  if (existingPrices.data.length > 0) {
    const price = existingPrices.data[0];
    console.log(`   Prezzo ricorrente esistente: ${price.id} (€${price.unit_amount! / 100}/mese)`);
    return price.id;
  }

  // Create recurring monthly price
  const price = await stripe.prices.create({
    product: config.productId,
    unit_amount: config.amountCents,
    currency: "eur",
    recurring: { interval: "month" },
    metadata: { plan: config.plan },
  });
  console.log(`   Prezzo ricorrente creato: ${price.id} (€${config.amountCents / 100}/mese)`);
  return price.id;
}

async function main() {
  console.log("🔧 Setup Stripe per BarberOS...\n");

  const envUpdates: Record<string, string> = {};

  for (const config of PLAN_CONFIGS) {
    const priceId = await ensureRecurringPrice(config);
    envUpdates[config.envKey] = priceId;
  }

  // Update .env.local
  try {
    let envContent = readFileSync(envPath, "utf-8");

    for (const [key, value] of Object.entries(envUpdates)) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent = envContent.trimEnd() + `\n${key}=${value}\n`;
      }
    }

    // Clean up old STRIPE_PRICE_ID if present
    envContent = envContent.replace(/^STRIPE_PRICE_ID=.*\n?/m, "");

    writeFileSync(envPath, envContent);
    console.log(`\n✅ .env.local aggiornato con i price ID`);
  } catch {
    console.log(`\n⚠️  Aggiungi manualmente a .env.local:`);
    for (const [key, value] of Object.entries(envUpdates)) {
      console.log(`   ${key}=${value}`);
    }
  }

  console.log("\n📋 Prossimi passi:");
  console.log("   1. Configura il webhook su https://dashboard.stripe.com/webhooks");
  console.log("      URL: https://tuodominio.com/api/stripe/webhook");
  console.log("      Eventi: customer.subscription.created, customer.subscription.updated,");
  console.log("              customer.subscription.deleted, invoice.paid, invoice.payment_failed");
  console.log("   2. Copia il Webhook Signing Secret e aggiungilo a .env.local:");
  console.log("      STRIPE_WEBHOOK_SECRET=whsec_...");
  console.log("\n✨ Setup completato!");
}

main().catch((err) => {
  console.error("❌ Errore:", err.message);
  process.exit(1);
});
