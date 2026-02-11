BARBEROS MVP — ARCHITETTURA E STRUTTURA CODICE

Ultimo aggiornamento: 11 febbraio 2026

---

STRUTTURA CARTELLE

barberos-mvp/
├── .env.local                    # Variabili d'ambiente (gitignored)
├── .env.example                  # Template variabili d'ambiente
├── .gitignore
├── biome.json                    # Configurazione Biome (linter + formatter)
├── drizzle.config.ts             # Configurazione Drizzle ORM
├── next.config.ts                # Configurazione Next.js (React Compiler + security headers)
├── package.json                  # Dipendenze e scripts
├── postcss.config.mjs            # PostCSS con Tailwind
├── tsconfig.json                 # TypeScript strict mode
├── README.md                     # Documentazione progetto
│
├── scripts/
│   └── setup-stripe.ts           # Script setup Stripe (crea prezzo ricorrente + aggiorna .env)
│
└── src/
    ├── proxy.ts                  # Proxy Next.js 16 per protezione route e refresh sessione
    │
    ├── app/                      # Route Next.js (App Router)
    │   ├── layout.tsx            # Root layout (font Inter, metadata Barberos, lang="it")
    │   ├── page.tsx              # Homepage: redirect a /dashboard o /login
    │   ├── globals.css           # Stili globali Tailwind
    │   │
    │   ├── (auth)/               # Route group autenticazione
    │   │   ├── login/page.tsx    # Pagina login (email+password, magic link)
    │   │   └── register/page.tsx # Pagina registrazione (nome barberia, email, password)
    │   │
    │   ├── api/
    │   │   ├── stripe/
    │   │   │   └── webhook/route.ts  # Webhook Stripe (subscription events → sync DB)
    │   │   └── whatsapp/
    │   │       └── webhook/route.ts  # Webhook Twilio WhatsApp (ANNULLA/SI, validazione firma)
    │   │
    │   ├── auth/
    │   │   └── callback/route.ts # Route handler per OAuth callback / magic link
    │   │
    │   ├── (dashboard)/          # Route group dashboard (protetto da auth)
    │   │   ├── layout.tsx        # Layout con sidebar + verifica autenticazione
    │   │   └── dashboard/
    │   │       ├── page.tsx          # CALENDARIO — vista giornaliera/settimanale
    │   │       ├── clients/page.tsx  # CRM CLIENTI — lista, ricerca, schede
    │   │       ├── services/page.tsx # SERVIZI — CRUD completo
    │   │       ├── staff/page.tsx    # STAFF — CRUD con orari di lavoro
    │   │       ├── waitlist/page.tsx # LISTA D'ATTESA — gestione waitlist con filtri
    │   │       ├── analytics/page.tsx# ANALYTICS — dashboard KPI, grafici, top servizi
    │   │       ├── expired/page.tsx  # ABBONAMENTO SCADUTO — redirect qui se subscription non valida
    │   │       └── settings/page.tsx # IMPOSTAZIONI — 8 sezioni: info, orari, WhatsApp, template, review, soglie, chiusure, billing
    │   │
    │   └── book/
    │       └── [slug]/page.tsx   # BOOKING PUBBLICO — wizard prenotazione
    │
    ├── actions/                  # Server Actions (mutazioni server-side, validazione Zod in entrata)
    │   ├── analytics.ts          # getAnalyticsSummary, getAnalyticsDaily, getTopServices
    │   ├── appointments.ts       # getStaffBookedSlots (public, conflict detection),
    │   │                         # getAppointmentsForDate, getAppointmentsForWeek,
    │   │                         # getStaffForCalendar, addWalkIn, bookAppointment,
    │   │                         # updateAppointmentStatus, hasConflict (internal)
    │   ├── billing.ts            # createCheckoutSession(planId), createPortalSession, getSubscriptionInfo
    │   ├── business.ts           # getCurrentBusiness, updateBusinessInfo,
    │   │                         # updateBusinessOpeningHours, updateBusinessThresholds,
    │   │                         # getMessageTemplates, upsertMessageTemplate
    │   ├── clients.ts            # getClients, createNewClient, updateClientTags,
    │   │                         # updateClientNotes
    │   ├── closures.ts           # getClosures, getClosureDates, addClosure, removeClosure
    │   ├── services.ts           # getServices, createService, updateService,
    │   │                         # toggleService, deleteService
    │   ├── staff.ts              # getStaff, createStaffMember, updateStaffMember,
    │   │                         # updateStaffWorkingHours, deleteStaffMember
    │   └── waitlist.ts           # getWaitlistEntries, removeWaitlistEntry, expireOldEntries
    │
    ├── components/               # Componenti React
    │   ├── booking/
    │   │   └── booking-wizard.tsx # Wizard prenotazione multi-step (servizio → barbiere → data/ora → conferma)
    │   │
    │   ├── calendar/
    │   │   ├── calendar-view.tsx  # Componente principale calendario (state, navigazione, view toggle)
    │   │   ├── day-view.tsx       # Vista giornaliera: timeline oraria con colonne staff
    │   │   ├── week-view.tsx      # Vista settimanale: griglia 7 giorni
    │   │   ├── appointment-card.tsx # Card appuntamento con colori stato (5 varianti)
    │   │   ├── appointment-sheet.tsx # Pannello dettaglio appuntamento + azioni rapide
    │   │   └── walk-in-dialog.tsx # Dialog modale per aggiunta walk-in
    │   │
    │   ├── analytics/
    │   │   └── analytics-dashboard.tsx # Dashboard KPI: 4 cards, grafici fatturato/appuntamenti,
    │   │                              # top servizi, breakdown clienti, selector periodo
    │   │
    │   ├── billing/
    │   │   └── expired-view.tsx   # Vista abbonamento scaduto: info stato, link a settings per riattivazione
    │   │
    │   ├── clients/
    │   │   └── clients-manager.tsx # CRM clienti: lista, ricerca, form creazione, scheda espandibile con tag/note
    │   │
    │   ├── services/
    │   │   └── services-manager.tsx # Gestione servizi: lista, form create/edit, toggle, delete
    │   │
    │   ├── settings/
    │   │   └── settings-manager.tsx # Impostazioni: 8 sezioni accordion (info, orari, WhatsApp,
    │   │                            # template, Google review, soglie, chiusure, billing)
    │   │
    │   ├── staff/
    │   │   └── staff-manager.tsx  # Gestione staff: lista, form create/edit, editor orari, toggle, delete
    │   │
    │   ├── waitlist/
    │   │   └── waitlist-manager.tsx # Gestione waitlist: filtri stato, ricerca, badge colorati, rimozione, bulk-expire
    │   │
    │   └── shared/
    │       ├── sidebar.tsx        # Sidebar navigazione dashboard (mobile + desktop)
    │       └── barberos-logo.tsx  # Logo SVG custom (LogoIcon + LogoFull)
    │
    ├── db/
    │   ├── schema.ts             # Schema Drizzle ORM completo (10 tabelle, 6 enums, relazioni)
    │   └── index.ts              # Connessione database (postgres.js + drizzle)
    │
    ├── lib/
    │   ├── utils.ts              # Utility cn() per class names (clsx + tailwind-merge)
    │   ├── slots.ts              # Algoritmo calcolo slot disponibili (orari staff - appuntamenti - pausa)
    │   ├── rate-limit.ts         # Rate limiter in-memory sliding window per API routes
    │   │                         # checkRateLimit(), getClientIp()
    │   ├── stripe.ts             # Stripe server client (lazy init + Proxy alias), re-export PLANS,
    │   │                         # STRIPE_PRICES server-only da env
    │   ├── stripe-plans.ts       # Definizione piani (Essential, Professional, Enterprise),
    │   │                         # prezzi, features, product IDs — importabile da client components
    │   ├── whatsapp.ts           # WhatsApp dual-mode: Twilio live o mock console.log
    │   │                         # sendWhatsAppMessage(), renderTemplate(), isWhatsAppEnabled()
    │   ├── templates.ts          # Template messaggi WhatsApp: 8 tipi, DEFAULT_TEMPLATES,
    │   │                         # TEMPLATE_LABELS, TEMPLATE_DESCRIPTIONS, types condivisi
    │   └── supabase/
    │       ├── client.ts         # Supabase browser client (createBrowserClient)
    │       ├── server.ts         # Supabase server client (createServerClient con cookies)
    │       └── middleware.ts     # Supabase middleware client (usato da proxy.ts)
    │
    └── types/
        └── index.ts              # TypeScript types derivati dallo schema (Select + Insert per ogni tabella)

---

PATTERN ARCHITETTURALI

1. Server Components + Server Actions
   - Le pagine dashboard sono Server Components che fetchano dati server-side
   - I componenti interattivi sono Client Components ("use client") che ricevono dati iniziali come props
   - Le mutazioni avvengono tramite Server Actions importate nei client components
   - revalidatePath() per invalidare la cache dopo le mutazioni

2. Supabase SSR
   - Tre client Supabase distinti: browser (client.ts), server (server.ts), middleware (middleware.ts)
   - Il server client usa cookies() di Next.js per leggere/scrivere token di sessione
   - Il middleware aggiorna la sessione ad ogni richiesta e fa redirect se non autenticato

3. RLS come layer di sicurezza
   - Ogni query Supabase è filtrata automaticamente dalle RLS policies
   - La funzione get_user_business_id() isola i dati per barberia
   - Non serve passare business_id manualmente nelle query autenticate

4. Optimistic Updates
   - Toggle servizi e tag clienti: aggiornamento UI immediato + Server Action in background
   - Liste: aggiornamento locale dello state dopo operazioni CRUD

5. Component Composition
   - Pagina Server Component → Manager Client Component → Sub-components
   - Esempio: StaffPage (server) → StaffManager (client) → WorkingHoursEditor (client)

6. Validazione Input con Zod
   - Ogni Server Action che accetta parametri utente valida con Zod 4.3.6 (import da "zod/v4")
   - Pattern: schema.safeParse(input) come prima riga, PRIMA di qualsiasi query Supabase
   - Errori restituiti come { error: "messaggio in italiano" } — nessuna eccezione lanciata
   - Tipi validati: UUID, date YYYY-MM-DD, orari HH:MM, enum, stringhe min(1), numeri int/float, record, array
   - Per FormData: estrazione valori → oggetto raw → safeParse → destructuring dati validati
   - Funzioni getter senza parametri utente (getClients, getStaff, ecc.) non necessitano validazione

7. Security Hardening (next.config.ts)
   - Content-Security-Policy: default-src 'self', script-src con Stripe.js + Vercel, connect-src con Supabase + Stripe + Vercel Analytics, frame-ancestors 'none', object-src 'none'
   - X-Frame-Options: DENY, X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), geolocation=()
   - Strict-Transport-Security: max-age=31536000; includeSubDomains
   - Webhook routes (/api/stripe/webhook, /api/whatsapp/webhook): nessun CORS aperto, solo POST con verifica firma crittografica
   - RLS policies ottimizzate: auth.uid() wrappato in (select auth.uid()) per evitare re-evaluation per riga
   - Leaked Password Protection abilitata su Supabase Auth

---

FLUSSI DATI PRINCIPALI

Prenotazione online:
  Browser /book/[slug] → Server Component (fetch business + services + staff)
  → BookingWizard (client) → useEffect: getStaffBookedSlots(businessId, staffId, date)
  → Slot filtrati: generateTimeSlots() meno slot in conflitto con appuntamenti esistenti
  → bookAppointment Server Action → hasConflict() check (reject se overlap)
  → Supabase: find/create client + create appointment + send WhatsApp mock + create message record
  → revalidatePath("/dashboard")

Walk-in:
  Dashboard → WalkInDialog (client, riceve appointments dal calendario)
  → Client-side: warning arancione se orario selezionato confligge con appuntamento esistente
  → addWalkIn Server Action → hasConflict() check (reject se overlap)
  → Supabase: find/create client + create appointment (status: confirmed, source: walk_in)
  → revalidatePath("/dashboard")

Cambio stato appuntamento:
  Dashboard → AppointmentSheet (client) → updateAppointmentStatus Server Action
  → Supabase: update appointment + increment no_show_count o total_visits se necessario
  → revalidatePath("/dashboard")

Navigazione calendario:
  CalendarView (client) → useTransition + getAppointmentsForDate/getAppointmentsForWeek Server Action
  → Aggiornamento state locale con nuovi appuntamenti

Webhook WhatsApp (ANNULLA):
  Twilio POST /api/whatsapp/webhook → parse From + Body
  → validateTwilioRequest (produzione) → getSupabaseAdmin (service role, bypassa RLS)
  → trova client per telefono → trova prossimo appuntamento attivo → status → cancelled
  → cancella messaggi pendenti → notifica waitlist (primo in coda per quella data)

Webhook WhatsApp (SI):
  Twilio POST /api/whatsapp/webhook → parse From + Body
  → trova client → trova waitlist entry con status "notified"
  → crea appuntamento (source: waitlist) → waitlist status → converted

Salvataggio impostazioni:
  SettingsManager (client) → updateBusinessInfo / updateBusinessOpeningHours /
  updateBusinessThresholds / upsertMessageTemplate Server Action
  → Supabase update/upsert → revalidatePath("/dashboard/settings")

Attivazione abbonamento:
  SettingsManager > BillingSection → utente sceglie piano (Essential/Professional/Enterprise)
  → createCheckoutSession(planId) Server Action
  → Stripe: create/ensure Customer → create Checkout Session (mode: subscription, trial 30gg)
  → redirect a Stripe Checkout hosted page → pagamento → webhook sync status + piano su DB

Gestione abbonamento:
  SettingsManager > BillingSection → createPortalSession Server Action
  → Stripe: create Portal Session → redirect a Customer Portal
  → utente gestisce carta, cancella, vede fatture → webhook sync eventuali cambi

Webhook Stripe:
  Stripe POST /api/stripe/webhook → verifica firma (STRIPE_WEBHOOK_SECRET)
  → Supabase admin client (service role, bypassa RLS)
  → subscription.created/updated/deleted → mapStatus() → update businesses.subscription_status
  → invoice.paid → status active / invoice.payment_failed → status past_due

Flusso conferma intelligente (per ogni appuntamento):
  1. pg_cron → confirmation-request Edge Function
     → find_appointments_needing_confirm_request() (timing smart basato su orario)
     → WhatsApp: "Conferma il tuo appuntamento... CONFERMA / CANCELLA / CAMBIA ORARIO"
  2. Se non risponde: pg_cron → confirmation-reminder Edge Function
     → find_appointments_needing_confirm_reminder() (secondo avviso)
     → WhatsApp: "Reminder: conferma entro le X o verrà cancellato"
  3. Alla deadline: pg_cron → auto-cancel Edge Function
     → auto_cancel_unconfirmed() (UPDATE status='cancelled' + RETURNING dettagli)
     → WhatsApp: "Appuntamento cancellato perché non confermato"
     → Notifica primo in waitlist per quello slot
  4. Se confermato: pg_cron → pre-appointment Edge Function
     → find_confirmed_needing_pre_reminder() (~2h prima)
     → WhatsApp: "Ci vediamo tra poco! Presentati a [indirizzo]"

Risposta webhook WhatsApp (/api/whatsapp/webhook):
  Twilio POST → parse From + Body → comando = Body.trim().toUpperCase()
  → CONFERMA: booked → confirmed, risposta "Perfetto! Ci vediamo presto!"
  → CANCELLA/ANNULLA: cancelled, notifica waitlist, risposta con link booking
  → CAMBIA ORARIO: risposta con link prenotazione
  → SI/SÌ: conferma waitlist → crea appuntamento
  → Altro: risposta con lista comandi disponibili

Cron job (review request):
  pg_cron → review-request Edge Function
  → find_review_appointments() → completati 1.5-2.5h fa con Google review link
  → WhatsApp: "Lascia una recensione!"

Cron job (reactivation):
  pg_cron → reactivation Edge Function
  → find_dormant_clients() → clienti inattivi > soglia giorni
  → WhatsApp: "È passato un po'! Prenota qui"

---

SUPABASE EDGE FUNCTIONS (Deno, deployate su Supabase Cloud)

6 Edge Functions attive per automazioni:
- confirmation-request (v1, ACTIVE) — Richiesta conferma (timing smart)
- confirmation-reminder (v1, ACTIVE) — Secondo avviso non confermati
- auto-cancel (v1, ACTIVE) — Auto-cancella + notifica alla deadline
- pre-appointment (v1, ACTIVE) — "Ci vediamo!" ~2h prima (solo confermati)
- review-request (v1, ACTIVE) — Richiesta recensione Google
- reactivation (v1, ACTIVE) — Riattivazione clienti dormienti

Pattern comune per ogni Edge Function:
1. Crea Supabase admin client (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, auto-disponibili)
2. Chiama SQL helper function via supabase.rpc()
3. Per ogni risultato: renderizza template (custom da DB o default hardcoded)
4. Invia WhatsApp via Twilio REST API (fetch diretto, no npm — siamo in Deno)
5. Se TWILIO_* non configurate → mock con console.log
6. Registra messaggio nella tabella messages (status: sent o failed)
7. Ritorna JSON riepilogo

PostgreSQL Extensions abilitate:
- pg_cron v1.6.4 — Job scheduler (cron.schedule, cron.job)
- pg_net v0.19.5 — Async HTTP da SQL (net.http_post per chiamare Edge Functions)

6 SQL Helper Functions:
- find_appointments_needing_confirm_request() — timing smart, SECURITY DEFINER
- find_appointments_needing_confirm_reminder() — secondo avviso, SECURITY DEFINER
- auto_cancel_unconfirmed() — UPDATE + RETURNING, SECURITY DEFINER
- find_confirmed_needing_pre_reminder() — confermati ~2h prima, SECURITY DEFINER
- find_review_appointments(hours_min, hours_max) — SECURITY DEFINER
- find_dormant_clients(min_days_since_last_msg) — SECURITY DEFINER

6 pg_cron Schedules:
- confirmation-request: */30 * * * * → pg_net → Edge Function
- confirmation-reminder: */30 * * * * → pg_net → Edge Function
- auto-cancel: */30 * * * * → pg_net → Edge Function
- pre-appointment: */30 * * * * → pg_net → Edge Function
- review-request: 15 * * * * → pg_net → Edge Function
- reactivation: 0 10 * * * → pg_net → Edge Function

Timing smart conferma (in base a orario appuntamento):
| Orario app. | 1ª richiesta | 2° reminder | Deadline cancellazione |
|-------------|--------------|-------------|------------------------|
| ≥ 14:00     | Sera prima 20:00 | Mattina 08:00 | Ore 12:00 |
| 10:00-13:59 | Sera prima 20:00 | Mattina 07:30 | Ore 09:00 |
| < 10:00     | Giorno prima 12:00 | Sera prima 20:00 | Sera prima 22:00 |

---

CONTEGGIO FILE

Codebase Next.js (locale):
- 9 Server Actions (analytics, appointments, billing, business, clients, closures, services, staff, waitlist)
- 18 route/pagine (incluso layout, callback, booking, expired, 2 webhook)
- 17 componenti UI shadcn/ui (avatar, badge, button, card, dialog, dropdown-menu, input, label, popover, select, separator, sheet, skeleton, sonner, table, tabs, tooltip)
- 11 componenti feature (6 calendar, 1 analytics, 1 billing, 1 booking, 1 clients, 1 services, 1 settings, 1 staff, 1 waitlist)
- 2 componenti shared (sidebar, barberos-logo)
- 10 file lib/utility (utils, slots, rate-limit, stripe, stripe-plans, whatsapp, templates, 3 supabase clients)
- 2 file database (schema, index)
- 1 file types
- 1 file proxy (proxy.ts — auth + subscription gating)
- 1 config shadcn (components.json)
- 1 script setup (scripts/setup-stripe.ts)
- Totale: ~72 file TypeScript/TSX

Supabase Cloud:
- 6 Edge Functions attive (confirmation-request/reminder, auto-cancel, pre-appointment, review-request, reactivation)
- 7 SQL helper/functions (6 conferma + calculate_analytics_daily)
- 7 pg_cron schedules (6 conferma + analytics-daily-calc)
- 16 migrazioni applicate
- 11 tabelle (10 originali + business_closures)

Deploy:
- Vercel: frontend, Server Actions, API routes (collegato)
- Supabase Cloud: database, auth, edge functions, pg_cron (attivo)
