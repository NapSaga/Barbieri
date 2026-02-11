# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarberOS is an Italian-language SaaS for barbershops: online booking, multi-barber calendar, client CRM, WhatsApp automations (Twilio), and Stripe billing. Built with Next.js 16 App Router, React 19, Supabase (PostgreSQL + Auth), Drizzle ORM, and Tailwind CSS v4.

## Commands

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build (next build --webpack, required by Serwist)
pnpm lint             # Biome check
pnpm lint:fix         # Biome auto-fix
pnpm format           # Biome format
pnpm typecheck        # TypeScript type check (tsc --noEmit)
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio (visual DB editor)
pnpm test             # Run unit tests (Vitest)
pnpm test:watch       # Run tests in watch mode
```

Tests use **Vitest** with path alias `@/*`. Test files live in `src/lib/__tests__/`.

## Architecture

### Routing & Middleware

- **Next.js 16 uses `src/proxy.ts`** (not `middleware.ts`) for route protection, session refresh, and subscription gating.
- **Route groups**: `(auth)` for login/register (public), `(dashboard)` for protected pages with shared sidebar layout.
- **Public routes**: `/`, `/book/*`, `/login`, `/register`, `/auth/callback`, `/api/stripe/*`.
- **Subscription gating**: proxy checks `subscription_status` before allowing dashboard access; `/dashboard/settings` and `/dashboard/expired` are exempt.

### Data Layer

- **Drizzle ORM** for schema definition (`src/db/schema.ts`) and migrations. Schema has 12 tables, 7 enums.
- **Supabase JS client** for runtime queries (benefits from RLS). Drizzle is used for schema-as-code and `db:push`/`db:generate`.
- **Two DB URLs**: `DATABASE_URL` (connection pooler, port 6543) for Vercel/serverless, `DIRECT_URL` (port 5432) for local/migrations.
- **RLS enabled** on every table with `business_id` isolation. Webhooks use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.
- Prices stored in **EUR cents** (integer).

### Server Actions & API Routes

- **10 server action modules** in `src/actions/` handle all authenticated mutations. No REST API for CRUD.
- **Only 2 API routes** exist: `/api/stripe/webhook` and `/api/whatsapp/webhook` — both verify signatures.
- `waitlist.ts` includes `addToWaitlistPublic()` (no auth, for booking page) and `getWaitlistCountsByDate()` (calendar badge).
- `appointments.ts`: `bookAppointment()` rejects past date+time slots server-side. Booking wizard also hides past slots client-side for today's date.
- Server actions call `revalidatePath()` after mutations.

### Auth

- Supabase Auth (email/password + magic link). JWT stored in HTTP-only cookies.
- Server-side client: `src/lib/supabase/server.ts`. Browser client: `src/lib/supabase/client.ts`.
- A Supabase trigger `on_auth_user_created` auto-creates a business row on signup, generates a unique `referral_code` (REF-NAME-XXXX), and if a referral code is present in metadata, saves `referred_by` and creates a `referrals` record with status 'pending'.

### External Services

- **Stripe**: Lazy-initialized client (`src/lib/stripe.ts`) to prevent build-time crashes on Vercel. Plans defined in `src/lib/stripe-plans.ts`. Checkout sessions include 7-day trial and promotion codes (allow_promotion_codes). Webhook `invoice.paid` also processes referral rewards (€50 credit via Customer Balance to referrer).
- **Twilio WhatsApp**: Dual-mode in `src/lib/whatsapp.ts` — sends real messages if `TWILIO_*` env vars are set, otherwise logs to console (mock mode).
- **WhatsApp commands**: `CONFERMA`, `CANCELLA`, `CAMBIA ORARIO`, `SI` — handled in the WhatsApp webhook route.
- **Cron jobs** (Supabase pg_cron + Edge Functions) run confirmation requests, reminders, auto-cancel, pre-appointment messages, review requests, and client reactivation.
- **Analytics trigger**: `trg_recalc_analytics` on `appointments` table (AFTER INSERT/UPDATE OF status,date,service_id/DELETE) recalculates `analytics_daily` in real-time via `recalc_analytics_on_appointment_change()`. Nightly cron `analytics-daily-calc` (02:05 UTC) recalculates yesterday + today as safety net.

### PWA (Serwist)

- **@serwist/next 9.5.5** wraps `next.config.ts` with `withSerwist()` for service worker generation.
- **Service worker**: `src/sw.ts` — precache manifest + `defaultCache` runtime caching.
- **Manifest**: `public/manifest.json` — standalone, start_url `/dashboard`, theme `#09090b`, lang `it`.
- **Icons**: `public/icon-192x192.png` and `public/icon-512x512.png` (zinc-950 background).
- **Build**: uses `--webpack` flag because Serwist doesn't support Turbopack. Dev still uses Turbopack with Serwist disabled (`disable: process.env.NODE_ENV !== "production"`).
- **Generated files**: `public/sw.js` and `public/sw.js.map` are gitignored (build artifacts).
- **tsconfig.json**: `lib` includes `webworker`, `types` includes `@serwist/next/typings`, `exclude` includes `public/sw.js`.

### Performance

- **Bundle analyzer**: `@next/bundle-analyzer` (dev), activated with `ANALYZE=true pnpm build`.
- **Lazy loading**: `AnalyticsDashboard`, `SettingsManager`, `FormCustomizer` use `next/dynamic` with `Skeleton` loading states.
- **Image optimization**: Booking page (`/book/[slug]`) uses `next/image` for `cover_image_url` and `logo_url`. `images.remotePatterns` allows any HTTPS domain.
- **CSP**: `img-src` includes `https:` for external user-provided images.

### Analytics (Vercel)

- **Vercel Web Analytics** (`@vercel/analytics`) — page views, visitors, referrers, devices tracked automatically. `<Analytics />` component in `src/app/layout.tsx`.
- **Vercel Speed Insights** (`@vercel/speed-insights`) — Core Web Vitals (LCP, INP, CLS, FCP, TTFB). `<SpeedInsights />` component in `src/app/layout.tsx`.
- **Plan**: Hobby (50K events/month). Custom events (`track()`) require Pro upgrade.
- **Event tracking docs**: Full event map with 39 custom events defined in `Dev Barbieri/Analytics/Analytics.md`.
- When adding new features with user interactions, reference the analytics doc to add corresponding tracking events.

### UI & Styling

- **Tailwind CSS v4** with CSS variables for theming (silver/black premium palette) in `src/app/globals.css`.
- **No external component library** — all components are custom-built with Tailwind.
- Icons: Lucide React. Utilities: `clsx`, `tailwind-merge`, `class-variance-authority`.
- **React Compiler** enabled in `next.config.ts`.

## Code Conventions

- **Biome** for linting and formatting: 2-space indent, double quotes, semicolons, 100-char line width.
- **Package manager**: pnpm (lockfile committed).
- **Path alias**: `@/*` maps to `src/*`.
- **Language**: All UI text, WhatsApp templates, and variable names are in Italian. Code structure and comments are in English.
- Server components are the default; client components use `"use client"` directive.
- No global state management — uses Server Actions + React built-in patterns.

## Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.

Optional (graceful degradation): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ESSENTIAL`, `STRIPE_PRICE_PROFESSIONAL`.

See `.env.example` for the full template.
