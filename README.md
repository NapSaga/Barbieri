# BarberOS MVP

Piattaforma SaaS per la gestione di barberie: prenotazioni online, calendario interattivo, CRM clienti, notifiche WhatsApp automatiche con conferma intelligente, analytics, lista d'attesa e billing Stripe.

## Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| **Runtime** | Node.js | 22 LTS |
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI** | React + React Compiler | 19.2.3 |
| **Styling** | Tailwind CSS | v4 |
| **Icone** | Lucide React | v0.563+ |
| **Linguaggio** | TypeScript (strict mode) | 5.x |
| **Linting** | Biome | 2.3.14 |
| **Database** | Supabase (PostgreSQL) | 17.6 |
| **ORM** | Drizzle ORM | 0.45.x |
| **Auth** | Supabase Auth | SSR |
| **WhatsApp** | Twilio (dual-mode: live/mock) | ^5.12.1 |
| **Pagamenti** | Stripe Billing | 20.3.1 |
| **Cron** | pg_cron + pg_net (nativi Supabase) | 1.6.4 / 0.19.5 |
| **Serverless** | Supabase Edge Functions (Deno) | — |
| **Package Manager** | pnpm | 10.29.2 |
| **Bundler** | Turbopack (dev) | — |

## Setup

```bash
pnpm install
cp .env.example .env.local
# Configura le variabili in .env.local (vedi sezione Variabili d'Ambiente)
pnpm dev
```

### Variabili d'Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[project-id]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=[service role key — server-only, per webhook]

# App URL (per validazione webhook Twilio)
NEXT_PUBLIC_APP_URL=https://localhost:3000

# Twilio WhatsApp (opzionale — senza queste variabili → mock mode)
TWILIO_ACCOUNT_SID=[dal dashboard Twilio]
TWILIO_AUTH_TOKEN=[dal dashboard Twilio]
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Stripe Billing
STRIPE_SECRET_KEY=[sk_live_... — server-only]
STRIPE_WEBHOOK_SECRET=[whsec_... — richiede dominio pubblico]
STRIPE_PRICE_ESSENTIAL=[creato da scripts/setup-stripe.ts]
STRIPE_PRICE_PROFESSIONAL=[creato da scripts/setup-stripe.ts]
```

> **Nota:** Se le variabili `TWILIO_*` non sono configurate, i messaggi WhatsApp vengono loggati in console (mock mode). Per creare i prezzi Stripe ricorrenti: `npx tsx scripts/setup-stripe.ts`.

## Scripts

| Comando | Descrizione |
|---|---|
| `pnpm dev` | Dev server con Turbopack (porta 3000) |
| `pnpm build` | Build di produzione |
| `pnpm start` | Server di produzione |
| `pnpm lint` | Lint con Biome |
| `pnpm lint:fix` | Auto-fix lint |
| `pnpm format` | Formattazione con Biome |
| `pnpm typecheck` | Type check TypeScript (`tsc --noEmit`) |
| `pnpm db:generate` | Genera migrazioni Drizzle |
| `pnpm db:push` | Push schema a Supabase |
| `pnpm db:studio` | UI studio Drizzle |

## Struttura Progetto

```
barberos-mvp/
├── scripts/
│   └── setup-stripe.ts           # Setup Stripe (crea prezzi ricorrenti + aggiorna .env)
│
└── src/
    ├── proxy.ts                  # Proxy Next.js 16 (protezione route + refresh sessione)
    │
    ├── app/
    │   ├── layout.tsx            # Root layout (font Inter, metadata, lang="it")
    │   ├── page.tsx              # Homepage: redirect a /dashboard o /login
    │   ├── globals.css           # Stili globali Tailwind
    │   │
    │   ├── (auth)/
    │   │   ├── login/page.tsx    # Login (email+password, magic link)
    │   │   └── register/page.tsx # Registrazione (nome barberia, email, password)
    │   │
    │   ├── api/
    │   │   ├── stripe/webhook/route.ts    # Webhook Stripe (subscription + invoice events)
    │   │   └── whatsapp/webhook/route.ts  # Webhook Twilio WhatsApp (comandi cliente)
    │   │
    │   ├── auth/callback/route.ts         # OAuth / magic link callback
    │   │
    │   ├── (dashboard)/dashboard/
    │   │   ├── page.tsx          # Calendario giornaliero/settimanale
    │   │   ├── clients/page.tsx  # CRM clienti
    │   │   ├── services/page.tsx # CRUD servizi
    │   │   ├── staff/page.tsx    # CRUD staff + orari di lavoro
    │   │   ├── waitlist/page.tsx # Lista d'attesa
    │   │   ├── analytics/page.tsx# Dashboard analytics
    │   │   └── settings/page.tsx # Impostazioni (8 sezioni)
    │   │
    │   └── book/[slug]/page.tsx  # Booking pubblico (wizard multi-step)
    │
    ├── actions/                  # Server Actions (9 moduli)
    │   ├── analytics.ts          # getAnalyticsSummary, getAnalyticsDaily, getTopServices
    │   ├── appointments.ts       # CRUD appuntamenti, walk-in, cambio stato
    │   ├── billing.ts            # createCheckoutSession, createPortalSession, getSubscriptionInfo
    │   ├── business.ts           # CRUD business, orari, soglie, template
    │   ├── clients.ts            # CRUD clienti, tag, note
    │   ├── closures.ts           # CRUD chiusure straordinarie
    │   ├── services.ts           # CRUD servizi
    │   ├── staff.ts              # CRUD staff, orari di lavoro
    │   └── waitlist.ts           # Gestione lista d'attesa
    │
    ├── components/               # Componenti React (14)
    │   ├── booking/booking-wizard.tsx
    │   ├── calendar/             # calendar-view, day-view, week-view,
    │   │                         # appointment-card, appointment-sheet, walk-in-dialog
    │   ├── clients/clients-manager.tsx
    │   ├── services/services-manager.tsx
    │   ├── settings/settings-manager.tsx
    │   ├── staff/staff-manager.tsx
    │   └── shared/sidebar.tsx
    │
    ├── db/
    │   ├── schema.ts             # Schema Drizzle (10 tabelle, 6 enums, relazioni)
    │   └── index.ts              # Connessione database (postgres.js + drizzle)
    │
    ├── lib/
    │   ├── utils.ts              # cn() per class names
    │   ├── slots.ts              # Algoritmo calcolo slot disponibili
    │   ├── stripe.ts             # Stripe client + PLANS config (3 piani)
    │   ├── whatsapp.ts           # WhatsApp dual-mode (Twilio live / mock)
    │   ├── templates.ts          # Template messaggi WhatsApp (8 tipi)
    │   └── supabase/             # client.ts, server.ts, middleware.ts
    │
    └── types/index.ts            # TypeScript types (Select + Insert per tabella)
```

## Database

**11 tabelle** con RLS su ognuna, isolamento dati per `business_id`:

| Tabella | Descrizione |
|---------|-------------|
| `businesses` | Dati barberia, orari, Stripe customer, subscription status |
| `staff` | Barbieri con orari di lavoro (jsonb) |
| `services` | Servizi con durata, prezzo, combo |
| `staff_services` | Relazione many-to-many staff ↔ servizi |
| `clients` | CRM con tag, note, contatori visite/no-show |
| `appointments` | Appuntamenti con 5 stati e 4 sorgenti |
| `waitlist` | Lista d'attesa con 4 stati |
| `messages` | Log messaggi WhatsApp inviati |
| `message_templates` | Template personalizzabili per business |
| `analytics_daily` | Metriche giornaliere (calcolate da cron notturno) |
| `business_closures` | Chiusure straordinarie con data e motivo |

**6 Enums:** `appointment_status`, `appointment_source`, `waitlist_status`, `message_type`, `message_status`, `subscription_status`

**Funzioni DB:**
- `get_user_business_id()` — helper RLS, SECURITY DEFINER
- `handle_new_user()` — trigger auto-creazione business alla registrazione
- `calculate_analytics_daily()` — UPSERT metriche giornaliere
- 6 SQL helper functions per conferma intelligente

**13 migrazioni** applicate.

## Funzionalità

### Booking Pubblico (`/book/[slug]`)
Wizard multi-step: Servizio → Barbiere → Data/Ora → Conferma. Calcolo slot disponibili basato su orari staff e durata servizio. Creazione automatica client, conferma WhatsApp, UI mobile-first.

### Calendario (`/dashboard`)
- **Vista giornaliera**: timeline oraria (07:00-21:00) con colonne per barbiere
- **Vista settimanale**: griglia 7 giorni con card compatte
- **Walk-in dialog**: aggiunta manuale appuntamenti
- **5 stati colorati**: Prenotato (blu), Confermato (verde), Completato (grigio), Cancellato (rosso), No-show (arancione)
- **Badge conferma**: pallino pulsante amber su card in attesa di conferma WhatsApp
- **Banner chiusure**: avviso arancione su giorni con chiusura straordinaria

### CRM Clienti (`/dashboard/clients`)
Lista con ricerca, schede espandibili con stats, tag manuali (VIP, Nuovo, Problematico) e automatici (Affidabile, Non conferma), note con salvataggio automatico, badge no-show.

### Servizi e Staff (`/dashboard/services`, `/dashboard/staff`)
CRUD completo per servizi (nome, durata, prezzo, combo, toggle) e staff (nome, orari di lavoro per 7 giorni, toggle).

### Lista d'Attesa (`/dashboard/waitlist`)
Filtri per stato, ricerca, badge colorati, rimozione entry, bulk-expire scaduti. Notifica WhatsApp automatica al primo in lista quando si libera uno slot.

### Analytics (`/dashboard/analytics`)
4 KPI cards con delta %, grafico fatturato giornaliero, grafico appuntamenti stacked, classifica servizi, breakdown clienti nuovi vs ricorrenti. Selector periodo: 7gg / 30gg / 90gg.

### Impostazioni (`/dashboard/settings`)
8 sezioni accordion: dati barberia, orari apertura, WhatsApp, template messaggi, recensioni Google, regole automatiche, chiusure straordinarie, abbonamento Stripe.

## Automazioni WhatsApp

Sistema di **conferma intelligente** con timing smart basato sull'orario dell'appuntamento:

| Orario appuntamento | 1ª richiesta | 2° reminder | Deadline auto-cancel |
|---------------------|--------------|-------------|----------------------|
| Pomeriggio (≥14:00) | Sera prima 20:00 | Mattina 08:00 | Ore 12:00 |
| Tarda mattina (10-14) | Sera prima 20:00 | Mattina 07:30 | Ore 09:00 |
| Mattina presto (<10) | Giorno prima 12:00 | Sera prima 20:00 | Sera prima 22:00 |

**Comandi WhatsApp del cliente:**

| Comando | Azione |
|---------|--------|
| `CONFERMA` | booked → confirmed |
| `CANCELLA` / `ANNULLA` | Cancella appuntamento + notifica waitlist |
| `CAMBIA ORARIO` | Invia link prenotazione |
| `SI` | Conferma dalla waitlist |

**6 Edge Functions** su Supabase (Deno) + **7 pg_cron schedules**:
- `confirmation-request` — ogni 30min, richiesta conferma (timing smart)
- `confirmation-reminder` — ogni 30min, secondo avviso
- `auto-cancel` — ogni 30min, cancella non confermati alla deadline + notifica waitlist
- `pre-appointment` — ogni 30min, "ci vediamo!" ~2h prima
- `review-request` — ogni ora (:15), richiesta recensione Google
- `reactivation` — 1x/giorno (11:00 Roma), clienti dormienti
- `analytics-daily-calc` — ogni notte 03:05 Roma, calcolo metriche giornaliere

## Stripe Billing

3 piani di abbonamento:

| Piano | Prezzo | Target |
|-------|--------|--------|
| **Essential** | €300/mese | 1-2 poltrone |
| **Professional** | €500/mese | 3-5 poltrone (consigliato) |
| **Enterprise** | Custom | Multi-sede |

- **Trial**: 30 giorni gratuiti
- **Setup**: €1.000 una tantum (fatturato separatamente)
- **Checkout**: Stripe Checkout con selezione piano
- **Self-service**: Stripe Customer Portal (cambio carta, cancellazione, fatture)
- **Webhook**: sync automatico `subscription_status` su DB

## Pattern Architetturali

1. **Server Components + Server Actions** — pagine server-side, mutazioni via Server Actions, `revalidatePath()` per invalidazione cache
2. **Supabase SSR** — 3 client distinti (browser, server, middleware), sessione JWT con refresh automatico
3. **RLS come layer di sicurezza** — ogni query filtrata per `business_id`, nessun passaggio manuale
4. **Optimistic Updates** — toggle servizi e tag clienti con aggiornamento UI immediato
5. **Dual-mode WhatsApp** — Twilio live se configurato, mock console.log altrimenti
6. **proxy.ts** — Next.js 16 usa proxy convention (non middleware) per protezione route

## Roadmap

- **Fase A** ✅ — Infrastruttura, DB, Auth, Layout, Booking
- **Fase B** ✅ — Calendario, Servizi CRUD, Staff CRUD, CRM clienti
- **Fase C** ✅ — Automazioni WhatsApp, conferma intelligente, waitlist, analytics, Stripe, impostazioni, chiusure
- **Fase D** ⬜ — Dominio + DNS, webhook Stripe, subscription gating, test E2E, PWA (Serwist), performance, deploy Vercel + Cloudflare

## Debito Tecnico Noto

- Middleware da migrare a proxy convention (Next.js 16)
- Nessun test automatico
- Nessuna validazione Zod sugli input delle Server Actions (Zod installato ma non usato)
- `window.location.reload()` in alcuni componenti (da sostituire con `router.refresh()`)
- Booking wizard non verifica conflitti con appuntamenti esistenti (solo slot basati su orari staff)
- `settings-manager.tsx` è ~800 righe — da spezzare in sotto-componenti

## Hosting (previsto)

- **Frontend**: Vercel (Server Actions + API routes)
- **Backend**: Supabase Cloud (database, auth, edge functions, pg_cron — già attivo)
- **DNS/CDN**: Cloudflare
- **Monitoring**: Sentry + Vercel Analytics
- **CI/CD**: GitHub Actions + Vercel Preview Deployments
