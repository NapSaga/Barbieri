BARBEROS MVP — ROADMAP SVILUPPO

Ultimo aggiornamento: 11 febbraio 2026

---

PANORAMICA FASI

Fase A — Infrastruttura         ✅ COMPLETATA
Fase B — Funzionalità core      ✅ COMPLETATA
Fase C — Automazioni e business  ✅ COMPLETATA
Fase D — Polish e deploy         🔧 IN CORSO (18/19 completati)

---

FASE A — INFRASTRUTTURA ✅

[x] Creazione progetto Supabase (eu-central-1)
[x] Scaffold Next.js 16 + pnpm + Tailwind v4 + TypeScript strict
[x] Configurazione Biome + variabili ambiente
[x] Schema Drizzle completo (10 tabelle + 6 enums + indici)
[x] Migrazione database su Supabase
[x] RLS policies su tutte le tabelle + fix security advisors
[x] Trigger auto-creazione business alla registrazione
[x] Supabase Auth (client/server/middleware)
[x] Middleware protezione route
[x] Layout dashboard responsive mobile-first
[x] Pagina booking pubblica /book/[slug]
[x] WhatsApp mock service
[x] Slot calculation algorithm
[x] Server Actions base (5 moduli)

FASE B — FUNZIONALITÀ CORE ✅

[x] Calendario vista giornaliera (timeline oraria + colonne staff)
[x] Calendario vista settimanale (griglia 7 giorni)
[x] Navigazione calendario (prev/next, oggi, toggle giorno/settimana)
[x] Walk-in dialog (aggiunta manuale appuntamenti)
[x] Appointment sheet (dettaglio + azioni rapide)
[x] 5 indicatori stato con colori distinti
[x] Current time indicator (linea rossa)
[x] CRUD Servizi completo (crea, modifica, toggle, elimina)
[x] CRUD Staff completo (crea, modifica nome, toggle)
[x] Editor orari di lavoro per ogni barbiere (7 giorni)
[x] CRM Clienti (lista, ricerca, creazione)
[x] Schede cliente espandibili (stats, tag, note)
[x] Tag clienti (VIP, Nuovo, Problematico, Alto rischio no-show)
[x] Note clienti con salvataggio automatico
[x] Badge no-show per clienti problematici

FASE C — AUTOMAZIONI E BUSINESS ✅

[x] Pagina impostazioni barberia (/dashboard/settings)
    - Dati barberia (nome, indirizzo, telefono, link Google Review)
    - Orari di apertura (7 giorni, toggle aperto/chiuso)
    - Sezione WhatsApp (stato connessione, guida setup)
    - Template messaggi WhatsApp personalizzabili (7 tipi, editor con variabili)
    - Recensioni Google (istruzioni + stato configurazione)
    - Regole automatiche (soglia dormiente, soglia no-show)
    - UI accordion con sezioni collassabili

[x] Integrazione WhatsApp Twilio
    - Modulo dual-mode: live Twilio o mock console.log
    - sendWhatsAppMessage() con normalizzazione numeri
    - renderTemplate() con sostituzione variabili {{...}}
    - isWhatsAppEnabled() per check configurazione
    - Invio conferma prenotazione (struttura pronta)
    - Notifica cancellazione (struttura pronta)

[x] Webhook WhatsApp (/api/whatsapp/webhook)
    - Endpoint POST per risposte clienti da Twilio
    - Validazione firma Twilio in produzione
    - Comando "ANNULLA" → cancella appuntamento + notifica waitlist
    - Comando "SI" → conferma da waitlist → crea appuntamento
    - Supabase admin client (service role key, bypassa RLS)

[x] Template messaggi (src/lib/templates.ts)
    - 7 tipi template con testi italiani e variabili placeholder
    - DEFAULT_TEMPLATES, TEMPLATE_LABELS, TEMPLATE_DESCRIPTIONS
    - CRUD su DB (message_templates) tramite upsertMessageTemplate()

[x] Server Actions business.ts (6 actions)
    - getCurrentBusiness, updateBusinessInfo, updateBusinessOpeningHours
    - updateBusinessThresholds, getMessageTemplates, upsertMessageTemplate

[x] Bug fix
    - Prezzi servizi concatenati (defaultValue → placeholder)
    - Walk-in end time overflow (cap a 23:59)
    - total_visits incremento corretto

[x] Sistema Conferma Intelligente (pg_cron + pg_net + Edge Functions)
    - Flusso: richiesta conferma → reminder → auto-cancel se non risponde → pre-appointment
    - Timing smart: orario invio basato sull'ora dell'appuntamento (sera prima / mattina)
    - confirmation-request: ogni 30min, timing smart (20:00 sera prima o 12:00 giorno prima)
    - confirmation-reminder: ogni 30min, secondo avviso (08:00 o 07:30 mattina)
    - auto-cancel: ogni 30min, cancella non confermati (12:00 / 09:00 / 22:00 deadline)
    - pre-appointment: ogni 30min, "ci vediamo!" ~2h prima (solo confermati)
    - review-request: ogni ora (:15), richiesta recensione Google post-completamento
    - reactivation: 1x/giorno 11:00 Roma, clienti dormienti
    - Webhook comandi: CONFERMA, CANCELLA, CAMBIA ORARIO, SI + risposta messaggi sconosciuti
    - 6 SQL helper functions, 6 Edge Functions, 6 cron schedules
    - Anti-spam: max 2 msg conferma + 1 pre-appuntamento per appuntamento
    - Slot liberation: auto-cancel → notifica waitlist automatica

[x] Calcolo analytics_daily (cron SQL + trigger real-time)
    - Funzione SQL calculate_analytics_daily con UPSERT
    - Trigger SQL trg_recalc_analytics su appointments (AFTER INSERT/UPDATE/DELETE)
      → ricalcola analytics_daily in tempo reale ad ogni cambio stato/data/servizio
    - pg_cron: analytics-daily-calc alle 02:05 UTC (03:05 Roma), calcola ieri + oggi (safety net)

[x] Badge conferma nel calendario
    - CalendarAppointment arricchito con confirmationStatus
    - Pallino pulsante amber su card "pending", info WhatsApp in appointment sheet
    - Query batch messages per appointment_id (ottimizzata)

[x] Waitlist UI funzionale
    - Server actions: getWaitlistEntries, removeWaitlistEntry, expireOldEntries
    - WaitlistManager con filtri stato, ricerca, badge colorati, azione rimuovi
    - Pagina /dashboard/waitlist sostituito placeholder

[x] Tag automatici clienti
    - "Affidabile" (≥3 conferme) e "Non conferma" (≥2 cancellazioni)
    - Auto-tag nel webhook, mutuamente esclusivi
    - Nuovi tag in clients-manager: Affidabile, Non conferma

[x] Fix schema Drizzle + settings
    - messageTypeEnum: confirm_request, confirm_reminder, pre_appointment
    - settings-manager: nuovi template types + variabile {{deadline}}

[x] Analytics dashboard
    - 4 KPI cards con delta % vs periodo precedente
    - Grafico fatturato giornaliero (barre con tooltip)
    - Grafico appuntamenti stacked (completati/cancellati/no-show)
    - Servizi più richiesti con progress bar
    - Breakdown clienti nuovi vs ricorrenti
    - Selector periodo: 7gg / 30gg / 90gg

[x] Stripe Billing — Multi-Piano
    - 3 prodotti Stripe: Essential €300/mese, Professional €500/mese, Enterprise custom
    - Checkout Session con selezione piano + trial 7 giorni + codici promozionali
    - Customer Portal per gestione pagamento/cancellazione
    - Webhook /api/stripe/webhook (subscription.created/updated/deleted, invoice.paid/failed)
    - Sync automatico subscription_status su DB via webhook
    - Sezione Abbonamento in Settings: 3 card piani, badge "Consigliato", Enterprise via email
    - Script setup: scripts/setup-stripe.ts (crea prezzi ricorrenti per Essential + Professional)
    - Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ESSENTIAL, STRIPE_PRICE_PROFESSIONAL

[x] Chiusure straordinarie
    - Tabella business_closures con RLS
    - Sezione in Settings: gestione date di chiusura con motivo
    - Integrazione Booking Wizard: date chiuse disabilitate
    - Integrazione Calendario: banner arancione su giorni chiusi

FASE D — POLISH E DEPLOY 🔧 (18/19)

[x] Personalizza Form (booking page branding)
    - Nuova pagina /dashboard/customize con preview live del BookingWizard
    - Sidebar: voce "Personalizza" con icona Palette nella sezione Gestione
    - Color picker primario/secondario con conversione hex→oklch per CSS variables
    - Logo URL con preview immagine
    - Messaggio di benvenuto (welcome_text, max 200 char, contatore live)
    - Immagine di copertina / banner (cover_image_url, hero image 16:9)
    - 4 preset tipografici: Moderno, Classico, Bold, Minimal (font_preset, CSS variables --font-heading/--font-body)
    - Server action updateBrandSettings (Zod validation + Supabase update)
    - Booking page pubblica (/book/[slug]) applica brand_colors, logo_url, welcome_text, cover_image_url, font_preset
    - BookingWizard: prop previewMode per disabilitare azioni nella preview
    - 44 test Vitest (schema, hexToOklch, generateBrandCSSVariables, getFontPreset, generateFontCSSVariables)
    - 20 test E2E nella checklist (sezione 17)
    - Migrazione DB: welcome_text, cover_image_url, font_preset su businesses
    - File: brand-settings.ts, form-customizer.tsx, customize/page.tsx, business.ts, sidebar.tsx, booking-wizard.tsx, book/[slug]/page.tsx, schema.ts

[x] Deploy produzione
    - Vercel collegato (cartella .vercel presente)
    - Server Actions e API routes funzionanti su Vercel
    - Supabase Cloud già attivo per database, auth, edge functions, pg_cron

[x] Subscription gating
    - proxy.ts aggiornato con gating sulle route /dashboard/*
    - Se subscription_status non è active/trialing/past_due → redirect a /dashboard/expired
    - Pagina /dashboard/expired con ExpiredView component
    - Settings e expired page esenti dal gating (per permettere riattivazione)

[x] Validazione Zod su Server Actions
    - Zod 4.3.6 (import da "zod/v4") aggiunto a tutti i 9 moduli in src/actions/
    - z.safeParse() come prima riga di ogni action, prima di qualsiasi query
    - Errori restituiti come { error: "messaggio italiano" }

[x] Prevenzione doppie prenotazioni
    - getStaffBookedSlots() query pubblica per slot occupati
    - Difesa a 3 livelli: slot nascosti, warning visivo, reject server-side
    - hasConflict() con overlap detection SQL

[x] UI Polish: shadcn/ui + Dark Mode
    - shadcn/ui integrato con 17 componenti Radix-based
    - Dark mode con next-themes (defaultTheme="dark")
    - Sonner per toast notifications
    - Motion (Framer Motion) per animazioni
    - tw-animate-css + radix-ui + components.json

[x] Vercel Analytics
    - @vercel/analytics + @vercel/speed-insights in layout.tsx
    - Page views e Core Web Vitals raccolti automaticamente

[x] Rate limiting
    - src/lib/rate-limit.ts: in-memory sliding window
    - Protezione webhook da abuso

[x] Test manuali E2E (checklist)
    - Dev Barbieri/Testing/test-checklist.md
    - 126 test cases in 16 sezioni
    - Tabella riepilogo pass/fail + bug log

[x] Esecuzione test E2E
    - 114 ✅ Pass, 0 ❌ Fail, 12 ⏭️ Skip (100% pass rate escludendo skip)
    - 8 bug fixati in 2 giri + fix successivi
    - 5 feature gap implementati (vedi sotto)
    - 20 test E2E aggiuntivi per Personalizza Form (sezione 17)

[x] Configurazione Servizi Esterni
    - 11 variabili d'ambiente su Vercel (Supabase, Stripe, Twilio, APP_URL)
    - Webhook Stripe creato: https://barberos-mvp.vercel.app/api/stripe/webhook
    - Webhook Twilio Sandbox: https://barberos-mvp.vercel.app/api/whatsapp/webhook
    - 3 secrets Twilio su Supabase Edge Functions
    - Guida completa: Dev Barbieri/Sviluppo/Guida-credenziali.md

[ ] Dominio Custom + WhatsApp Produzione
    - Stato attuale: barberos-mvp.vercel.app (dominio Vercel default)
    - WhatsApp sandbox funzionante con dominio Vercel attuale
    - Twilio: account personale, sarà aggiunto come subaccount del cliente
    - Acquisto dominio + DNS + SSL
    - Aggiornare NEXT_PUBLIC_APP_URL + webhook URLs (Stripe, Twilio, Supabase Auth)
    - Registrazione WhatsApp Business Sender (approvazione Meta, 1-7 giorni)
    - Dettagli completi: Dev Barbieri/Piano/Task-Fase-D-Rimanenti.md

[x] PWA con Serwist
    - @serwist/next 9.5.5 + serwist 9.5.5 (devDependency)
    - Service worker: src/sw.ts con precache + defaultCache runtime caching
    - next.config.ts wrappato con withSerwist (disabilitato in dev per compatibilità Turbopack)
    - Build: "next build --webpack" (Serwist richiede webpack)
    - Web App Manifest: public/manifest.json (standalone, start_url /dashboard, theme_color #09090b)
    - Icone PWA: public/icon-192x192.png e public/icon-512x512.png
    - layout.tsx: metadata.manifest, appleWebApp, viewport.themeColor
    - tsconfig.json: webworker lib, @serwist/next/typings, exclude public/sw.js
    - Installabile su mobile (Android + iOS) come app standalone

[x] Performance Optimization
    - Bundle analyzer: @next/bundle-analyzer ^16.1.6 (ANALYZE=true)
    - Lazy loading: 3 componenti pesanti con next/dynamic + Skeleton loading
      (AnalyticsDashboard, SettingsManager, FormCustomizer)
    - next/image: booking page usa <Image> per cover e logo (ottimizzazione WebP/AVIF + CDN)
    - images.remotePatterns: hostname "**" per qualsiasi dominio HTTPS
    - CSP img-src: aggiunto https: per domini esterni
    - Prefetch: sidebar usa next/link (auto-prefetch di default)
    - Dettagli: Dev Barbieri/Performance/Ottimizzazioni.md

[x] Sistema Referral
    - Modello: referrer guadagna €50 credito Stripe, invitato riceve 20% sconto primo mese
    - Database: tabella referrals + colonne referral_code/referred_by su businesses
    - 2 migrazioni Supabase (referral_system + referral_trigger_update)
    - Server actions: src/actions/referral.ts (getReferralInfo, getReferrals, validateReferralCode)
    - Pagina /dashboard/referral: 3 KPI cards, codice copiabile, share WhatsApp, tabella referral con stati
    - Sidebar: nuova sezione "Crescita" con voce "Referral" (icona Gift)
    - Integrazione /register?ref=CODICE: badge invitato, passa codice nei metadata signUp
    - Integrazione Stripe webhook: processReferralReward() su invoice.paid (€50 credito al referrer)
    - Trigger SQL aggiornato: genera referral_code, salva referred_by, crea record referrals
    - Piano completo: Dev Barbieri/Piano/Referral-System.md

[ ] Monitoring
    - Sentry per error tracking

[x] Sicurezza finale
    - CSP headers completi (self + Supabase + Stripe.js + Vercel Analytics, frame-ancestors 'none', HSTS)
    - X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
    - CORS webhook verificato (nessun Access-Control-Allow-Origin: * sui webhook)
    - Audit RLS: auth.uid() → (select auth.uid()), 7 indici FK, policy duplicate consolidate
    - WhatsApp renderTemplate() sanitizzazione verificata (plain string replace, sicuro)
    - Leaked Password Protection: ABILITATA (HaveIBeenPwned.org) — WARN risolto

[x] CI/CD GitHub Actions
    - Workflow .github/workflows/ci.yml: typecheck → lint → test → build su ogni push/PR a main
    - pnpm 10 + Node.js 22, caching dipendenze, concurrency con cancel-in-progress
    - Fix 41 errori useButtonType (type="button" aggiunto su ~15 componenti)
    - Fix 7 errori useTemplate (string concat → template literal)
    - Fix 2 errori useOptionalChain
    - Configurazione Biome aggiornata: regole a11y non-critiche downgrade a warn, CSS escluso (Tailwind v4)
    - pnpm typecheck ✅, pnpm lint ✅ (0 errori, 0 warning dopo refactor), pnpm test ✅, pnpm build ✅

[x] Refactor Lint / A11y / Formatting
    - Risolti tutti i 43 warning Biome: 26 noLabelWithoutControl (htmlFor+id), 3 noStaticElementInteractions (backdrop → button), 3 noUnusedImports, 3 noUnusedFunctionParameters, 6 noExplicitAny (biome-ignore), 1 noArrayIndexKey, 1 useSemanticElements
    - ~12 file riformattati per line width 100 char
    - biome.json invariato (regole restano warn, warning risolti nel codice)

[x] Test Automatici Vitest
    - 139 unit test in 7 file (95 originali + 44 brand-settings)
    - brand-settings.test.ts: updateBrandSettingsSchema, hexToOklch, generateBrandCSSVariables, getFontPreset, generateFontCSSVariables
    - Risultato: 139/139 pass

---

FEATURE GAP (da test E2E) — TUTTI RISOLTI ✅

[x] Filtro staff nel calendario: dropdown Select nella toolbar con opzione "Tutti" + singoli barbieri (calendar-view.tsx)
[x] Riordino staff: drag-and-drop HTML5 nativo con reorderStaff server action (staff-manager.tsx, staff.ts)
[x] Associazione staff-servizi: checkbox servizi in StaffManager + filtro staff nel BookingWizard (staff-manager.tsx, staff.ts, booking-wizard.tsx)
[x] UI servizi combo: toggle "E' un combo" + multi-select servizi nel ServiceForm (services-manager.tsx, services.ts)
[x] Aggiunta manuale waitlist: dialog "Aggiungi" con ricerca/creazione cliente + servizio + data/ora (waitlist-manager.tsx, waitlist.ts)

DEBITO TECNICO NOTO

- date-fns importato nel booking wizard ma slot calculation in lib/slots.ts non usato dal calendario
- window.location.reload() usato dopo create/update in alcuni componenti (da sostituire con router.refresh())
- settings-manager.tsx è 811 righe — potrebbe essere spezzato in sotto-componenti
- Drag and drop per spostare appuntamenti nel calendario non implementato (previsto nella scheda tecnica)
- Colori brand: ✅ RISOLTO — Personalizza Form implementato con preview live e applicazione su booking page
- Staff photo: campo photo_url in DB ma upload non implementato
- Rate limiter in-memory: si resetta a ogni deploy/restart (sufficiente pre-launch)
