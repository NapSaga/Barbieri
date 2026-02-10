# Barberos MVP

Piattaforma SaaS per la gestione di barberie: prenotazioni online, CRM clienti, notifiche WhatsApp automatiche e analytics.

## Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, TypeScript 5.x strict
- **Backend**: Supabase (PostgreSQL 17, Auth, Realtime, RLS, Edge Functions)
- **ORM**: Drizzle ORM
- **Package Manager**: pnpm
- **Linting**: Biome
- **WhatsApp**: Mock (Twilio/360dialog in produzione)

## Setup

```bash
pnpm install
cp .env.example .env.local
# Configura le variabili in .env.local
pnpm dev
```

## Scripts

| Comando | Descrizione |
|---|---|
| `pnpm dev` | Dev server con Turbopack |
| `pnpm build` | Build di produzione |
| `pnpm lint` | Lint con Biome |
| `pnpm format` | Formattazione con Biome |
| `pnpm typecheck` | Type check TypeScript |
| `pnpm db:generate` | Genera migrazioni Drizzle |
| `pnpm db:push` | Push schema a Supabase |

## Struttura

```
src/
├── app/              # Route Next.js (App Router)
│   ├── (auth)/       # Login e registrazione
│   ├── (dashboard)/  # Dashboard protetta
│   ├── book/[slug]/  # Pagina booking pubblica
│   └── auth/         # Auth callback
├── actions/          # Server Actions
├── components/       # Componenti React
│   ├── booking/      # Wizard prenotazione
│   └── shared/       # Sidebar, layout condiviso
├── db/               # Schema Drizzle e connessione
├── lib/              # Utilities (Supabase, WhatsApp, slots)
└── types/            # TypeScript types
```

## Database

10 tabelle con RLS su ognuna: `businesses`, `staff`, `services`, `staff_services`, `clients`, `appointments`, `waitlist`, `messages`, `message_templates`, `analytics_daily`.

## Fasi di Sviluppo

- **Fase A** ✅ — Scaffold, DB, Auth, Layout dashboard, Booking page
- **Fase B** — Calendario, Servizi CRUD, Staff CRUD, CRM clienti
- **Fase C** — WhatsApp reale, Waitlist, Analytics, Stripe, Impostazioni
- **Fase D** — Integrazione end-to-end, PWA, Performance, Deploy
