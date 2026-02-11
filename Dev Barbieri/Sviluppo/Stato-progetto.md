BARBEROS MVP — STATO DEL PROGETTO

Ultimo aggiornamento: 11 febbraio 2026 (notte)

---

FASE A — COMPLETATA ✅

Infrastruttura, database, autenticazione, layout base.

1. Progetto Supabase creato via MCP
   - Project ID: wvxkxutaasrblbdmhsny
   - Regione: eu-central-1 (Francoforte)
   - Organizzazione: Progetti futuri
   - Database: PostgreSQL 17.6
   - Stato: ACTIVE_HEALTHY
   - Costo: $10/mese

2. Scaffold Next.js
   - Next.js 16.1.6 con App Router e Turbopack
   - React 19.2.3 con React Compiler
   - TypeScript 5.9.3 in strict mode
   - Tailwind CSS v4.1.18
   - Biome 2.3.14 (sostituto di ESLint + Prettier)
   - pnpm 10.29.2 come package manager

3. Database migrato
   - 12 tabelle create con tutti gli enums, indici e foreign keys
   - RLS abilitato su ogni tabella con policy per isolamento business_id
   - Funzione helper get_user_business_id() con search_path fissato
   - Trigger on_auth_user_created per auto-creazione business alla registrazione
   - Policy pubbliche per booking anonimo (clients + appointments INSERT)
   - Security advisors risolti (3 warning → 0)

4. Autenticazione Supabase
   - Login con email + password
   - Login con magic link via email
   - Callback route per OAuth/magic link
   - Middleware Next.js per protezione route (redirect a /login se non autenticato)
   - Sessione persistente con JWT refresh automatico

5. Layout dashboard
   - Sidebar responsive con navigazione a 8 sezioni
   - Mobile: hamburger menu con overlay
   - Desktop: sidebar fissa 256px
   - Logout con invalidazione sessione
   - Logo SVG custom (src/components/shared/barberos-logo.tsx)

---

FASE B — COMPLETATA ✅

Calendario interattivo, CRUD servizi, CRUD staff, CRM clienti.

1. Calendario interattivo (/dashboard)
   - Vista giornaliera: timeline oraria (07:00-21:00) con colonne per barbiere
   - Vista settimanale: griglia 7 giorni con card compatte
   - Navigazione: prev/next giorno o settimana, bottone "Oggi", toggle Giorno/Settimana
   - Appuntamenti posizionati come blocchi colorati nella timeline
   - 5 stati con colori distinti: Prenotato (blu), Confermato (verde), Completato (grigio), Cancellato (rosso barrato), No-show (arancione)
   - Current time indicator: linea rossa per l'ora corrente
   - Walk-in dialog: form modale per aggiungere clienti walk-in (nome, telefono, servizio, barbiere, ora)
   - Appointment sheet: pannello dettaglio con info cliente, servizio, prezzo, telefono cliccabile
   - Azioni rapide: Conferma, Completato, No-show, Cancella (con aggiornamento stato e revalidazione)
   - Data fetching server-side con Promise.all per appuntamenti + staff + servizi

2. CRUD Servizi (/dashboard/services)
   - Lista servizi con nome, durata (minuti), prezzo (€), badge combo/disattivato
   - Creazione servizio: form inline con nome, durata (dropdown), prezzo
   - Modifica servizio: form inline con valori precompilati
   - Durate predefinite obbligatorie: 15, 30, 45, 60, 75, 90, 105, 120 minuti (ALLOWED_DURATIONS)
     - UI: select dropdown (non input numerico libero) per evitare durate arbitrarie
     - Validazione Zod server-side: rifiuta qualsiasi durata non nell'elenco
     - Garantisce compatibilità con la griglia slot a 15 minuti del booking
   - Toggle attiva/disattiva senza eliminare (soft disable)
   - Eliminazione con conferma dialog
   - Contatore servizi totali nell'header

3. CRUD Staff (/dashboard/staff)
   - Lista barbieri con avatar iniziale, stato attivo/disattivo
   - Creazione barbiere con nome (orari di default precompilati: lun-ven 09:00-19:00, sab 09:00-17:00, dom chiuso)
   - Modifica nome inline con salvataggio
   - Editor orari di lavoro: pannello espandibile per ogni barbiere con 7 giorni, toggle aperto/chiuso, ora inizio e fine per ogni giorno
   - Salvataggio orari separato con feedback "Salvato!"
   - Associazione servizi per barbiere: pannello "Servizi" espandibile con checkbox per ogni servizio attivo
     - Se nessun barbiere ha servizi associati → tutti i barbieri appaiono per ogni servizio (fallback)
     - Se almeno un barbiere ha servizi configurati → nel booking appare solo chi ha quel servizio associato
     - Tabella ponte staff_services (many-to-many) con server action updateStaffServices
   - Toggle attiva/disattiva barbiere
   - Eliminazione con conferma dialog e avviso appuntamenti
   - Drag & drop per riordinare i barbieri (reorderStaff server action)

4. CRM Clienti (/dashboard/clients)
   - Lista clienti ordinata per ultima visita
   - Ricerca per nome o telefono (filtro client-side istantaneo)
   - Creazione manuale: nome, cognome, telefono, email, note
   - Scheda cliente espandibile con:
     - Stats: visite totali, no-show count, ultima visita, email
     - Tag: VIP, Nuovo, Problematico, Alto rischio no-show (toggle click, salvati su DB)
     - Note: textarea con salvataggio automatico on blur
   - Badge alert arancione per clienti con 2+ no-show
   - Contatore clienti totali nell'header
   - Empty state differenziato per lista vuota vs ricerca senza risultati

---

FASE C — COMPLETATA ✅

Automazioni WhatsApp, impostazioni, webhook, billing.

1. Impostazioni barberia (/dashboard/settings) ✅
   - Sezioni collassabili con icone (accordion pattern)
   - Dati barberia: nome, indirizzo, telefono, link Google Review, slug prenotazione
   - Orari di apertura: 7 giorni, toggle aperto/chiuso, ora apertura e chiusura
   - Nota informativa: orari determinano slot disponibili nella pagina booking
   - Sezione WhatsApp: stato connessione (live vs mock), guida setup per sviluppatore
   - Template messaggi WhatsApp: 7 template personalizzabili con variabili ({{client_name}}, ecc.)
   - Editor template: textarea, toggle attivo/disattivo, ripristina default, salva
   - Recensioni Google: istruzioni per trovare il link, stato configurazione
   - Regole automatiche: soglia cliente dormiente (giorni), soglia no-show (numero)
   - Tutte le sezioni con SaveButton e feedback "Salvato!" temporaneo

2. Integrazione WhatsApp Twilio ✅
   - Modulo src/lib/whatsapp.ts: dual-mode (live Twilio vs mock console.log)
   - isWhatsAppEnabled(): check automatico variabili ambiente
   - sendWhatsAppMessage(): normalizzazione numeri (whatsapp:+...), error handling
   - renderTemplate(): sostituzione variabili {{...}} nei template
   - Se TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_FROM configurate → invio reale
   - Altrimenti → mock con log dettagliato in console (sviluppo locale)

3. Template messaggi (src/lib/templates.ts) ✅
   - 7 tipi: confirmation, reminder_24h, reminder_2h, cancellation, review_request, reactivation, waitlist_notify
   - Testi italiani con variabili placeholder
   - DEFAULT_TEMPLATES, TEMPLATE_LABELS, TEMPLATE_DESCRIPTIONS
   - Personalizzabili dal barbiere tramite UI settings
   - Salvati su DB (message_templates) con upsert per business

4. Webhook WhatsApp (/api/whatsapp/webhook) ✅
   - Endpoint POST per messaggi in ingresso da Twilio
   - Validazione firma Twilio in produzione (x-twilio-signature)
   - Supabase admin client (bypassa RLS con service role key)
   - Comando "ANNULLA": trova cliente per telefono → cancella prossimo appuntamento → notifica waitlist
   - Comando "SI"/"SÌ": conferma prenotazione dalla waitlist → conflict check su tutti gli staff → crea appuntamento → conferma WhatsApp → aggiorna waitlist (o notifica slot non disponibile)
   - Notifica waitlist automatica: su cancellazione, notifica primo in coda con messaggio WhatsApp
   - Risposta TwiML vuota per evitare loop

5. Server Actions business.ts (refactored) ✅
   - getCurrentBusiness(): fetch dati barberia dell'utente autenticato
   - updateBusinessInfo(): aggiorna nome, indirizzo, telefono, link Google
   - updateBusinessOpeningHours(): aggiorna orari apertura (jsonb)
   - updateBusinessThresholds(): aggiorna soglie dormiente e no-show
   - getMessageTemplates(): fetch template personalizzati per business
   - upsertMessageTemplate(): crea o aggiorna template messaggio per tipo

6. Bug fix sessione precedente ✅
   - Prezzi servizi: form defaultValue concatenava invece di sostituire (15+25=1525)
     Fix: defaultValue solo in edit, placeholder in create + DB corretto
   - Walk-in ora fine: addMinutesToTime overflow (53:30)
     Fix: Math.min(total, 23*60+59) + DB duration corretto
   - total_visits: updateAppointmentStatus settava undefined
     Fix: ora legge valore attuale e incrementa di 1

7. Sistema Conferma Intelligente (pg_cron + Edge Functions) ✅
   Architettura: pg_cron schedula → pg_net chiama Edge Function → SQL helper + Twilio WhatsApp

   Flusso smart per ogni appuntamento:
   a) Richiesta conferma (timing basato sull'orario appuntamento):
      - Appuntamento pomeriggio (≥14:00): messaggio sera prima alle 20:00
      - Appuntamento tarda mattina (10:00-13:59): messaggio sera prima alle 20:00
      - Appuntamento mattina presto (<10:00): messaggio giorno prima alle 12:00
   b) Secondo reminder (se non risponde):
      - Pomeriggio: mattina stessa alle 08:00
      - Tarda mattina: mattina stessa alle 07:30
      - Mattina presto: sera prima alle 20:00
   c) Auto-cancellazione (se non conferma):
      - Pomeriggio: ore 12:00 stesso giorno → slot liberato → notifica waitlist
      - Tarda mattina: ore 09:00 stesso giorno
      - Mattina presto: ore 22:00 sera prima
   d) Pre-appuntamento (~2h prima, solo confermati):
      - "Ci vediamo tra poco! Presentati a [indirizzo]"

   Comandi WhatsApp (gestiti dal webhook):
   - CONFERMA → booked → confirmed, risposta "Perfetto! Ci vediamo presto!"
   - CANCELLA / ANNULLA → cancella appuntamento, notifica waitlist, risposta con link booking
   - CAMBIA ORARIO → invia link prenotazione per riprogrammare
   - SI → conferma prenotazione dalla waitlist
   - Qualsiasi altro testo → risposta con lista comandi disponibili

   SQL Helper Functions (6):
   - find_appointments_needing_confirm_request() — timing smart basato su orario
   - find_appointments_needing_confirm_reminder() — secondo avviso non confermati
   - auto_cancel_unconfirmed() — cancella + restituisce dettagli per notifica
   - find_confirmed_needing_pre_reminder() — confermati ~2h prima
   - find_review_appointments(hours_min, hours_max) — completati con Google review link
   - find_dormant_clients(min_days_since_last_msg) — clienti inattivi > soglia

   Edge Functions deployate su Supabase (6 attive, tutte ACTIVE):
   - confirmation-request: ogni 30min → richiesta conferma (timing smart)
   - confirmation-reminder: ogni 30min → secondo avviso non confermati
   - auto-cancel: ogni 30min → cancella non confermati alla deadline
   - pre-appointment: ogni 30min → "ci vediamo!" per confermati
   - review-request: ogni ora (:15) → richiesta recensione Google
   - reactivation: 1x/giorno (11:00 Roma) → clienti dormienti

   Cron Schedules attivi (6):
   - confirmation-request: */30 * * * * → pg_net → Edge Function
   - confirmation-reminder: */30 * * * * → pg_net → Edge Function
   - auto-cancel: */30 * * * * → pg_net → Edge Function
   - pre-appointment: */30 * * * * → pg_net → Edge Function
   - review-request: 15 * * * * → pg_net → Edge Function
   - reactivation: 0 10 * * * → pg_net → Edge Function

   Template messaggi aggiornati (8 tipi):
   - confirmation, confirm_request, confirm_reminder, pre_appointment
   - cancellation, review_request, reactivation, waitlist_notify
   - Ogni messaggio include comandi disponibili (CONFERMA, CANCELLA, CAMBIA ORARIO)
   - Personalizzabili dal barbiere tramite Settings

   Caratteristiche:
   - Timing intelligente: orario invio basato sull'ora dell'appuntamento
   - Anti-spam: max 2 messaggi per appuntamento (richiesta + reminder) + 1 pre-appuntamento
   - Slot liberation: auto-cancel libera slot e notifica primo in waitlist
   - Deduplicazione: SQL verifica NOT EXISTS su messages per tipo
   - Dual-mode WhatsApp: Twilio live o mock console.log
   - Timezone-aware: AT TIME ZONE con timezone business
   - Idempotenti: chiamate multiple non producono duplicati

8. Badge Conferma nel Calendario ✅
   - CalendarAppointment arricchito con confirmationStatus e confirmRequestSentAt
   - Query batch su tabella messages (confirm_request/confirm_reminder) per appointment_id
   - Pallino 🟡 pulsante sulla card se status="pending" (attesa conferma)
   - Pallino 🔴 sulla card se status="auto_cancelled" (non confermato via WhatsApp) — distingue cancellazioni manuali da automatiche
   - AppointmentSheet mostra sezione "Stato conferma WhatsApp":
     - "In attesa di conferma WhatsApp" (amber, con timestamp invio)
     - "Confermato via WhatsApp" (emerald)
     - "Il cliente non ha confermato via WhatsApp entro il termine previsto — cancellato automaticamente" (red, messaggio esplicativo)

9. Waitlist UI Funzionale ✅
   - Server actions: getWaitlistEntries(), removeWaitlistEntry(), expireOldEntries(), addToWaitlist(), addToWaitlistPublic(), getWaitlistCountsByDate()
   - Componente WaitlistManager con:
     - Filtro per stato (tutti, in attesa, notificato, convertito, scaduto)
     - Ricerca per nome, telefono, servizio
     - Badge colorati per stato (🟡 In attesa, 🔔 Notificato, ✅ Convertito, ⏰ Scaduto)
     - Azione rimuovi entry, pulsante "Scaduti" per bulk-expire
   - Pagina /dashboard/waitlist funzionale (sostituito placeholder)
   - Validazione date: Zod .refine() server-side + check client-side per rifiutare date passate
   - Auto-add dal booking pubblico: quando nessun slot disponibile, il cliente può iscriversi alla lista d'attesa direttamente dalla pagina /book/[slug] (addToWaitlistPublic, no auth, find-or-create client per telefono)
   - Badge calendario: banner blu nella vista giornaliera quando ci sono clienti in waitlist per la data visualizzata (getWaitlistCountsByDate)

10. Tag Automatici Clienti ✅
    - Nuovi tag disponibili: "Affidabile" (emerald), "Non conferma" (arancione)
    - Auto-tag su conferma WhatsApp (CONFERMA): ≥3 conferme → tag "Affidabile"
    - Auto-tag su cancellazione (CANCELLA/auto-cancel): ≥2 cancellazioni → tag "Non conferma"
    - Tags mutuamente esclusivi: aggiungere uno rimuove l'altro
    - Logica nel webhook (/api/whatsapp/webhook)

11. Fix Schema Drizzle ✅
    - messageTypeEnum aggiornato: rimossi reminder_24h/reminder_2h, aggiunti confirm_request/confirm_reminder/pre_appointment
    - settings-manager.tsx aggiornato con nuovi template types + variabile {{deadline}}

12. Calcolo Analytics Daily (Cron SQL) ✅
    - Funzione SQL calculate_analytics_daily(target_date): per ogni business calcola revenue, completati, cancellati, no-show, nuovi clienti, ricorrenti
    - UPSERT su analytics_daily (ON CONFLICT update)
    - pg_cron schedule: analytics-daily-calc, ogni notte alle 02:05 UTC (03:05 Roma)
    - Calcolo giorno precedente (CURRENT_DATE - 1)

13. Analytics Dashboard UI ✅
    - Server actions: getAnalyticsSummary(period), getAnalyticsDaily(start, end), getTopServices(period)
    - Selector periodo: 7 giorni / 30 giorni / 90 giorni
    - 4 KPI cards: Fatturato, Completati, No-show rate, Nuovi clienti (con delta % vs periodo precedente)
    - Grafico fatturato giornaliero (barre blu con tooltip)
    - Grafico appuntamenti giornaliero (stacked: completati verde, cancellati rosso, no-show amber)
    - Tabella servizi più richiesti con progress bar e revenue
    - Empty state descrittivo: "Nessun appuntamento completato negli ultimi X giorni" + hint su quando appariranno i dati
    - Breakdown clienti nuovi vs ricorrenti con barra proporzionale

14. Chiusure Straordinarie ✅
    - Tabella business_closures: id, business_id, date, reason, created_at (con RLS)
    - Schema Drizzle: businessClosures + relazione con businesses
    - Server actions: getClosures(), getClosureDates(businessId), addClosure(), removeClosure()
    - Sezione in Settings: "Chiusure straordinarie" con date picker, motivo, lista prossime chiusure, rimozione
    - Integrazione Booking Wizard: date di chiusura disabilitate nel selettore date
    - Integrazione Calendario: banner arancione "Chiusura straordinaria" quando si visualizza un giorno chiuso

15. Stripe Billing — Multi-Piano ✅
    - 3 prodotti Stripe:
      - BarberOS Essential (prod_TwyoUI0JLvWcj3) → €300/mese (price_1Sz4yuK75hVrlrva5iqHgE52)
      - BarberOS Professional (prod_TwypWo5jLd3doz) → €500/mese (price_1Sz4yvK75hVrlrvaemSc8lLf)
      - BarberOS Enterprise (prod_TwyphvT1F82GrB) → prezzo custom (gestito manualmente)
    - Vecchio prodotto "Barberos Pro" (prod_TwyPNdkh0a8xAT) deprecato
    - Trial: 7 giorni gratuiti (configurabile in STRIPE_CONFIG.trialDays)
    - Codici promozionali/coupon abilitati in Checkout (allow_promotion_codes: true)
    - stripe@20.3.1 installato, API version 2026-01-28.clover
    - src/lib/stripe.ts: Stripe server client + PLANS config (3 piani con features, prezzi, product/price IDs)
    - src/actions/billing.ts: 3 server actions
      - createCheckoutSession(planId): crea/ensure Stripe Customer + Checkout Session per piano scelto
      - createPortalSession(): redirect a Stripe Customer Portal per self-service
      - getSubscriptionInfo(): legge status + piano attivo da Stripe API, fallback a DB
    - src/app/api/stripe/webhook/route.ts: webhook handler
      - Verifica firma Stripe (STRIPE_WEBHOOK_SECRET)
      - Supabase admin client (service role, bypassa RLS)
      - Eventi gestiti: subscription.created/updated/deleted, invoice.paid/failed
      - mapStatus(): mappa stati Stripe → enum DB (active, past_due, cancelled, trialing, incomplete)
    - Sezione "Abbonamento" in Settings:
      - Banner stato colorato (emerald/blue/amber/red per active/trial/past_due/cancelled)
      - 3 card piani con features, prezzo, badge "Consigliato" su Professional
      - Enterprise: pulsante "Contattaci" via email
      - Pulsante "Gestisci abbonamento" → Stripe Customer Portal (per abbonati attivi)
      - Info trial con durata e data scadenza
      - Nota contratto 12 mesi + garanzia risultati
    - proxy.ts aggiornato: /api/stripe/ come path pubblico
    - scripts/setup-stripe.ts: crea prezzi ricorrenti per Essential e Professional
    - Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ESSENTIAL, STRIPE_PRICE_PROFESSIONAL

---

FASE D — IN CORSO 🔧

Polish, deploy, sicurezza, personalizzazione, PWA, performance.

1. Deploy Vercel ✅
   - Progetto collegato a Vercel (cartella .vercel presente)
   - Server Actions e API routes funzionanti su Vercel
   - Supabase Cloud già attivo per database, auth, edge functions, pg_cron

2. Subscription Gating ✅
   - proxy.ts aggiornato con gating sulle route /dashboard/*
   - Se subscription_status non è active/trialing/past_due → redirect a /dashboard/expired
   - Pagina /dashboard/expired con ExpiredView component (info piano + link settings)
   - Settings e expired page esenti dal gating (per permettere riattivazione)

3. Validazione Zod su Server Actions ✅
   - Zod 4.3.6 (import da "zod/v4") aggiunto a tutti e 9 i moduli in src/actions/
   - Schema Zod per ogni input utente: UUID, date (YYYY-MM-DD), orari (HH:MM), enum, stringhe obbligatorie, numeri, record, array
   - z.safeParse() come prima riga di ogni action, PRIMA di qualsiasi query Supabase
   - In caso di errore: return { error: "messaggio in italiano" } — nessuna eccezione lanciata
   - Funzioni getter senza parametri utente (getClients, getStaff, ecc.) non modificate
   - FormData: estrazione valori → validazione Zod → destructuring dati validati
   - Logica di business invariata, solo validazione in entrata aggiunta
   - typecheck (tsc --noEmit) e lint (biome check) passano senza errori

4. Prevenzione Doppie Prenotazioni ✅
   - Server action getStaffBookedSlots(): query pubblica (no auth) che restituisce gli slot occupati per staff+data
   - Booking wizard: useEffect fetcha slot occupati quando staff/data cambiano → generateTimeSlots filtra slot in conflitto
   - Walk-in dialog: riceve appointments dal calendario → warning arancione se orario selezionato confligge
   - Server-side conflict check in bookAppointment(): query overlap prima di INSERT, rifiuta con errore "Questo orario non è più disponibile"
   - Server-side conflict check in addWalkIn(): stessa logica, rifiuta con errore "Conflitto: il barbiere ha già un appuntamento in questo orario"
   - Blocco slot passati: per la data odierna, il booking wizard nasconde gli slot con orario ≤ ora attuale; bookAppointment() rifiuta server-side se data+ora nel passato (errore: "Non è possibile prenotare un appuntamento nel passato.")
   - Difesa a 5 livelli: (1) slot passati nascosti nel wizard, (2) slot occupati nascosti nel wizard, (3) warning visivo nel walk-in, (4) reject server-side per slot passato o race condition, (5) conflict check nel flusso waitlist (comando SI via WhatsApp)
   - hasConflict() usa query SQL con .lt("start_time", endTime).gt("end_time", startTime) per overlap detection
   - hasConflictAdmin() replica la stessa logica con AdminClient per il webhook WhatsApp (waitlist → appuntamento)

5. UI Polish: shadcn/ui + Dark Mode ✅
   - shadcn/ui integrato con 17 componenti Radix-based (button, card, dialog, dropdown-menu, input, label, popover, select, separator, sheet, skeleton, sonner, table, tabs, tooltip, avatar, badge)
   - Dark mode con next-themes ^0.4.6: ThemeProvider in layout.tsx, defaultTheme="dark"
   - Sonner ^2.0.7 per toast notifications
   - Motion (Framer Motion) ^12.34.0 per animazioni
   - tw-animate-css ^1.4.0 per animazioni Tailwind
   - radix-ui ^1.4.3 come primitivi UI headless
   - components.json configurato per shadcn/ui CLI

6. Vercel Analytics ✅
   - @vercel/analytics ^1.6.1 + @vercel/speed-insights ^1.3.1 installati
   - <Analytics /> e <SpeedInsights /> in layout.tsx
   - Page views e Core Web Vitals raccolti automaticamente

7. Rate Limiting ✅
   - src/lib/rate-limit.ts: rate limiter in-memory per API routes
   - Sliding window con cleanup automatico ogni 5 minuti
   - checkRateLimit(ip, maxRequests, windowMs) + getClientIp(headers)
   - Usato per protezione webhook da abuso

8. Test Manuali E2E ✅
   - Checklist strutturata creata: Dev Barbieri/Testing/test-checklist.md
   - 126 test cases in 16 sezioni (Auth, Onboarding, Booking, Conferma Smart, Calendario, Walk-in, Cancellazione, No-Show, Waitlist, CRM, Billing, Subscription Gating, Settings, Analytics, Edge Functions, Responsiveness)
   - Tabella riepilogo pass/fail + bug log con severità

9. Esecuzione Test E2E ✅
   - Risultati: 108 ✅ Pass, 6 ❌ Fail, 12 ⏭️ Skip
   - Pass rate: 85.7% totale, 94.7% escludendo test che richiedono Supabase/Twilio live
   - 13 bug identificati in 2 giri (1 critico, 3 medi, 5 bassi + 4 secondo giro)
   - 8 bug fixati (4 primo giro + 3 secondo giro + 1 fix successivo):
     a) CRITICO: webhook WhatsApp bloccato dal proxy (mancava /api/whatsapp nei path pubblici)
     b) MEDIO: cancellazione da calendario non notificava la waitlist
     c) BASSO: campo cognome mancante nel booking wizard
     d) BASSO: bottoni azione appointment sheet senza type="button"
     e) MEDIO: slot no-show non liberati per rebooking (hasConflict escludeva solo cancelled)
     f) MEDIO: booking wizard ignorava orari di apertura della business
     g) BASSO: import dinamici ridondanti in notifyWaitlistOnCancel
     h) MEDIO: comando SI waitlist senza conflict check — ora itera tutti gli staff, verifica disponibilita', invia conferma/rifiuto WhatsApp
   - 5 feature gap identificati e successivamente implementati (vedi punto 12)
   - typecheck + build verificati dopo i fix

9. Sicurezza Pre-Lancio ✅
   - Security headers in next.config.ts:
     - Content-Security-Policy: self + Supabase + Stripe.js + Vercel Analytics, frame-ancestors 'none', object-src 'none'
     - X-Frame-Options: DENY
     - X-Content-Type-Options: nosniff
     - Referrer-Policy: strict-origin-when-cross-origin
     - Permissions-Policy: camera=(), microphone=(), geolocation=()
     - Strict-Transport-Security: max-age=31536000; includeSubDomains
   - CORS webhook: verificato che /api/stripe/webhook e /api/whatsapp/webhook non espongono Access-Control-Allow-Origin: *. Solo POST con verifica firma (Stripe signature / Twilio x-twilio-signature)
   - Audit RLS Supabase (security): Leaked Password Protection ABILITATA (HaveIBeenPwned.org) — WARN risolto
   - Audit RLS Supabase (performance): tutti i WARN risolti:
     - auth_rls_initplan: auth.uid() wrappato in (select auth.uid()) su businesses e business_closures
     - unindexed_foreign_keys: 7 indici FK aggiunti (appointments.client_id, appointments.service_id, messages.appointment_id, messages.client_id, staff_services.service_id, waitlist.client_id, waitlist.service_id)
     - multiple_permissive_policies: consolidate policy SELECT/INSERT duplicate su services, staff, staff_services, appointments, businesses, clients
   - WhatsApp sanitizzazione: renderTemplate() in src/lib/whatsapp.ts usa solo regex {{key}} → string replace (single-pass). Nessun contesto HTML/SQL. Sicuro
   - typecheck (tsc --noEmit): passa senza errori

10. Test Automatici Vitest ✅
   - Framework: Vitest 4.0.18 con path alias @/* (vitest.config.ts)
   - Script: pnpm test (run), pnpm test:watch (watch mode)
   - 139 unit test in 7 file sotto src/lib/__tests__/:
     - time-utils.test.ts (24): addMinutesToTime, timeToMinutes, minutesToTop, minutesToHeight, formatPrice
     - whatsapp.test.ts (8): renderTemplate (sostituzione, injection prevention)
     - rate-limit.test.ts (11): checkRateLimit, getClientIp
     - slots.test.ts (11): getAvailableSlots (pause, conflitti, boundary)
     - stripe-utils.test.ts (11): mapStatus (tutti gli stati Stripe → DB enum)
     - validation.test.ts (30): Zod schemas da appointments, services, clients
     - brand-settings.test.ts (44): updateBrandSettingsSchema, hexToOklch, generateBrandCSSVariables, getFontPreset, generateFontCSSVariables
   - Utility deduplicate: addMinutesToTime, formatPrice, timeToMinutes, minutesToTop, minutesToHeight estratte in src/lib/time-utils.ts (prima duplicate in 4 file)
   - mapStatus estratto da webhook route in src/lib/stripe-utils.ts
   - Copertura: SOLO funzioni pure senza dipendenze esterne. NON copre server actions, auth, proxy, webhook E2E, rendering React
   - Risultato: 139/139 pass

11. CI/CD GitHub Actions ✅
   - Workflow: .github/workflows/ci.yml
   - Pipeline: Typecheck → Lint → Test → Build su ogni push/PR a main
   - Stack CI: pnpm 10, Node.js 22, caching dipendenze pnpm
   - Concurrency: cancel-in-progress per evitare build duplicate
   - Env placeholder per build: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
   - Fix lint pre-CI (50 errori risolti):
     - 41 useButtonType: type="button" aggiunto su ~15 componenti (appointment-card, appointment-sheet, calendar-view, walk-in-dialog, sidebar, staff-manager, services-manager, clients-manager, booking-wizard, waitlist-manager, analytics-dashboard, settings-manager)
     - 7 useTemplate: string concat → template literal (analytics.ts, analytics-dashboard.tsx, calendar-view.tsx, waitlist-manager.tsx, settings-manager.tsx, setup-stripe.ts)
     - 2 useOptionalChain: clients-manager.tsx, waitlist-manager.tsx
   - Configurazione Biome aggiornata (biome.json):
     - Schema aggiornato a v2.3.14
     - Regole downgrade a warn (non bloccanti CI): noLabelWithoutControl, noSvgWithoutTitle, noStaticElementInteractions, useKeyWithClickEvents, noArrayIndexKey, noExplicitAny, noUnusedFunctionParameters
     - CSS escluso da Biome (Tailwind v4 usa @theme/@custom-variant non supportati dal parser CSS di Biome)
   - Risultato iniziale: pnpm typecheck ✅, pnpm lint ✅ (0 errori, 43 warning), pnpm build ✅ (17 route)
   - Dopo refactor lint/a11y (vedi punto 12): pnpm lint ✅ (0 errori, 0 warning)

12. Refactor Lint / A11y / Formatting ✅
   - Risolti tutti i 43 warning Biome rimasti dopo il setup CI
   - 26 fix noLabelWithoutControl: aggiunto htmlFor+id a tutti i label/input in 6 componenti (walk-in-dialog, clients-manager, settings-manager, waitlist-manager, services-manager, staff-manager)
   - 3 fix noStaticElementInteractions: backdrop overlay <div onClick> → <button> in appointment-sheet e walk-in-dialog; biome-ignore per drag handle in staff-manager
   - 3 fix noUnusedImports: rimossi Calendar (clients-manager), PanelLeftOpen (sidebar), MapPin (appointment-sheet)
   - 3 fix noUnusedFunctionParameters: prefisso _ su parametri inutilizzati in expired-view, week-view, settings-manager
   - 6 fix noExplicitAny: biome-ignore comments con spiegazione su Supabase admin client e cast dinamici
   - 1 fix noArrayIndexKey: key stabile basata sull'ora in day-view
   - 1 fix useSemanticElements: <div role="button"> → <button> in appointment-sheet
   - ~12 file riformattati per rispettare line width 100 char (ternari, function signatures, label multiline, import ordering)
   - Configurazione biome.json NON modificata (regole restano warn, ma ora 0 warning nel codice)
   - Risultato: pnpm lint ✅ (0 errori, 0 warning), pnpm typecheck ✅, pnpm build ✅, pnpm test ✅ (139/139)

13. Configurazione Servizi Esterni ✅
   Tutte le credenziali e webhook configurati per produzione (dettagli in Guida-credenziali.md):
   
   Vercel (barberos-mvp.vercel.app):
   - 11 variabili d'ambiente configurate (Supabase, Stripe, Twilio, APP_URL)
   - Deploy attivo e funzionante
   
   Stripe:
   - STRIPE_SECRET_KEY (sk_live_...) configurata
   - Webhook "BarberOS Webhook" creato (we_1SzTPcK75hVrlrvaBhwjn63H)
   - URL: https://barberos-mvp.vercel.app/api/stripe/webhook
   - 46 eventi in ascolto (inclusi i 5 critici: subscription.created/updated/deleted, invoice.paid/payment_failed)
   - STRIPE_WEBHOOK_SECRET (whsec_...) configurata
   
   Twilio WhatsApp:
   - Account SID + Auth Token configurati su Vercel
   - Sandbox attiva: numero +1 415 523 8886, codice "join drink-room"
   - Webhook URL configurato: https://barberos-mvp.vercel.app/api/whatsapp/webhook
   - 1 partecipante sandbox: whatsapp:+393667461897
   - Nota: ancora in sandbox mode — per produzione serve registrazione WhatsApp Business Sender (vedi Guida-credenziali.md sezione 10)
   
   Supabase Edge Functions:
   - 3 secrets Twilio aggiunti (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)
   - 7 Edge Functions attive con secrets configurati

14. Personalizza Form (Booking Page Branding) ✅
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

15. PWA con Serwist ✅
   - @serwist/next 9.5.5 + serwist 9.5.5 (devDependency)
   - Service worker: src/sw.ts con precache + defaultCache runtime caching
   - next.config.ts wrappato con withSerwist({ swSrc, swDest, disable in dev })
   - Build: "next build --webpack" (Serwist richiede webpack, Next.js 16 default Turbopack)
   - Dev: resta Turbopack (next dev --turbopack), Serwist disabilitato in dev
   - Web App Manifest: public/manifest.json (name "BarberOS", start_url "/dashboard", display "standalone", theme_color "#09090b", lang "it")
   - Icone PWA: public/icon-192x192.png e public/icon-512x512.png (sfondo zinc-950, logo centrato 80%)
   - layout.tsx: metadata.manifest, metadata.appleWebApp, viewport.themeColor via Next.js Metadata/Viewport exports
   - tsconfig.json: aggiunto "webworker" a lib, "@serwist/next/typings" a types, "public/sw.js" in exclude
   - .gitignore: aggiunto public/sw* e public/swe-worker*
   - Installabile su mobile (Android + iOS) come app standalone

16. Performance Optimization ✅
   - Bundle analyzer: @next/bundle-analyzer ^16.1.6 (devDep, attivo con ANALYZE=true)
   - Lazy loading: 3 componenti pesanti con next/dynamic + Skeleton loading:
     - AnalyticsDashboard (~494 righe) in analytics/page.tsx
     - SettingsManager (~1338 righe) in settings/page.tsx
     - FormCustomizer (~395 righe) in customize/page.tsx
   - next/image: booking page (/book/[slug]) usa <Image> per cover_image_url (fill + priority) e logo_url (64×64)
   - images.remotePatterns: { protocol: "https", hostname: "**" } per qualsiasi dominio HTTPS (URL utente)
   - CSP img-src: aggiunto "https:" per coprire domini esterni
   - Prefetch: sidebar usa next/link (auto-prefetch abilitato di default)
   - Dettagli completi: Dev Barbieri/Performance/Ottimizzazioni.md

17. Sistema Referral ✅
   - Modello: referrer guadagna €50 credito Stripe per ogni barbiere invitato che si abbona; invitato riceve 20% sconto primo mese
   - Database: tabella referrals (id, referrer_business_id, referred_business_id, status enum pending/converted/rewarded/expired, reward_amount_cents, stripe_credit_id, converted_at, rewarded_at, created_at) + colonne referral_code/referred_by su businesses
   - Migrazioni Supabase: referral_system (tabella + colonne + RLS + indici + codici generati per business esistenti) + referral_trigger_update (trigger on_auth_user_created aggiornato per generare referral_code e creare record referral)
   - Schema Drizzle: referralStatusEnum, colonne referralCode/referredBy su businesses, tabella referrals con relazioni
   - Server actions (src/actions/referral.ts): getReferralInfo(), getReferrals(), validateReferralCode() con validazione Zod
   - Pagina /dashboard/referral: Server Component + Client Component referral-dashboard.tsx
     - 3 KPI cards (invitati totali, convertiti, crediti guadagnati)
     - Codice referral copiabile + link condivisibile + share WhatsApp
     - Sezione "Come funziona" con 3 step + breakdown esplicito premi per entrambe le parti
     - Tabella referral con badge stato, descrizione, data registrazione, data aggiornamento, credito
     - Empty state + fine print
   - Sidebar: nuova sezione "Crescita" con voce "Referral" (icona Gift)
   - Integrazione /register?ref=CODICE: legge query param, valida codice, mostra badge "Invitato da X — 20% di sconto!", passa codice nei metadata signUp
   - Integrazione Stripe webhook: processReferralReward() su invoice.paid applica €50 credito via stripe.customers.createBalanceTransaction() al referrer
   - Trigger SQL aggiornato: genera referral_code per nuove business, salva referred_by, crea record referrals con status 'pending'
   - typecheck ✅, test 139/139 ✅, build 19 route ✅, lint 0 errori ✅

18. Feature Gating per Piano ✅
   Differenziazione funzionalità tra Essential, Professional, Enterprise.

   Architettura:
   - src/lib/plan-limits.ts: definizione centralizzata limiti e feature flags per piano
   - src/actions/billing.ts: getPlanLimits() server action — legge piano attivo da Stripe e restituisce limiti
   - Fix trial: se DB dice "trialing", restituisce TRIAL_LIMITS (Professional-level) senza passare da Stripe
   - Colonna subscription_plan su businesses (migration add_subscription_plan) — salvata dal webhook Stripe
   - Webhook Stripe aggiornato: detectPlanFromSubscription() salva plan ID su subscription.created/updated/deleted
   - Schema Drizzle aggiornato: subscriptionPlan su businesses

   Limiti per piano:
   - Essential (€300/mese): max 2 barbieri
   - Professional (€500/mese): max 5 barbieri
   - Enterprise (custom): illimitato
   - Trial: accesso Professional completo (maxStaff: 5, tutte le feature)

   Cosa è uguale per tutti i piani:
   - Servizi: illimitati (nessun gate)
   - Analytics: completi per tutti (fatturato, appuntamenti, no-show, nuovi clienti, grafici, top servizi)
   - Personalizzazione: completa per tutti (colori, logo, font, copertina)
   - WhatsApp base: conferma, 2 reminder, notifica pre-appuntamento 2h prima
   - WhatsApp auto-cancel: cancellazione automatica se il cliente non conferma (tutti i piani)
   - Lista d'attesa: notifica automatica su cancellazione (tutti i piani)
   - Chiusure straordinarie, CRM clienti, prenotazione online

   Gate Staff:
   - Server-side: createStaffMember() verifica count vs maxStaff
   - UI: banner amber con Crown icon quando limite raggiunto, bottone "Nuovo" disabilitato
   - Errore italiano: "Hai raggiunto il limite di N barbieri per il tuo piano."

   Gate WhatsApp Avanzato (solo Professional/Enterprise):
   - Riattivazione clienti dormienti (find_dormant_clients SQL + Edge Function reactivation)
   - Richiesta recensione Google dopo appuntamento (find_review_appointments SQL + Edge Function review-request)
   - Tag automatici clienti: "Affidabile" (≥3 conferme) / "Non conferma" (≥2 auto-cancel)
   - Implementazione: SQL functions filtrano per subscription_plan — skip essential
   - Auto-tag (webhook WhatsApp): check subscription_plan prima di eseguire tagging
   - Migration auto_cancel_all_plans: rimosso filtro piano da auto_cancel_unconfirmed (ora gira per tutti)

   Feature list in stripe-plans.ts:
   - Essential: 11 feature elencate (incluso auto-cancel e lista d'attesa automatica)
   - Professional: 7 feature ("Tutto Essential +" + 5 barbieri + 3 WhatsApp avanzati + tag + supporto)
   - Enterprise: 6 feature ("Tutto Professional +" + illimitato + dedicato + multi-sede)

   File principali:
   - src/lib/plan-limits.ts (PlanLimits, PLAN_LIMITS, TRIAL_LIMITS, getPlanLimitsForPlan)
   - src/lib/stripe-plans.ts (PLANS con features reali e descrittive)
   - src/actions/billing.ts (getPlanLimits con fix trial)
   - src/actions/staff.ts (limit check maxStaff)
   - src/components/staff/staff-manager.tsx (maxStaff prop, banner)
   - src/app/(dashboard)/dashboard/staff/page.tsx (passa maxStaff da getPlanLimits)
   - 3 migrazioni Supabase: add_subscription_plan, gate_edge_functions_by_plan, auto_cancel_all_plans

   typecheck ✅, test 139/139 ✅, lint ✅

19. Pagina ROI & Vantaggi ✅
   Pagina interattiva per mostrare al barbiere il ritorno sull'investimento e tutti i vantaggi di BarberOS.

   Route: /dashboard/roi
   Sidebar: sezione "Crescita" → "ROI & Vantaggi" (icona TrendingUp) + "Referral" (icona Gift)

   Simulatore ROI interattivo:
   - 5 slider con CSS custom (filled track, thumb con hover scale, dark mode):
     - Poltrone/Barbieri (1-10)
     - Scontrino medio (€10-80)
     - Appuntamenti al giorno (4-40)
     - Tasso no-show attuale (0-40%)
     - Giorni lavorativi/mese (16-28)
   - 4 risultati calcolati in tempo reale:
     - No-show eliminati (70% riduzione)
     - Slot recuperati da lista d'attesa (40% recovery rate)
     - Clienti riattivati (15% dei dormienti)
     - Tempo risparmiato (45 min/giorno)
   - Box riepilogo con breakdown chiaro:
     - Guadagno lordo mensile (somma dei 3 risparmi)
     - Costo piano (auto-seleziona Essential ≤2 poltrone, Professional 3+)
     - Guadagno netto mensile (lordo - costo)
     - ROI multiplier (es. 3.0x = ogni €1 investito genera €3)

   10 card vantaggi (mostra 6, espandibile):
   - WhatsApp Automatico, Cancellazione Automatica, Lista d'Attesa Intelligente
   - Prenotazione Online 24/7, CRM Clienti Completo, Recensioni Google Automatiche
   - Riattivazione Clienti Dormienti, Calendario Multi-Poltrona, App Nativa (PWA), Zero Double Booking

   CTA finale: link a /dashboard/settings per attivare il piano.

   File:
   - src/components/roi/roi-simulator.tsx (componente client con simulatore + vantaggi)
   - src/app/(dashboard)/dashboard/roi/page.tsx (dynamic import con skeleton loading)
   - src/components/shared/sidebar.tsx (aggiunto TrendingUp import + link ROI)
   - src/app/globals.css (CSS custom .roi-slider per range input)

   typecheck ✅, build ✅

20. Da fare (dettagli in Dev Barbieri/Piano/Task-Fase-D-Rimanenti.md):
   - Dominio custom + DNS (attualmente su barberos-mvp.vercel.app)
   - WhatsApp produzione: sandbox funzionante, Twilio sara' subaccount del cliente
   - Monitoring: Sentry per error tracking

---

BOOKING PUBBLICO — FUNZIONANTE

Pagina /book/[slug] completamente funzionante:
- Wizard multi-step: Servizio → Barbiere → Data/Ora → Conferma
- Logica slot disponibili (getSlots in booking-wizard.tsx):
  - INTERSEZIONE orari di apertura business e orari di lavoro staff:
    - effectiveStart = MAX(business.open, staff.start) — il più tardi dei due
    - effectiveEnd = MIN(business.close, staff.end) — il più presto dei due
    - Se staff è off → nessuno slot (anche se business è aperto)
    - Se business è chiuso → nessuno slot (anche se staff è disponibile)
    - Se intersezione vuota (start >= end) → nessuno slot
  - Break dello staff applicati dentro l'intersezione
  - Slot occupati filtrati: appuntamenti con status booked, confirmed o completed bloccano gli slot
  - bookedSlots passato esplicitamente a getSlots() per compatibilità con React Compiler (auto-memoization)
- Filtro staff per servizio (getStaffForService):
  - Se tabella staff_services è vuota → mostra tutti i barbieri (fallback, nessuno ha configurato)
  - Se almeno un barbiere ha servizi configurati → mostra SOLO i barbieri associati al servizio selezionato
  - Se nessun barbiere è associato a quel servizio → lista vuota
- Filtro servizi prenotabili (bookableServices):
  - Se staff_services ha almeno un record → mostra SOLO i servizi che hanno almeno un barbiere associato
  - Se staff_services è vuota → mostra tutti i servizi attivi (backwards compatible)
  - Servizi senza barbiere associato non appaiono nella pagina di booking pubblica
- Durate servizi predefinite: solo 15, 30, 45, 60, 75, 90, 105, 120 minuti (ALLOWED_DURATIONS)
- useEffect fetcha slot occupati via getStaffBookedSlots() al cambio staff/data
- Blocco slot passati (data odierna): client-side filtra slot con orario ≤ ora attuale; server-side bookAppointment() rifiuta se data+ora < now
- Server-side conflict check in bookAppointment() previene race condition
- Creazione automatica client se non esiste (lookup per telefono)
- Creazione appuntamento con status "booked" e source "online"
- Messaggio WhatsApp di conferma (mock o reale in base a configurazione Twilio)
- Creazione record messaggio nel DB
- UI mobile-first con progress indicator a 4 step
- Branding personalizzabile: colori primario/secondario (hex→oklch), logo, welcome text, cover image, font preset
- Pagina applica brand_colors, logo_url, welcome_text, cover_image_url, font_preset dalla business
- Preview live nella pagina /dashboard/customize
- Integrazione waitlist: se nessun slot disponibile per la data selezionata, appare bottone "Avvisami se si libera un posto" → form inline (nome, cognome, telefono) → iscrizione automatica alla lista d'attesa → schermata conferma "Sei in lista d'attesa!" → notifica WhatsApp automatica su cancellazione
- Revalidazione automatica: tutte le server action che modificano orari business, servizi, staff o associazioni staff-servizi chiamano revalidatePath("/book", "layout") per aggiornare la pagina pubblica in tempo reale
- export const dynamic = "force-dynamic" per evitare caching della pagina server-side

---

GESTIONE STATO APPUNTAMENTI

- Blocco completamento/no-show futuro:
  - Server-side: updateAppointmentStatus() verifica che la data dell'appuntamento non sia futura prima di accettare status "completed" o "no_show"
  - Client-side: i pulsanti "Completato" e "No-show" sono disabilitati per appuntamenti con data > oggi
  - Errore italiano: "Non puoi completare o segnare no-show un appuntamento futuro"
- Ripristino stato (revertAppointmentStatus):
  - Permette di annullare "completed" o "no_show" riportando l'appuntamento a "confirmed"
  - Annulla side-effect: decrementa total_visits (se da completed) o no_show_count (se da no_show) del cliente
  - Pulsante "Ripristina a Confermato" visibile solo per appuntamenti in stato completed/no_show
  - Validazione Zod con revertStatusSchema
- Incremento no_show_count: aggiornamento diretto sulla tabella clients (non più via RPC inesistente)
- Auto-complete: pg_cron ogni 20 min segna confirmed → completed dopo end_time + ritardo configurabile per business (default 20 min)

---

REFACTORING TIPI — "use server" COMPATIBILITY

Next.js 16 con webpack non permette ai file "use server" di esportare valori non-async-function (interfacce, tipi, costanti).
Tutti i tipi condivisi sono stati spostati in src/types/index.ts:
- CalendarAppointment, ConfirmationStatus (da appointments.ts)
- AnalyticsDayRow, AnalyticsSummary, TopService (da analytics.ts)
- ReferralInfo, ReferralEntry (da referral.ts)
- ClosureEntry (da closures.ts)
- SubscriptionInfo (da billing.ts)
- WaitlistEntry (da waitlist.ts)
- ALLOWED_DURATIONS (da services.ts — reso non-exported nel file server action)
12 file componenti aggiornati per importare da @/types invece che dai file server action.

---

NOTE TECNICHE

- Next.js 16 usa proxy.ts invece di middleware.ts per la protezione route e il refresh sessione.
- proxy.ts gestisce anche il subscription gating: verifica subscription_status e redirect a /dashboard/expired se non valido.
- Le policy RLS per booking anonimo (INSERT su clients e appointments) sono state ristrette a richiedere un business_id valido (non più WITH CHECK true).
- Il trigger on_auth_user_created genera uno slug unico per la business appendendo i primi 8 caratteri dell'UUID utente. Genera anche un referral_code unico (REF-NOME-XXXX) e, se presente un referral_code nei metadata, salva referred_by e crea un record referrals con status 'pending'.
- WhatsApp dual-mode: se variabili TWILIO_* configurate → invio reale via Twilio API. Altrimenti → mock con console.log dettagliato. Trasparente per il resto del codice.
- Webhook WhatsApp usa Supabase admin client (service role key) per bypassare RLS nelle operazioni server-to-server.
- Template messaggi: default italiani hardcoded in lib/templates.ts, personalizzabili dal barbiere via UI e salvati su DB (message_templates).
- Stripe: getStripe() con lazy init + Proxy per alias. stripe-plans.ts separato (importabile da client components). STRIPE_PRICES server-only da env. Webhook invoice.paid processa anche referral reward (€50 credito via Customer Balance al referrer).
- Validazione Zod: tutti i 10 moduli Server Actions usano zod/v4 con safeParse() per validare input utente prima di qualsiasi query DB. Errori restituiti come { error: "messaggio italiano" }, mai eccezioni. Waitlist: .refine() per rifiutare date passate sia server-side che client-side.
- Deploy: Vercel per frontend/server actions/API routes. Supabase Cloud per DB/auth/edge functions/pg_cron (già attivo).
- shadcn/ui: 17 componenti Radix-based integrati in src/components/ui/. CLI configurato con components.json.
- Dark mode: next-themes con ThemeProvider, defaultTheme="dark", attribute="class".
- Rate limiting: in-memory sliding window in src/lib/rate-limit.ts, usato per protezione webhook.
- Logo custom: PNG ufficiale in public/logo.png, componenti LogoIcon/LogoFull in src/components/shared/barberos-logo.tsx (next/image).
- Test E2E: checklist manuale strutturata con 126 test cases in Dev Barbieri/Testing/test-checklist.md.
- Test automatici: 139 unit test Vitest in 7 file su funzioni pure (pnpm test). CI esegue automaticamente su ogni push/PR.
- I test automatici NON sostituiscono i test manuali E2E: coprono solo utility pure, non flussi integrati con DB/auth.
- Brand settings: src/lib/brand-settings.ts con hexToOklch(), generateBrandCSSVariables(), getFontPreset(), 4 preset tipografici. Personalizzazione booking page via /dashboard/customize.
- PWA: @serwist/next 9.5.5 per service worker (precache + runtime caching). Manifest in public/manifest.json (standalone, start_url /dashboard). Icone 192x192 e 512x512. Build usa webpack (next build --webpack), dev resta Turbopack. Disabilitato in dev. Installabile su mobile.
- Performance optimization: @next/bundle-analyzer per analisi bundle (ANALYZE=true). Lazy loading con next/dynamic per 3 componenti pesanti (AnalyticsDashboard, SettingsManager, FormCustomizer). next/image per tutte le immagini esterne con ottimizzazione WebP/AVIF e CDN caching. images.remotePatterns con hostname "**" per qualsiasi dominio. Dettagli in Dev Barbieri/Performance/Ottimizzazioni.md.
