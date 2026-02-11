## Contesto
BarberOS e' un SaaS per barbershop (Next.js 16, React 19, Supabase, Tailwind v4, shadcn/ui).
Leggi CLAUDE.md per le convenzioni del progetto.
Leggi Dev Barbieri/Sviluppo/Stato-progetto.md per il contesto completo.

## Regole per ogni step

1. Leggere SEMPRE i file coinvolti prima di modificarli
2. UI in italiano (come tutto il progetto)
3. Usare i componenti shadcn/ui gia' presenti in src/components/ui/
4. Server actions con validazione Zod (zod/v4) come tutti gli altri moduli in src/actions/
5. Dopo ogni step: pnpm typecheck && pnpm test && pnpm build devono passare
6. NON installare nuove dipendenze senza chiedere prima
7. NON modificare lo schema DB — le tabelle e colonne esistono gia'


BARBEROS MVP — TASK FASE D RIMANENTI

Ultimo aggiornamento: 11 febbraio 2026
Stato: 17/19 completati — restano 2 task

---

TASK 1 — DOMINIO CUSTOM + WHATSAPP PRODUZIONE
Priorità: P0 (bloccante per lancio con clienti reali)
Stato: DA FARE

  Stato attuale:
  - Frontend: barberos-mvp.vercel.app (dominio Vercel default)
  - WhatsApp: Twilio sandbox attiva, funzionante con dominio Vercel
  - Twilio: account personale, sarà aggiunto come subaccount del cliente
  - Webhook Stripe: https://barberos-mvp.vercel.app/api/stripe/webhook
  - Webhook Twilio: https://barberos-mvp.vercel.app/api/whatsapp/webhook

  Step 1.1 — Acquisto dominio
  [ ] Scegliere e acquistare dominio (es. barberos.it, barberos-app.it)
  [ ] Registrar consigliati: Cloudflare Registrar (più economico) o Namecheap

  Step 1.2 — DNS + Vercel
  [ ] Aggiungere dominio custom su Vercel: Project → Settings → Domains → Add
  [ ] Configurare DNS: CNAME record → cname.vercel-dns.com (o A record → 76.76.21.21)
  [ ] Verificare SSL automatico (Vercel lo gestisce)
  [ ] Aggiornare NEXT_PUBLIC_APP_URL su Vercel con il nuovo dominio

  Step 1.3 — Aggiornare webhook URLs
  [ ] Stripe Dashboard → Webhooks → Aggiornare URL a https://NUOVO-DOMINIO/api/stripe/webhook
  [ ] Twilio Console → Sandbox → Aggiornare webhook URL a https://NUOVO-DOMINIO/api/whatsapp/webhook
  [ ] Supabase Dashboard → Auth → URL Configuration → Site URL → https://NUOVO-DOMINIO
  [ ] Verificare redirect URLs in Supabase Auth (Redirect URLs list)

  Step 1.4 — WhatsApp Produzione (quando il cliente è pronto)
  [ ] Creare Twilio subaccount per il cliente
  [ ] Registrazione WhatsApp Business Sender (approvazione Meta, 1-7 giorni)
  [ ] Aggiornare TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM su Vercel
  [ ] Aggiornare secrets Twilio su Supabase Edge Functions (3 secrets)
  [ ] Test invio messaggio WhatsApp reale

  Note:
  - La sandbox Twilio funziona già con il dominio Vercel attuale
  - Il passaggio a produzione WhatsApp può essere fatto dopo il lancio iniziale
  - Il subaccount Twilio isola i costi per cliente

---

TASK 2 — PWA CON SERWIST ✅ COMPLETATO
Priorità: P1 (importante per UX barbieri su mobile)
Stato: COMPLETATO
Completato: 11 febbraio 2026

  Implementazione:
  [x] @serwist/next 9.5.5 + serwist 9.5.5 (devDep) installati
  [x] src/sw.ts creato: precache manifest + defaultCache runtime caching
  [x] next.config.ts wrappato con withSerwist({ swSrc, swDest, disable in dev })
  [x] Build cambiato a "next build --webpack" (Serwist richiede webpack, Next.js 16 default Turbopack)
  [x] Dev resta Turbopack (next dev --turbopack), Serwist disabilitato in dev
  [x] public/manifest.json: name "BarberOS", start_url "/dashboard", display "standalone", theme_color "#09090b", lang "it"
  [x] public/icon-192x192.png e public/icon-512x512.png generati da logo.png (sfondo zinc-950, logo centrato 80%)
  [x] layout.tsx: metadata.manifest, appleWebApp (capable, statusBarStyle, title), viewport.themeColor
  [x] tsconfig.json: lib "webworker", types "@serwist/next/typings", exclude "public/sw.js"
  [x] .gitignore: public/sw* e public/swe-worker*
  [x] Installabile su mobile (Android + iOS) come app standalone

---

TASK 3 — PERFORMANCE OPTIMIZATION ✅ COMPLETATO
Priorità: P1 (migliora UX e SEO)
Stato: COMPLETATO
Completato: 11 febbraio 2026
Dettagli: Dev Barbieri/Performance/Ottimizzazioni.md

  Implementazione:
  [x] @next/bundle-analyzer ^16.1.6 installato e configurato (ANALYZE=true)
  [x] Analisi bundle: moduli framework-level (react-dom, supabase, zod, motion), nessun fat da tagliare
  [x] Lazy loading con next/dynamic + Skeleton loading per 3 componenti pesanti:
      - AnalyticsDashboard (~494 righe) in analytics/page.tsx
      - SettingsManager (~1338 righe) in settings/page.tsx
      - FormCustomizer (~395 righe) in customize/page.tsx
  [x] next/image per booking page: cover_image_url (fill + priority) e logo_url (64×64)
  [x] images.remotePatterns: { protocol: "https", hostname: "**" } per qualsiasi dominio
  [x] CSP img-src: aggiunto "https:" per domini esterni
  [x] Prefetch: sidebar usa next/link (auto-prefetch di default, nessuna modifica necessaria)
  [x] pnpm typecheck ✅, pnpm test (139/139) ✅, pnpm build ✅

---

TASK 4 — MONITORING (SENTRY)
Priorità: P2 (consigliato per produzione)
Stato: DA FARE
Tempo stimato: 1 ora

  Step 4.1 — Setup Sentry
  [ ] Creare progetto su sentry.io (Next.js)
  [ ] pnpm add @sentry/nextjs
  [ ] Eseguire: npx @sentry/wizard@latest -i nextjs
  [ ] Configurare sentry.client.config.ts e sentry.server.config.ts
  [ ] Aggiungere SENTRY_DSN e SENTRY_AUTH_TOKEN su Vercel

  Step 4.2 — Configurazione
  [ ] Abilitare source maps upload (automatico con wizard)
  [ ] Configurare tracesSampleRate (0.1 per iniziare = 10% delle transazioni)
  [ ] Aggiungere Sentry.captureException() nei catch block critici:
      - src/app/api/stripe/webhook/route.ts
      - src/app/api/whatsapp/webhook/route.ts
      - Server Actions con try/catch
  [ ] Aggiornare CSP in next.config.ts per Sentry (connect-src + script-src)

  Step 4.3 — Test
  [ ] Verificare che errori appaiano nella dashboard Sentry
  [ ] Configurare alert email per errori critici

---

TASK SUPABASE — PERFORMANCE ADVISORS (opzionali, non bloccanti)
Priorità: P2 (INFO level, non WARN)
Stato: DA VALUTARE

  Advisor 1: staff_services senza primary key
  [ ] Valutare se aggiungere PK composita (staff_id, service_id)
      → Migrazione: ALTER TABLE staff_services ADD PRIMARY KEY (staff_id, service_id);
      → Beneficio: performance migliore su JOIN e query

  Advisor 2: 5 indici inutilizzati (pre-lancio, pochi dati)
  - idx_appointments_service_id
  - idx_waitlist_client_id
  - idx_waitlist_service_id
  - messages_scheduled_status_idx
  - idx_staff_services_service_id
  → NON rimuovere: diventeranno utili con traffico reale
  → Rivalutare dopo 1 mese di produzione con dati reali

  Advisor 3: Auth DB connections strategy
  → Cambiare solo se si fa upgrade istanza Supabase
  → Per ora (free/pro tier): 10 connessioni assolute vanno bene

---

RIEPILOGO

  Task                              | Priorità | Bloccante | Stato
  ──────────────────────────────────+──────────+───────────+────────────
  1. Dominio + WhatsApp Produzione  | P0       | SÌ        | DA FARE
  2. PWA con Serwist                | P1       | No        | ✅ COMPLETATO
  3. Performance Optimization       | P1       | No        | ✅ COMPLETATO
  4. Monitoring (Sentry)            | P2       | No        | DA FARE
  5. Supabase Performance Advisors  | P2       | No        | DA VALUTARE
  ──────────────────────────────────+──────────+───────────+────────────

  Ordine consigliato per i rimanenti:
  1. Dominio + registrazione WhatsApp Business (avviare subito per attesa Meta)
  2. Sentry (error tracking per produzione)
  3. Supabase advisors (dopo 1 mese con dati reali)
