STACK TECNOLOGICO (aggiornato 10 febbraio 2026)

Runtime: Node.js 22 LTS.

Frontend: Next.js 16.1.6 con App Router, React 19.2.3 con React Compiler e Server Components/Actions. Tailwind CSS v4. Componenti custom con Lucide React per icone. Turbopack come bundler di sviluppo. TypeScript 5.x in strict mode. Biome 2.3.14 per linting e formatting (sostituto moderno di ESLint + Prettier).

Backend: Supabase (PostgreSQL 17.6, Auth, Row Level Security, Edge Functions Deno per logica serverless). Server Actions di Next.js 16 per mutazioni dirette dal client. Supabase JS client per query runtime con RLS automatico.

ORM e database: Drizzle ORM 0.45.x per query type-safe, migrazioni e schema-as-code. Supabase come provider PostgreSQL managed. Migrazioni versionate con drizzle-kit push e generate. Nessun Prisma: Drizzle è più leggero, più veloce, zero overhead a runtime.

Notifiche WhatsApp: Twilio (^5.12.1) tramite WhatsApp Business API. Webhook /api/whatsapp/webhook per risposte in ingresso (CONFERMA, CANCELLA, CAMBIA ORARIO, SI). Comandi gestiti con risposta automatica. Dual-mode: Twilio live o mock console.log. pg_cron + pg_net nativi per scheduling (6 cron jobs: conferma intelligente, review, riattivazione).

Autenticazione: Supabase Auth con email + password e magic link. JWT con refresh token automatico. RLS policies su ogni tabella per isolamento dati completo tra barberie. proxy.ts (Next.js 16) per protezione route lato server.

Pagamenti abbonamento barbiere: Stripe Billing (stripe@20.3.1, API 2026-01-28.clover). 3 piani: Essential €300/mese (prod_TwyoUI0JLvWcj3), Professional €500/mese (prod_TwypWo5jLd3doz), Enterprise custom (prod_TwyphvT1F82GrB). Trial 30gg. Stripe Checkout con selezione piano. Stripe Webhook /api/stripe/webhook per sync stato su DB (da configurare con dominio). Stripe Customer Portal per self-service. Setup €1.000 una tantum fatturato separatamente. Nessun pagamento del cliente finale nell'MVP.

Cron e job scheduling: pg_cron v1.6.4 nativo di Supabase per job ricorrenti (conferma intelligente, review, riattivazione, analytics). pg_net v0.19.5 per chiamate HTTP async alle Edge Functions. 7 cron schedules attivi.

Monitoring e observability (previsto): Sentry per error tracking. Vercel Analytics per Core Web Vitals. Supabase Dashboard per query performance e database health.

AI (fase 2 post-MVP): Anthropic Claude API per suggerimenti automatici, previsione no-show, generazione testi marketing.

Hosting (previsto): Vercel per frontend, Server Actions e API routes. Supabase Cloud per database, auth, edge functions, pg_cron (già attivo). Dominio custom con Cloudflare per DNS e CDN.

CI/CD (previsto): GitHub Actions per test e deploy. Vercel Preview Deployments. Lint con Biome. Type check con tsc --noEmit.

Package manager: pnpm 10.29.2 (più veloce di npm, gestione dipendenze strict, disk-efficient).

Dipendenze principali: next 16.1.6, react 19.2.3, @supabase/ssr ^0.8.0, drizzle-orm ^0.45.1, stripe 20.3.1, twilio ^5.12.1, lucide-react ^0.563.0, tailwindcss ^4, date-fns ^4.1.0, zod ^4.3.6.