BARBEROS MVP — ROADMAP SVILUPPO

Ultimo aggiornamento: 10 febbraio 2026

---

PANORAMICA FASI

Fase A — Infrastruttura         ✅ COMPLETATA
Fase B — Funzionalità core      ✅ COMPLETATA
Fase C — Automazioni e business  ✅ COMPLETATA
Fase D — Polish e deploy         🔧 IN CORSO

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

FASE C — AUTOMAZIONI E BUSINESS 🔧

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

[x] Calcolo analytics_daily notturno (cron SQL)
    - Funzione SQL calculate_analytics_daily con UPSERT
    - pg_cron: analytics-daily-calc alle 02:05 UTC (03:05 Roma)

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
    - Checkout Session con selezione piano + trial 30 giorni
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

FASE D — POLISH E DEPLOY 🔧

[x] Deploy produzione
    - Vercel collegato (cartella .vercel presente)
    - Server Actions e API routes funzionanti su Vercel
    - Supabase Cloud già attivo per database, auth, edge functions, pg_cron

[x] Subscription gating
    - proxy.ts aggiornato con gating sulle route /dashboard/*
    - Se subscription_status non è active/trialing/past_due → redirect a /dashboard/expired
    - Pagina /dashboard/expired con ExpiredView component
    - Settings e expired page esenti dal gating (per permettere riattivazione)

[ ] Dominio + Infrastruttura
    - Acquisto dominio
    - DNS Cloudflare + CDN + SSL/TLS
    - Configurare webhook Stripe live (richiede URL pubblica)
    - Aggiornare NEXT_PUBLIC_APP_URL con dominio produzione

[ ] Test flussi end-to-end
    - Registrazione → onboarding → creazione servizi/staff
    - Prenotazione online → conferma smart → completamento → review
    - Walk-in → completamento
    - Cancellazione → notifica waitlist
    - No-show → incremento contatore → tag automatico
    - Checkout piano → pagamento → webhook → status active
    - Subscription expired → gating → riattivazione

[ ] PWA con Serwist
    - Service worker per offline caching
    - Web app manifest
    - Installabilità su mobile
    - Push notifications (futuro)

[ ] Performance
    - Analisi bundle size
    - Lazy loading componenti pesanti
    - Ottimizzazione immagini (logo barberia)
    - Prefetch route frequenti

[ ] Monitoring
    - Sentry per error tracking
    - Vercel Analytics per Core Web Vitals
    - Configurazione dominio personalizzato su Vercel

[ ] Sicurezza finale
    - Audit RLS policies
    - Rate limiting su API
    - CORS configuration
    - CSP headers
    - Sanitizzazione input

---

DECISIONI TECNICHE PRESE

1. Next.js 16 invece di 15
   - create-next-app@latest ha installato v16 automaticamente
   - Middleware deprecato (warning "use proxy"), funziona ancora
   - Da migrare a proxy convention in futuro

2. Supabase client (JS) per query invece di Drizzle ORM per le query runtime
   - Drizzle usato per schema-as-code e migrazioni
   - Supabase JS usato per query runtime (beneficia di RLS automatico)
   - Il db Drizzle connection (src/db/index.ts) è pronto per query complesse future

3. WhatsApp dual-mode (Twilio + mock)
   - Se TWILIO_* configurate → invio reale via Twilio API
   - Altrimenti → mock con console.log dettagliato (sviluppo locale)
   - Stessa interfaccia sendWhatsAppMessage() in entrambi i casi
   - Webhook /api/whatsapp/webhook per risposte in ingresso (ANNULLA, SI)

4. Server Actions + 1 API Route
   - Tutte le mutazioni autenticate sono Server Actions ("use server")
   - Unica eccezione: /api/whatsapp/webhook (POST da Twilio, non autenticato via Supabase)
   - Webhook usa Supabase admin client (service role key) per bypassare RLS
   - Beneficio: type-safety end-to-end, nessuna serializzazione manuale

5. Tailwind CSS puro senza shadcn/ui
   - Componenti custom per pieno controllo
   - shadcn/ui previsto nello stack ma non ancora integrato
   - Lucide React per le icone (stesso set di shadcn)

6. Template messaggi: default hardcoded + personalizzazione DB
   - src/lib/templates.ts contiene i default italiani
   - Il barbiere può personalizzare via UI settings → salvati su message_templates
   - Il codice usa prima il template DB, poi fallback al default

---

DEBITO TECNICO NOTO

- date-fns importato nel booking wizard ma slot calculation in lib/slots.ts non usato dal calendario
- Nessun test automatico
- Nessuna validazione Zod sugli input delle Server Actions (Zod installato ma non usato)
- window.location.reload() usato dopo create/update in alcuni componenti (da sostituire con router.refresh())
- Booking wizard non verifica conflitti con appuntamenti esistenti (solo slot basati su orari staff)
- settings-manager.tsx è 811 righe — potrebbe essere spezzato in sotto-componenti
- Drag and drop per spostare appuntamenti non implementato (previsto nella scheda tecnica)
- Logo e colori brand: campi in DB ma non usati nella pagina booking
- Staff photo: campo photo_url in DB ma upload non implementato
