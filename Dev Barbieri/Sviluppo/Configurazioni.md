BARBEROS MVP — CONFIGURAZIONI E INFRASTRUTTURA

Ultimo aggiornamento: 11 febbraio 2026

---

SUPABASE

Project ID: wvxkxutaasrblbdmhsny
URL: https://wvxkxutaasrblbdmhsny.supabase.co
Regione: eu-central-1 (Francoforte)
Organizzazione: Progetti futuri (jdipyszyiijpodyvllfi)
Database: PostgreSQL 17.6
Stato: ACTIVE_HEALTHY
Costo: $10/mese

Anon Key (pubblico): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2eGt4dXRhYXNyYmxiZG1oc255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDA4ODUsImV4cCI6MjA4NjE3Njg4NX0.viUNH8welN0eRR2YrpZ86dFRSX6ETe3Mek4JhoHyD4A
Publishable Key: sb_publishable_8IT94u1wPKgw-hNCJWAhug_FOuKNjIQ

---

VARIABILI D'AMBIENTE (.env.local)

NEXT_PUBLIC_SUPABASE_URL=https://wvxkxutaasrblbdmhsny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key sopra]
DATABASE_URL=postgresql://postgres.[wvxkxutaasrblbdmhsny]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[wvxkxutaasrblbdmhsny]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Supabase Service Role Key (per webhook e operazioni admin — NON esporre lato client)
SUPABASE_SERVICE_ROLE_KEY=[service role key da Supabase Dashboard > Settings > API]

# URL pubblica dell'app (per validazione webhook Twilio)
NEXT_PUBLIC_APP_URL=https://localhost:3000

# Twilio WhatsApp (opzionale — senza queste variabili i messaggi restano in mock)
TWILIO_ACCOUNT_SID=[dal dashboard Twilio]
TWILIO_AUTH_TOKEN=[dal dashboard Twilio]
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Stripe Billing
STRIPE_SECRET_KEY=[da https://dashboard.stripe.com/apikeys → Secret key]
STRIPE_WEBHOOK_SECRET=[da https://dashboard.stripe.com/webhooks → Signing Secret — richiede dominio]
STRIPE_PRICE_ESSENTIAL=[creato da scripts/setup-stripe.ts]
STRIPE_PRICE_PROFESSIONAL=[creato da scripts/setup-stripe.ts]

Nota: la password del database va recuperata dalla Supabase Dashboard > Settings > Database.
Nota: SUPABASE_SERVICE_ROLE_KEY è server-only, usata dai webhook per bypassare RLS.
Nota: Se le variabili TWILIO_* non sono configurate, i messaggi vengono solo loggati in console (mock mode).
Nota: STRIPE_SECRET_KEY è server-only (sk_live_..., NON pk_live_...).
Nota: Per creare i prezzi ricorrenti: npx tsx scripts/setup-stripe.ts
Nota: STRIPE_WEBHOOK_SECRET non configurabile finché non c'è un dominio pubblico.

---

DIPENDENZE INSTALLATE (package.json)

Runtime:
- next 16.1.6
- react 19.2.3
- react-dom 19.2.3

Database e Auth:
- @supabase/supabase-js ^2.95.3
- @supabase/ssr ^0.8.0
- drizzle-orm ^0.45.1
- postgres ^3.4.8
- zod ^4.3.6

UI:
- tailwindcss ^4
- radix-ui ^1.4.3 (primitivi headless per shadcn/ui)
- lucide-react ^0.563.0
- class-variance-authority ^0.7.1
- clsx ^2.1.1
- tailwind-merge ^3.4.0
- next-themes ^0.4.6 (dark mode)
- motion ^12.34.0 (Framer Motion, animazioni)
- sonner ^2.0.7 (toast notifications)
- tw-animate-css ^1.4.0 (animazioni Tailwind)

WhatsApp:
- twilio ^5.12.1

Pagamenti:
- stripe 20.3.1

Analytics:
- @vercel/analytics ^1.6.1
- @vercel/speed-insights ^1.3.1

PWA:
- @serwist/next 9.5.5 (service worker bundling per Next.js)

Utility:
- date-fns ^4.1.0

Dev:
- typescript ^5
- @biomejs/biome ^2.3.14
- drizzle-kit ^0.31.8
- @tailwindcss/postcss ^4
- babel-plugin-react-compiler 1.0.0
- serwist 9.5.5 (runtime service worker, devDependency)
- @next/bundle-analyzer ^16.1.6 (analisi bundle, attivo con ANALYZE=true)

---

SCRIPTS (pnpm)

pnpm dev           → Dev server con Turbopack (porta 3000)
pnpm build         → Build di produzione (next build --webpack, richiesto da Serwist)
pnpm start         → Server di produzione
pnpm lint          → Lint con Biome
pnpm lint:fix      → Auto-fix lint
pnpm format        → Formattazione con Biome
pnpm typecheck     → Type check TypeScript (tsc --noEmit)
pnpm db:generate   → Genera migrazioni Drizzle
pnpm db:push       → Push schema a Supabase
pnpm db:studio     → UI studio Drizzle
pnpm test          → Esegui unit test Vitest (139 test, 7 file)
pnpm test:watch    → Unit test in watch mode

---

CI/CD — GITHUB ACTIONS

Workflow: .github/workflows/ci.yml
Trigger: push su main + pull request su main
Concurrency: cancel-in-progress (evita build duplicate)
Timeout: 10 minuti

Pipeline (4 step sequenziali):
1. pnpm typecheck  → tsc --noEmit
2. pnpm lint       → biome check .
3. pnpm test       → vitest run (139 unit test)
4. pnpm build      → next build (con env placeholder)

Stack CI:
- Runner: ubuntu-latest
- pnpm: v10 (pnpm/action-setup@v4)
- Node.js: v22 (actions/setup-node@v4 con cache pnpm)
- Install: pnpm install --frozen-lockfile

Env placeholder per build step (non servono valori reali per compilare):
- NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
- NEXT_PUBLIC_APP_URL=https://placeholder.app

Biome config (biome.json):
- Schema: 2.3.14
- Regole errore (bloccano CI): useButtonType, useTemplate, useOptionalChain, etc.
- Regole warn (non bloccano CI): noLabelWithoutControl, noSvgWithoutTitle, noStaticElementInteractions, useKeyWithClickEvents, noArrayIndexKey, noExplicitAny, noUnusedFunctionParameters, noUnusedImports, noUnusedVariables
- CSS escluso: files.includes ["**", "!**/*.css"] (Tailwind v4 usa @theme/@custom-variant non supportati dal parser CSS di Biome)
- Formatter: space indent, 2 width, 100 line width, double quotes, semicolons always

---

DATABASE — SCHEMA COMPLETO

Enums (6):
- appointment_status: booked, confirmed, completed, cancelled, no_show
- appointment_source: online, walk_in, manual, waitlist
- waitlist_status: waiting, notified, converted, expired
- message_type: confirmation, confirm_request, confirm_reminder, pre_appointment, cancellation, review_request, reactivation, waitlist_notify
- message_status: queued, sent, delivered, read, failed
- subscription_status: active, past_due, cancelled, trialing, incomplete

Tabelle (11):

1. businesses
   - id (uuid PK), owner_id (uuid, auth.uid), name, slug (unique), address, phone, logo_url, google_review_link, opening_hours (jsonb), welcome_text (text), cover_image_url (text), font_preset (text), brand_colors (jsonb), timezone (default Europe/Rome), stripe_customer_id, subscription_status (default trialing), dormant_threshold_days (default 28), no_show_threshold (default 2), auto_complete_delay_minutes (int, default 20), created_at, updated_at

2. staff
   - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), name, photo_url, working_hours (jsonb), active (default true), sort_order (default 0), created_at, updated_at
   - Index: staff_business_id_idx

3. services
   - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), name, duration_minutes (int), price_cents (int), is_combo (default false), combo_service_ids (uuid[]), display_order (default 0), active (default true), created_at, updated_at
   - Index: services_business_id_idx

4. staff_services (tabella ponte many-to-many)
   - staff_id (FK → staff ON DELETE CASCADE), service_id (FK → services ON DELETE CASCADE)
   - Unique index: staff_services_pk(staff_id, service_id)

5. clients
   - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), first_name, last_name, phone, email, notes, tags (text[]), no_show_count (default 0), total_visits (default 0), last_visit_at, created_at, updated_at
   - Unique index: clients_business_phone_idx(business_id, phone)
   - Index: clients_business_id_idx

6. appointments
   - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), client_id (FK → clients ON DELETE SET NULL), staff_id (FK → staff ON DELETE SET NULL), service_id (FK → services ON DELETE SET NULL), date, start_time, end_time, status (default booked), source (default online), cancelled_at, created_at, updated_at
   - Index: appointments_business_date_idx, appointments_staff_date_idx

7. waitlist
   - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), client_id (FK → clients ON DELETE CASCADE), service_id (FK → services ON DELETE SET NULL), desired_date, desired_start_time, desired_end_time, status (default waiting), notified_at, created_at
   - Index: waitlist_business_date_idx

8. messages
   - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), client_id (FK → clients ON DELETE SET NULL), appointment_id (FK → appointments ON DELETE SET NULL), type, whatsapp_message_id, status (default queued), scheduled_for, sent_at, created_at
   - Index: messages_scheduled_status_idx, messages_business_id_idx

9. message_templates
   - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), type, body_template, active (default true), created_at, updated_at
   - Unique index: message_templates_business_type_idx(business_id, type)

10. analytics_daily
    - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), date, total_revenue_cents (default 0), appointments_completed (default 0), appointments_cancelled (default 0), appointments_no_show (default 0), new_clients (default 0), returning_clients (default 0), created_at
    - Unique index: analytics_daily_business_date_idx(business_id, date)

11. business_closures
    - id (uuid PK), business_id (FK → businesses ON DELETE CASCADE), date, reason (text nullable), created_at
    - Unique index: business_closures_business_date_idx(business_id, date)
    - Index: business_closures_business_id_idx

---

RLS POLICIES

Ogni tabella ha RLS abilitato. Struttura per ogni tabella:
- SELECT/INSERT/UPDATE/DELETE filtrati per business_id dell'utente autenticato
- Funzione helper: get_user_business_id() restituisce l'id della business dell'utente corrente
- businesses: SELECT pubblica per booking + owner check con (select auth.uid()) per INSERT/UPDATE/DELETE
- staff, services, staff_services: SELECT pubblica unica (policy owner-only rimossa perché ridondante)
- clients: INSERT unica consolidata (business_id IN SELECT id FROM businesses) per owner + booking anonimo
- appointments: SELECT pubblica per slot checking, INSERT unica consolidata per owner + booking anonimo
- auth.uid() wrappato in (select auth.uid()) su businesses e business_closures per evitare re-evaluation per riga (fix auth_rls_initplan)

Funzioni DB:
- get_user_business_id() — STABLE, SECURITY DEFINER, search_path = public
- handle_new_user() — Trigger AFTER INSERT su auth.users, crea automaticamente una riga in businesses
- auto_complete_appointments() — SECURITY DEFINER, search_path = ''. Segna confirmed → completed quando end_time + ritardo configurabile per business (auto_complete_delay_minutes, default 20 min) è passato (Europe/Rome). Aggiorna total_visits e last_visit_at del cliente.

Supabase Auth Security:
- Leaked Password Protection: ENABLED (HaveIBeenPwned.org)
- Minimum password length: 8 caratteri
- Secure email change: abilitato

---

MIGRAZIONI APPLICATE

1. create_enums_and_tables — Schema iniziale completo (10 tabelle, 6 enums, tutti gli indici)
2. enable_rls_and_policies — RLS su tutte le tabelle + policy per owner e booking pubblico
3. auto_create_business_on_signup — Trigger auto-business + policy anon booking
4. fix_security_advisors — Fix search_path su get_user_business_id + tightening policy anon
5. enable_pg_cron_and_pg_net — Abilita pg_cron v1.6.4 e pg_net v0.19.5
6. create_cron_helper_functions — 4 SQL helper functions (vecchio sistema reminder)
7. setup_cron_schedules — 5 pg_cron schedules (vecchio sistema reminder)
8. smart_confirmation_cleanup — Aggiunge enum confirm_request/confirm_reminder/pre_appointment, rimuove vecchi cron (auto-noshow, reminder-24h, reminder-2h), drop vecchie functions
9. smart_confirmation_functions — 4 nuove SQL functions (find_appointments_needing_confirm_request, find_appointments_needing_confirm_reminder, auto_cancel_unconfirmed, find_confirmed_needing_pre_reminder)
10. smart_confirmation_cron_schedules — 4 nuovi pg_cron schedules (confirmation-request, confirmation-reminder, auto-cancel, pre-appointment)
11. analytics_daily_function — Funzione SQL calculate_analytics_daily(target_date) con UPSERT per calcolo metriche giornaliere
12. analytics_daily_cron — pg_cron schedule analytics-daily-calc alle 02:05 UTC (03:05 Roma), calcola giorno precedente
13. business_closures_table — Tabella business_closures (id, business_id, date, reason) con RLS + policy owner
14. fix_search_path_calculate_analytics_daily — Fix search_path su calculate_analytics_daily
15. security_perf_fixes — auth.uid() → (select auth.uid()) su businesses/business_closures, 7 indici FK, policy duplicate consolidate su services/staff/staff_services
16. consolidate_permissive_policies — Consolidamento policy INSERT/SELECT duplicate su appointments/businesses/clients
17. auto_complete_appointments — Colonna auto_complete_delay_minutes (default 20) su businesses + funzione auto_complete_appointments() con ritardo per-business + pg_cron schedule */20 (auto-completa confermati dopo end_time + delay, aggiorna stats cliente)
18. add_welcome_text — Colonne welcome_text, cover_image_url, font_preset su businesses per personalizzazione booking page
19. auto_complete_appointments (locale) — Migrazione locale per auto-complete (già applicata via Supabase Dashboard)

---

POSTGRESQL EXTENSIONS ABILITATE

- pgcrypto v1.3 (schema extensions) — funzioni crittografiche
- pg_stat_statements v1.11 (schema extensions) — statistiche query
- uuid-ossp v1.1 (schema extensions) — generazione UUID
- pg_graphql v1.5.11 (schema graphql) — GraphQL support
- supabase_vault v0.3.1 (schema vault) — gestione secrets
- pg_cron v1.6.4 (schema pg_catalog) — job scheduler
- pg_net v0.19.5 (schema extensions) — HTTP async da SQL

---

SUPABASE EDGE FUNCTIONS

6 Edge Functions attive per sistema conferma intelligente + automazioni.
Runtime: Deno (Supabase Edge Runtime)
Env vars auto-disponibili: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Per abilitare WhatsApp reale, aggiungere questi secrets alle Edge Functions
(Supabase Dashboard > Edge Functions > Secrets):
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_FROM (es. whatsapp:+14155238886)

Senza queste variabili → mock mode (console.log).

Sistema Conferma Intelligente (4 Edge Functions):
| Nome | Schedule | Cosa fa |
|------|----------|---------|
| confirmation-request | */30 * * * * | Richiesta conferma (timing smart basato su orario) |
| confirmation-reminder | */30 * * * * | Secondo avviso se non ha risposto |
| auto-cancel | */30 * * * * | Cancella non confermati alla deadline + notifica waitlist |
| pre-appointment | */30 * * * * | "Ci vediamo!" ~2h prima (solo confermati) |

Automazioni aggiuntive (2 Edge Functions + 1 SQL diretto):
| Nome | Schedule | Cosa fa |
|------|----------|---------|
| review-request | 15 * * * * (ogni ora :15) | Richiesta recensione Google post-completamento |
| reactivation | 0 10 * * * (11:00 Roma) | Riattivazione clienti dormienti |
| auto-complete-appointments | */20 * * * * | SQL diretto (no Edge Function): confirmed → completed dopo end_time + ritardo configurabile per business (default 20 min), aggiorna total_visits/last_visit_at |

Timing smart conferma:
| Orario appuntamento | 1ª richiesta | 2° reminder | Deadline auto-cancel |
|---------------------|--------------|-------------|----------------------|
| Pomeriggio (≥14:00) | Sera prima 20:00 | Mattina 08:00 | Ore 12:00 |
| Tarda mattina (10-14) | Sera prima 20:00 | Mattina 07:30 | Ore 09:00 |
| Mattina presto (<10) | Giorno prima 12:00 | Sera prima 20:00 | Sera prima 22:00 |

Comandi WhatsApp (webhook /api/whatsapp/webhook):
| Comando | Azione |
|---------|--------|
| CONFERMA | booked → confirmed, risposta "Ci vediamo presto!" |
| CANCELLA / ANNULLA | Cancella appuntamento, notifica waitlist |
| CAMBIA ORARIO | Invia link prenotazione |
| SI / SÌ | Conferma dalla waitlist |
| Altro | Risposta con lista comandi disponibili |

Comandi utili per debug:
- Verificare cron jobs: SELECT jobid, jobname, schedule FROM cron.job;
- Log esecuzioni: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
- Testare Edge Function: curl https://wvxkxutaasrblbdmhsny.supabase.co/functions/v1/confirmation-request
- Log Edge Functions: Supabase Dashboard > Edge Functions > Logs

---

HOSTING

Attivo:
- Vercel: frontend, Server Actions, API routes (progetto collegato, cartella .vercel presente)
- Supabase Cloud: database, auth, edge functions, pg_cron (già attivo, regione eu-central-1)

Da configurare:
- Dominio custom: da acquistare
- Cloudflare: DNS + CDN (da configurare dopo acquisto dominio)
- Webhook Stripe: richiede URL pubblica (dominio)
- NEXT_PUBLIC_APP_URL: da aggiornare con dominio produzione

---

SERVIZI ESTERNI

- WhatsApp API: integrazione Twilio completata (dual-mode: live o mock). Webhook pronto su /api/whatsapp/webhook. Serve configurare credenziali Twilio per invio reale. Edge Functions usano Twilio REST API direttamente (fetch, no npm).
- Stripe: integrazione completata (stripe@20.3.1, API 2026-01-28.clover). 3 piani: Essential €300/mese (prod_TwyoUI0JLvWcj3, price_1Sz4yuK75hVrlrva5iqHgE52), Professional €500/mese (prod_TwypWo5jLd3doz, price_1Sz4yvK75hVrlrvaemSc8lLf), Enterprise custom (prod_TwyphvT1F82GrB). Trial 7gg. Codici promozionali abilitati (allow_promotion_codes). Webhook su /api/stripe/webhook (da configurare con dominio). Customer Portal per self-service. Setup script: npx tsx scripts/setup-stripe.ts.
- Vercel: deploy collegato. Da configurare dominio personalizzato.
- Sentry: non configurato (monitoring errori).
- Vercel Analytics: @vercel/analytics ^1.6.1 + @vercel/speed-insights ^1.3.1 integrati in layout.tsx.

Security Headers (next.config.ts):
- Content-Security-Policy: self + Supabase (*.supabase.co) + Stripe (js.stripe.com, *.stripe.com) + Vercel Analytics (*.vercel-insights.com, *.vercel-analytics.com). img-src include https: per immagini esterne (logo/cover barberia). frame-ancestors 'none', object-src 'none'.
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Applicati a tutte le route via headers() con source "/(.*)".
