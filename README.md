# BarberOS — Gestione Appuntamenti per Barbieri

Piattaforma SaaS completa per barberie: prenotazioni online, calendario multi-barbiere, CRM clienti, automazioni WhatsApp e billing integrato.

## Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **UI** | React 19.2.3 + React Compiler, Tailwind CSS v4, Lucide React |
| **Linguaggio** | TypeScript 5.x (strict mode) |
| **Database** | Supabase (PostgreSQL 17.6, RLS, Edge Functions, pg_cron) |
| **ORM** | Drizzle ORM 0.45.x (schema-as-code, migrazioni) |
| **Auth** | Supabase Auth (email + password, magic link, JWT refresh) |
| **Pagamenti** | Stripe Billing (Checkout, Customer Portal, Webhooks) |
| **Notifiche** | Twilio WhatsApp Business API (dual-mode: live / mock) |
| **Linting** | Biome 2.3.14 |
| **Package Manager** | pnpm |
| **Deploy** | Vercel + Cloudflare DNS (previsto) |

## Funzionalità

### Calendario Interattivo
- Vista giornaliera (timeline oraria 07–21, colonne per barbiere) e settimanale
- Walk-in dialog per aggiunta rapida appuntamenti
- 5 stati con colori distinti: Prenotato, Confermato, Completato, Cancellato, No-show
- Indicatore ora corrente, badge conferma WhatsApp (pallino pulsante)

### Booking Pubblico (`/book/[slug]`)
- Wizard multi-step: Servizio → Barbiere → Data/Ora → Conferma
- Calcolo slot disponibili (orari staff + durata servizio + chiusure)
- Creazione automatica cliente (lookup per telefono)
- Conferma WhatsApp automatica

### CRM Clienti
- Ricerca per nome o telefono
- Scheda espandibile con stats, tag, note
- Tag manuali (VIP, Nuovo, Problematico) e **automatici** (Affidabile, Non conferma)
- Badge alert per clienti con 2+ no-show

### Automazioni WhatsApp (pg_cron + Edge Functions)
6 cron job attivi con timing intelligente:

| Job | Frequenza | Descrizione |
|---|---|---|
| `confirmation-request` | ogni 30 min | Richiesta conferma (timing smart basato su orario appuntamento) |
| `confirmation-reminder` | ogni 30 min | Secondo reminder se non risponde |
| `auto-cancel` | ogni 30 min | Cancellazione automatica + notifica waitlist |
| `pre-appointment` | ogni 30 min | "Ci vediamo!" ~2h prima (solo confermati) |
| `review-request` | ogni ora | Richiesta recensione Google post-completamento |
| `reactivation` | 1x/giorno | Riattivazione clienti dormienti |

Comandi WhatsApp gestiti: `CONFERMA`, `CANCELLA`, `CAMBIA ORARIO`, `SI`

### Billing Stripe
- 3 piani: **Essential** (€300/mese), **Professional** (€500/mese), **Enterprise** (custom)
- Trial 30 giorni gratuiti
- Checkout, Customer Portal, sync stato via webhook
- Subscription gating nel middleware (redirect a `/dashboard/expired`)

### Analytics
- 4 KPI cards con delta % vs periodo precedente
- Grafici fatturato e appuntamenti giornalieri
- Servizi più richiesti, breakdown clienti nuovi vs ricorrenti
- Calcolo notturno via cron SQL (`calculate_analytics_daily`)

### Altre Funzionalità
- **CRUD Servizi** — nome, durata, prezzo, combo, toggle attivo
- **CRUD Staff** — nome, orari lavoro per giorno, toggle attivo
- **Waitlist** — filtri per stato, ricerca, badge, bulk-expire
- **Chiusure straordinarie** — date picker, motivo, integrato in booking e calendario
- **Impostazioni** — dati barberia, orari apertura, template WhatsApp, regole automatiche, abbonamento

## Struttura Progetto

```
src/
├── app/
│   ├── (auth)/              # Login, Registrazione
│   ├── (dashboard)/         # Layout + pagine dashboard
│   │   └── dashboard/
│   │       ├── analytics/
│   │       ├── clients/
│   │       ├── expired/
│   │       ├── services/
│   │       ├── settings/
│   │       ├── staff/
│   │       ├── waitlist/
│   │       └── page.tsx     # Calendario (home dashboard)
│   ├── api/
│   │   ├── stripe/webhook/  # Webhook Stripe
│   │   └── whatsapp/webhook/# Webhook Twilio WhatsApp
│   ├── auth/callback/       # OAuth / magic link callback
│   ├── book/[slug]/         # Booking pubblico
│   └── layout.tsx
├── actions/                 # Server Actions (9 moduli)
│   ├── analytics.ts
│   ├── appointments.ts
│   ├── billing.ts
│   ├── business.ts
│   ├── clients.ts
│   ├── closures.ts
│   ├── services.ts
│   ├── staff.ts
│   └── waitlist.ts
├── components/              # Componenti React (10 domini)
├── db/
│   ├── schema.ts            # Schema Drizzle (10 tabelle, 6 enums)
│   └── index.ts             # Connessione DB
├── lib/
│   ├── supabase/            # Client Supabase (client, server, middleware)
│   ├── slots.ts             # Algoritmo calcolo slot disponibili
│   ├── stripe.ts            # Client Stripe
│   ├── stripe-plans.ts      # Definizione piani e prezzi
│   ├── templates.ts         # Template messaggi WhatsApp (default italiani)
│   ├── whatsapp.ts          # Servizio WhatsApp (Twilio / mock)
│   └── utils.ts
├── types/index.ts           # Tipi inferiti da Drizzle
└── proxy.ts                 # Middleware Next.js 16 (auth + subscription gating)
```

## Database (10 tabelle)

`businesses` · `staff` · `services` · `staff_services` · `clients` · `appointments` · `waitlist` · `messages` · `message_templates` · `analytics_daily` · `business_closures`

- RLS abilitato su ogni tabella con isolamento per `business_id`
- Trigger `on_auth_user_created` per auto-creazione business alla registrazione
- 6 SQL helper functions per il sistema di conferma intelligente
- Funzione `calculate_analytics_daily` per aggregazione notturna

## Setup Locale

### Prerequisiti
- Node.js 22 LTS
- pnpm (`npm install -g pnpm`)
- Account [Supabase](https://supabase.com)
- Account [Stripe](https://stripe.com) (opzionale per billing)
- Account [Twilio](https://twilio.com) (opzionale — senza, i messaggi restano in mock)

### Installazione

```bash
# Clona il repository
git clone <repo-url>
cd barberos-mvp

# Installa dipendenze
pnpm install

# Configura variabili d'ambiente
cp .env.example .env.local
# Compila .env.local con le tue credenziali (vedi sezione sotto)

# Push schema al database
pnpm db:push

# Avvia il dev server (Turbopack)
pnpm dev
```

### Variabili d'Ambiente

```env
# Supabase (obbligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://...     # Connection pooler (porta 6543)
DIRECT_URL=postgresql://...       # Connessione diretta (porta 5432)
SUPABASE_SERVICE_ROLE_KEY=...     # Per webhook e operazioni admin

# App
NEXT_PUBLIC_APP_URL=https://localhost:3000

# Twilio WhatsApp (opzionale — senza, i messaggi restano in mock)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Stripe Billing (opzionale per sviluppo locale)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENTIAL=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
```

### Script Disponibili

| Comando | Descrizione |
|---|---|
| `pnpm dev` | Dev server con Turbopack |
| `pnpm build` | Build produzione |
| `pnpm start` | Avvia server produzione |
| `pnpm lint` | Check con Biome |
| `pnpm lint:fix` | Fix automatici Biome |
| `pnpm format` | Formattazione Biome |
| `pnpm typecheck` | Type check TypeScript |
| `pnpm db:generate` | Genera migrazioni Drizzle |
| `pnpm db:push` | Push schema al database |
| `pnpm db:studio` | Apri Drizzle Studio |

### Setup Stripe (una tantum)

```bash
npx tsx scripts/setup-stripe.ts
```

Crea i prezzi ricorrenti mensili su Stripe e aggiorna `.env.local` con i price ID.

## Stato del Progetto

| Fase | Stato | Contenuto |
|---|---|---|
| **A — Infrastruttura** | ✅ Completata | Supabase, Next.js, DB, Auth, Layout |
| **B — Funzionalità Core** | ✅ Completata | Calendario, CRUD, CRM Clienti |
| **C — Automazioni e Business** | ✅ Completata | WhatsApp, Billing, Analytics, Waitlist |
| **D — Polish e Deploy** | 🔧 In corso | Deploy Vercel ✅, Dominio, PWA, Performance |

### Prossimi Passi (Fase D)
- ~~Deploy produzione su Vercel~~ ✅
- Acquisto dominio + DNS Cloudflare
- Configurazione webhook Stripe (richiede URL pubblica)
- PWA con Serwist (service worker, manifest, installabilità)
- Test flussi end-to-end
- Performance optimization
- Audit sicurezza (rate limiting, CSP headers, CORS)

## Note Tecniche

- **Next.js 16** usa `proxy.ts` invece di `middleware.ts` per protezione route e refresh sessione
- **Supabase JS** usato per query runtime (beneficia di RLS automatico); Drizzle usato per schema e migrazioni
- **WhatsApp dual-mode**: se le variabili `TWILIO_*` sono configurate → invio reale via Twilio. Altrimenti → mock con `console.log`
- **Template messaggi**: default italiani in `lib/templates.ts`, personalizzabili dal barbiere via UI → salvati su DB
- **Server Actions** per tutte le mutazioni autenticate. Unica API route: webhook WhatsApp e Stripe

## Licenza

Proprietario. Tutti i diritti riservati.
