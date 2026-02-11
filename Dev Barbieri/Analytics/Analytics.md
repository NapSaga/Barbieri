BARBEROS — ANALYTICS & MONITORAGGIO UTILIZZO APP

Ultimo aggiornamento: 11 febbraio 2026

---

STATO ATTUALE

  Vercel Web Analytics: ABILITATO + INTEGRATO
  @vercel/analytics: v1.6.1 INSTALLATO (10 feb 2026)
  @vercel/speed-insights: v1.3.1 INSTALLATO (10 feb 2026)
  Componenti: <Analytics /> + <SpeedInsights /> in src/app/layout.tsx
  Piano Vercel: Hobby (50K eventi/mese inclusi, NO custom events)

  FASE 1 (page views + speed insights): COMPLETATA ✅ — ATTIVA IN PRODUZIONE
    - <Analytics /> e <SpeedInsights /> integrati in layout.tsx dal 10 feb 2026
    - Page views automatiche su TUTTE le pagine (11 dashboard + booking + auth)
    - Inclusa /dashboard/customize (aggiunta con Personalizza Form)
    - Visitors, bounce rate, referrers, devices, countries, Core Web Vitals
    - Nessun codice aggiuntivo necessario — funziona automaticamente

  FASE 2 (43 custom events): SOLO DOCUMENTATA — NON ANCORA IMPLEMENTATA NEL CODICE
    - I 43 eventi mappati in questo file sono PIANIFICATI, non ancora scritti nel codice
    - I file src/lib/analytics.ts e src/lib/analytics-server.ts NON esistono ancora
    - Nessuna chiamata track() e' presente nel codice sorgente
    - Per implementare serve:
      1. Upgrade a Vercel Pro ($20/mese per team)
      2. Creare src/lib/analytics.ts (client-side) e src/lib/analytics-server.ts (server-side)
      3. Aggiungere track() nei file indicati nella mappa eventi sotto
    - Il codice track() puo' essere scritto anche prima dell'upgrade:
      su piano Hobby le chiamate vengono semplicemente ignorate

  NOTA: I custom events (track()) richiedono piano Pro.
  Su Hobby si ottengono page views automatiche, visitors, referrer,
  devices, countries, browsers, bounce rate e Core Web Vitals.

---

PIANO DI IMPLEMENTAZIONE

Il piano e' diviso in 2 fasi: una gratuita (Hobby) e una a pagamento (Pro).
La Fase 1 da' gia' visibilita' completa su come usano l'app.


FASE 1 — PAGE VIEWS + SPEED INSIGHTS (Piano Hobby, gratis)
═══════════════════════════════════════════════════════════

Costo: $0 (50K page views/mese inclusi su Hobby)
Tempo: 15 minuti
Cosa ottieni: Sapere QUALI pagine visitano, QUANTO spesso, DA DOVE vengono

  Step 1: Installare i pacchetti
  ─────────────────────────────
  pnpm add @vercel/analytics @vercel/speed-insights

  Step 2: Aggiornare src/app/layout.tsx
  ─────────────────────────────────────
  import { Analytics } from '@vercel/analytics/next';
  import { SpeedInsights } from '@vercel/speed-insights/next';

  export default function RootLayout({ children }) {
    return (
      <html lang="it">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    );
  }

  IMPORTANTE: Importare da '@vercel/analytics/next' (non /react)

  Step 3: Deploy su Vercel
  ────────────────────────
  git add . && git commit && git push
  Vercel fa auto-deploy. Dopo 30 secondi dal primo visitatore
  i dati appaiono nella dashboard.

  Step 4: Verificare nel browser
  ──────────────────────────────
  Aprire Network tab → cercare richiesta a /_vercel/insights/view
  Se presente = funziona.

DATI DISPONIBILI SU HOBBY (dopo Step 1-3):
  - Visitors (visitatori unici)
  - Page Views (visualizzazioni pagina)
  - Bounce Rate (% che esce subito)
  - Top Pages (quali pagine sono piu' visitate)
  - Referrers (da dove arrivano i visitatori)
  - Countries (paesi)
  - Devices (mobile/desktop)
  - Browsers (Chrome, Safari, etc.)
  - Operating Systems
  - Core Web Vitals (LCP, INP, CLS, FCP, TTFB) via Speed Insights

CHECKLIST FASE 1:
  [x] pnpm add @vercel/analytics @vercel/speed-insights — FATTO 10 feb 2026
  [x] Aggiungere <Analytics /> e <SpeedInsights /> al layout.tsx — FATTO 10 feb 2026
  [x] Deploy su Vercel (git push) — Vercel collegato e attivo
  [x] Verificare dati nella Vercel Dashboard dopo primo visitatore
  [ ] Abilitare Speed Insights: Project → Speed Insights tab → Enable


FASE 2 — CUSTOM EVENTS (Richiede piano Pro)
═══════════════════════════════════════════

Costo: Piano Pro Vercel (team) + $3/100K eventi aggiuntivi
Quando: Quando decidi di passare a Pro per funzionalita' avanzate
Cosa ottieni: Tracciare AZIONI specifiche (prenotazioni, login, pagamenti, etc.)

  Requisiti:
  - Vercel Pro team
  - @vercel/analytics gia' installato (Fase 1)
  - Creare file utility per il tracking

  Step 1: Creare src/lib/analytics.ts (client-side)
  ──────────────────────────────────────────────────
  import { track } from '@vercel/analytics';

  export function trackEvent(
    name: string,
    props?: Record<string, string | number | boolean>
  ) {
    track(name, props);
  }

  Step 2: Creare src/lib/analytics-server.ts (server-side)
  ────────────────────────────────────────────────────────
  import { track } from '@vercel/analytics/server';

  export async function trackServerEvent(
    name: string,
    props?: Record<string, string | number | boolean>
  ) {
    await track(name, props);
  }

  NOTA: server-side e' ASYNC (va usato con await)
  NOTA: server-side NON viene bloccato dagli ad-blocker

  Step 3: Integrare gli eventi nel codice (vedi mappa eventi sotto)

CHECKLIST FASE 2:
  [ ] Upgrade a Vercel Pro
  [ ] Creare src/lib/analytics.ts
  [ ] Creare src/lib/analytics-server.ts
  [ ] Integrare eventi P0 (critici)
  [ ] Integrare eventi P1 (importanti)
  [ ] Integrare eventi P2 (utili)
  [ ] Deploy e verificare nella tab "Events" della dashboard

---

PAGINE MONITORATE (Automatiche con Fase 1)

Queste pagine vengono tracciate SENZA codice aggiuntivo.
Vercel le mostra sotto "Top Pages" nella dashboard.

  PAGINE PUBBLICHE
  ────────────────
  /login                  Accesso utente
                          → Quanti visitano la pagina di login?
                          → Bounce rate = problemi di UX/conversione

  /register               Registrazione nuovo barbiere
                          → Quanti arrivano alla registrazione?
                          → Se tanti visitano ma pochi registrano = friction

  /book/[slug]            Prenotazione pubblica (per ogni barbiere)
                          → Volume di traffico per barbiere
                          → Da dove arrivano i clienti (referrer)
                          → Mobile vs Desktop (clienti prenotano da telefono?)

  PAGINE DASHBOARD (Admin — Barbiere)
  ────────────────────────────────────
  /dashboard              Calendario (home)
                          → Pagina piu' visitata = centro operativo
                          → Frequenza di accesso = engagement quotidiano

  /dashboard/clients      Gestione clienti
                          → Quanto usano la gestione clienti?

  /dashboard/services     Gestione servizi
                          → Setup iniziale vs uso continuativo

  /dashboard/staff        Gestione staff
                          → Barberie multi-operatore vs singolo

  /dashboard/waitlist     Lista d'attesa
                          → Feature usata o ignorata?

  /dashboard/analytics    Analytics interni
                          → Il barbiere guarda i suoi dati?

  /dashboard/settings     Impostazioni
                          → Frequenza di personalizzazione

  /dashboard/customize    Personalizza booking page
                          → Quanti barbieri personalizzano il brand?
                          → Feature usata = barbiere investe nel proprio brand
                          → Se bassa = semplificare UX o aggiungere onboarding

  /dashboard/expired      Abbonamento scaduto
                          → Quanti finiscono qui = churn rate

COSA LEGGERE DAI PAGE VIEWS:
  1. /book/[slug] ha molto traffico ma poche prenotazioni?
     → Il wizard di prenotazione ha problemi di UX
  2. /dashboard/analytics quasi mai visitato?
     → I barbieri non guardano i dati (semplificare o rimuovere)
  3. /dashboard/waitlist mai visitato?
     → Feature non scoperta (aggiungere onboarding)
  4. /dashboard/expired ha visite frequenti?
     → Troppi utenti in churn (rivedere pricing/valore)
  5. /login alto bounce rate?
     → Problemi di accesso (errore form, UX, etc.)
  6. /dashboard/customize mai visitato?
     → I barbieri non personalizzano (aggiungere prompt post-registrazione)
  7. /dashboard/customize visitato ma nessun Brand Updated?
     → UX del form troppo complessa (semplificare)

---

MAPPA COMPLETA CUSTOM EVENTS (Fase 2 — Pro)

Convenzione naming: PascalCase con spazi — "Booking Created"
Limite: 2 proprieta' per evento su Pro (8 con Analytics Plus a $10/mese)

Priorita':
  P0 = Critico (business metrics core)
  P1 = Importante (funnel e engagement)
  P2 = Utile (ottimizzazione UX)


1. PRENOTAZIONI & APPUNTAMENTI [P0]
───────────────────────────────────

  Booking Created                                              SERVER
    { source: "online" | "walk_in" | "waitlist", service }
    File: src/actions/appointments.ts → bookAppointment()
    Perche': Volume prenotazioni = metrica #1 del business

  Walk-in Added                                                SERVER
    { service, staff }
    File: src/actions/appointments.ts → addWalkIn()
    Perche': Rapporto online/walk-in = adozione piattaforma

  Appointment Completed                                        SERVER
    { service, staff }
    File: src/actions/appointments.ts → updateAppointmentStatus()
    Perche': Tasso di completamento = revenue reale

  Appointment Cancelled                                        SERVER
    { source: "admin" | "whatsapp" | "client" }
    File: src/actions/appointments.ts → updateAppointmentStatus()
    Perche': Chi cancella e perche' = pattern da correggere

  Appointment No-show                                          SERVER
    { service, staff }
    File: src/actions/appointments.ts → updateAppointmentStatus()
    Perche': No-show rate target < 10%. Se alto = problema serio

  Appointment Confirmed                                        SERVER
    { source: "admin" | "whatsapp" }
    File: src/actions/appointments.ts → updateAppointmentStatus()
    Perche': Conferme WhatsApp vs manuali = efficacia automazione


2. FUNNEL PRENOTAZIONE ONLINE [P1]
──────────────────────────────────

  Booking Step Viewed                                          CLIENT
    { step: "service" | "staff" | "date" | "time" | "info" | "confirm" }
    File: src/components/booking/booking-wizard.tsx
    Perche': Dove i clienti ABBANDONANO il wizard

  Booking Step Completed                                       CLIENT
    { step: "service" | "staff" | "date" | "time" | "info" }
    File: src/components/booking/booking-wizard.tsx
    Perche': Tasso completamento per step

  Booking Submitted                                            CLIENT
    { service, staff }
    File: src/components/booking/booking-wizard.tsx
    Perche': Conversione finale lato client

  FUNNEL DA COSTRUIRE IN VERCEL:
    Step Viewed (service) → Step Completed (service) →
    Step Viewed (staff) → Step Completed (staff) →
    Step Viewed (date) → ... → Booking Submitted → Booking Created


3. AUTENTICAZIONE & ONBOARDING [P0/P1]
──────────────────────────────────────

  User Registered                                              CLIENT
    { }  (no props per privacy)
    File: src/app/(auth)/register/page.tsx
    Perche': Top of funnel. Nuovi barbieri. P0.

  User Logged In                                               CLIENT
    { method: "password" | "magic_link" }
    File: src/app/(auth)/login/page.tsx
    Perche': Engagement + metodo preferito. P1.

  Login Failed                                                 CLIENT
    { method: "password" | "magic_link" }
    File: src/app/(auth)/login/page.tsx
    Perche': Friction all'accesso = perdita utenti. P1.


4. PAGAMENTI & ABBONAMENTI [P0]
──────────────────────────────

  Checkout Started                                             SERVER
    { plan: "essential" | "professional" }
    File: src/actions/billing.ts → createCheckoutSession()
    Perche': Intenzione di pagare. Confrontare con Subscription Created.

  Subscription Created                                         SERVER
    { plan, status }
    File: src/app/api/stripe/webhook/route.ts
    Perche': REVENUE. Conversione completata.

  Subscription Updated                                         SERVER
    { status: "active" | "past_due" | "cancelled" }
    File: src/app/api/stripe/webhook/route.ts
    Perche': Churn, upgrade, downgrade.

  Payment Failed                                               SERVER
    { plan }
    File: src/app/api/stripe/webhook/route.ts
    Perche': Rischio churn immediato. Servono azioni (email, retry).

  Portal Opened                                                SERVER
    { }
    File: src/actions/billing.ts → createPortalSession()
    Perche': Utente che apre il portale = potenziale churn. P2.


5. CLIENTI [P1/P2]
──────────────────

  Client Created                                               SERVER
    { source: "booking" | "manual" | "walk_in" }
    File: src/actions/clients.ts → createNewClient()
    Perche': Crescita base clienti. P1.

  Client Tag Updated                                           CLIENT
    { tag, action: "added" | "removed" }
    File: src/components/clients/clients-manager.tsx
    Perche': Come categorizzano i clienti. P2.

  Client Search                                                CLIENT
    { results: number }
    File: src/components/clients/clients-manager.tsx
    Perche': Frequenza ricerca. P2.


6. SERVIZI [P1/P2]
──────────────────

  Service Created                                              SERVER
    { name, duration }
    File: src/actions/services.ts → createService()
    Perche': Evoluzione offerta. P1.

  Service Updated                                              SERVER
    { field: "name" | "price" | "duration" }
    File: src/actions/services.ts → updateService()
    Perche': Frequenza modifica. P2.

  Service Toggled                                              SERVER
    { active: boolean }
    File: src/actions/services.ts → toggleService()
    Perche': Stagionalita' servizi. P2.

  Service Deleted                                              SERVER
    { name }
    File: src/actions/services.ts → deleteService()
    Perche': Churn servizi. P2.


7. STAFF [P1/P2]
────────────────

  Staff Created                                                SERVER
    { name }
    File: src/actions/staff.ts → createStaffMember()
    Perche': Crescita team = business in crescita. P1.

  Staff Hours Updated                                          SERVER
    { staff }
    File: src/actions/staff.ts → updateStaffWorkingHours()
    Perche': Frequenza modifica orari. P2.

  Staff Deleted                                                SERVER
    { name }
    File: src/actions/staff.ts → deleteStaffMember()
    Perche': Turnover. P2.


8. WHATSAPP [P1]
────────────────

  WhatsApp Sent                                                SERVER
    { type }
    File: src/lib/whatsapp.ts → sendWhatsAppMessage()
    Perche': Volume messaggi. Costo Twilio vs valore.
    Tipi: confirmation | confirm_request | confirm_reminder |
          pre_appointment | cancellation | review_request |
          reactivation | waitlist_notify

  WhatsApp Reply Received                                      SERVER
    { action: "conferma" | "cancella" | "cambia_orario" | "si" }
    File: src/app/api/whatsapp/webhook/route.ts
    Perche': Tasso di risposta. Efficacia automazione.


9. WAITLIST [P1/P2]
──────────────────

  Waitlist Converted                                           SERVER
    { service }
    File: src/app/api/whatsapp/webhook/route.ts
    Perche': Revenue recuperata da cancellazioni. P1.

  Waitlist Expired                                             SERVER
    { count }
    File: src/actions/waitlist.ts → expireOldEntries()
    Perche': Opportunita' perse. P2.


10. IMPOSTAZIONI [P2]
────────────────────

  Business Info Updated                                        SERVER
    { field: "name" | "address" | "phone" | "review_link" }
    File: src/actions/business.ts → updateBusinessInfo()

  Opening Hours Updated                                        SERVER
    { }
    File: src/actions/business.ts → updateBusinessOpeningHours()

  Message Template Updated                                     SERVER
    { template }
    File: src/actions/business.ts → upsertMessageTemplate()

  Closure Added                                                SERVER
    { reason }
    File: src/actions/closures.ts → addClosure()


11. NAVIGAZIONE DASHBOARD [P2]
─────────────────────────────

  Calendar View Changed                                        CLIENT
    { view: "day" | "week" }
    File: src/components/calendar/calendar-view.tsx

  Appointment Sheet Opened                                     CLIENT
    { status }
    File: src/components/calendar/appointment-sheet.tsx

  Analytics Period Changed                                     CLIENT
    { period: "7d" | "30d" | "90d" }
    File: src/app/(dashboard)/dashboard/analytics/page.tsx


12. PERSONALIZZAZIONE BRAND [P1/P2]
───────────────────────────────────

  Brand Settings Updated                                       SERVER
    { field: "colors" | "logo" | "welcome_text" | "cover_image" | "font_preset" }
    File: src/actions/business.ts → updateBrandSettings()
    Perche': Quanti barbieri personalizzano la booking page.
             Se basso = feature non scoperta o troppo complessa. P1.

  Brand Preview Loaded                                         CLIENT
    { }
    File: src/components/customize/form-customizer.tsx
    Perche': Quanti aprono la pagina Personalizza e vedono la preview.
             Confrontare con Brand Settings Updated per tasso di completamento. P2.

  Font Preset Changed                                          CLIENT
    { preset: "moderno" | "classico" | "bold" | "minimal" }
    File: src/components/customize/form-customizer.tsx
    Perche': Quale preset tipografico e' piu' popolare. P2.

  Color Picker Used                                            CLIENT
    { type: "primary" | "secondary" }
    File: src/components/customize/form-customizer.tsx
    Perche': Quanti cambiano i colori vs lasciano il default. P2.

  FUNNEL PERSONALIZZAZIONE:
    /dashboard/customize view → Brand Preview Loaded →
    Color Picker Used / Font Preset Changed → Brand Settings Updated

---

DASHBOARD VERCEL — COME LEGGERE I DATI

Dopo la Fase 1 (Hobby), nella dashboard Vercel vedrai:

  Tab "Visitors"
  ──────────────
  Grafico giornaliero visitatori unici.
  → Trend crescente = acquisizione utenti funziona
  → Picchi = campagne marketing o passaparola
  → Cali nel weekend = utenti business (barbieri lavorano di sabato!)

  Tab "Page Views"
  ────────────────
  Quante volte le pagine vengono caricate.
  → /dashboard alto = utenti attivi (buon segno)
  → /book/[slug] alto = clienti prenotano online (obiettivo!)
  → /login alto con pochi /dashboard = problemi di auth

  Tab "Pages" → Routes
  ─────────────────────
  Classifica pagine per visitatori.
  Cosa cercare:
    1. /dashboard deve essere #1 (uso quotidiano)
    2. /book/[slug] deve crescere (adozione prenotazione online)
    3. /dashboard/expired deve essere BASSO (pochi in churn)
    4. /register deve avere trend crescente (nuovi utenti)
    5. /dashboard/customize = adozione branding (feature engagement)

  Tab "Referrers"
  ───────────────
  Da dove arrivano i visitatori.
  → Direct = link diretto o bookmark (utenti fidelizzati)
  → Google = SEO funziona
  → Instagram/Facebook = social marketing
  → WhatsApp = i messaggi automatici portano traffico!

  Tab "Countries"
  ───────────────
  → Dovrebbe essere 99% Italia
  → Se vedi altri paesi = bot o traffico anomalo

  Tab "Devices"
  ─────────────
  → Clienti (booking): probabilmente 80%+ mobile
  → Barbieri (dashboard): mix mobile/desktop
  → Se dashboard ha molto mobile = ottimizzare UX mobile admin

  Tab "Events" (solo Pro)
  ───────────────────────
  → Lista custom events con conteggi
  → Filtrare per periodo (7d, 30d, 90d)
  → Click su evento per vedere proprieta'

---

KPI DA MONITORARE

KPI SETTIMANALI (Fase 1 — gia' disponibili su Hobby):
  1. Page Views totali         → L'app viene usata?
  2. Visitors unici            → Quanti utenti attivi?
  3. /book/[slug] views        → I clienti prenotano online?
  4. Bounce rate               → L'app e' usabile?
  5. Mobile vs Desktop ratio   → Come accedono?

KPI SETTIMANALI (Fase 2 — richiede Pro):
  6. Booking Created           → Volume prenotazioni
  7. Appointment Completed     → Revenue effettiva
  8. Appointment No-show       → Target: < 10%
  9. User Registered           → Nuovi barbieri
  10. Subscription Created     → Conversioni a pagamento

KPI MENSILI (Fase 2 — richiede Pro):
  11. Walk-in vs Online ratio  → Adozione prenotazione digitale
  12. Booking funnel drop-off  → Dove si perdono clienti nel wizard
  13. WhatsApp reply rate      → Efficacia automazione
  14. Waitlist conversion      → Revenue recuperata
  15. Payment Failed count     → Rischio churn

---

FUNNEL DI CONVERSIONE (Fase 2)

  FUNNEL PRENOTAZIONE:
  /book/[slug] view → Step service → Step staff → Step date →
  Step time → Step info → Booking Submitted → Booking Created →
  Appointment Confirmed → Appointment Completed

  FUNNEL ONBOARDING BARBIERE:
  /register view → User Registered → User Logged In →
  Service Created → Staff Created → Brand Settings Updated →
  First Booking Created

  FUNNEL PERSONALIZZAZIONE:
  /dashboard/customize view → Brand Preview Loaded →
  Color Picker Used / Font Preset Changed → Brand Settings Updated

  FUNNEL PAGAMENTO:
  /dashboard/settings view → Checkout Started →
  Subscription Created (webhook Stripe)

  FUNNEL WHATSAPP:
  WhatsApp Sent (confirm_request) → WhatsApp Reply (conferma) →
  Appointment Confirmed → Appointment Completed

---

CONFIGURAZIONE AVANZATA

  beforeSend — Filtrare URL sensibili:
  ─────────────────────────────────────
  <Analytics
    beforeSend={(event) => {
      if (event.url.includes('token=')) {
        return { ...event, url: event.url.split('?')[0] };
      }
      return event;
    }}
  />

  Debug in sviluppo:
  ──────────────────
  <Analytics debug={process.env.NODE_ENV === 'development'} />
  (mostra eventi nella console del browser)

  Speed Insights sampling (ridurre costi):
  ─────────────────────────────────────────
  <SpeedInsights sampleRate={50} />

---

RIEPILOGO EVENTI PER FILE (Fase 2)

  File                                         | N. Eventi
  ─────────────────────────────────────────────+──────────
  src/app/layout.tsx                           | Setup (<Analytics />, <SpeedInsights />)
  src/actions/appointments.ts                  | 6 (booking, walk-in, status x4)
  src/actions/clients.ts                       | 1 (client created)
  src/actions/services.ts                      | 4 (create, update, toggle, delete)
  src/actions/staff.ts                         | 3 (create, hours, delete)
  src/actions/business.ts                      | 4 (info, hours, templates, brand settings)
  src/actions/billing.ts                       | 2 (checkout, portal)
  src/actions/closures.ts                      | 1 (closure added)
  src/actions/waitlist.ts                      | 1 (expired)
  src/app/api/stripe/webhook/route.ts          | 3 (sub created, updated, payment failed)
  src/app/api/whatsapp/webhook/route.ts        | 2 (reply, waitlist converted)
  src/lib/whatsapp.ts                          | 1 (message sent)
  src/components/booking/booking-wizard.tsx     | 3 (step viewed, completed, submitted)
  src/components/calendar/calendar-view.tsx     | 1 (view changed)
  src/components/calendar/appointment-sheet.tsx | 1 (sheet opened)
  src/components/clients/clients-manager.tsx    | 2 (tag, search)
  src/components/customize/form-customizer.tsx  | 3 (preview loaded, font preset, color picker)
  src/app/(auth)/login/page.tsx                | 2 (logged in, failed)
  src/app/(auth)/register/page.tsx             | 1 (registered)
  src/app/(dashboard)/dashboard/analytics/     | 1 (period changed)
  ─────────────────────────────────────────────+──────────
  TOTALE                                       | 43 custom events

---

NOTE TECNICHE

  - @vercel/analytics va importato da '/next' per Next.js (NON da '/react')
  - server-side track() e' ASYNC — usare sempre await
  - client-side track() e' fire-and-forget — non serve await
  - In development gli eventi NON vengono inviati (usare debug=true)
  - Ad-blocker NON bloccano server-side events (preferire per P0)
  - Max 255 caratteri per nome evento, chiave e valore
  - Solo valori piatti nelle proprieta' (string, number, boolean)
  - Page views contano nel limite eventi (50K hobby, 100K pro)
  - Custom events: max 2 proprieta' su Pro, 8 con Plus ($10/mese)
  - Hobby: dopo 50K eventi, pausa 3 giorni poi riprende dopo 7
  - Pro: $3 / 100K eventi aggiuntivi ($0.00003/evento)

---

PROSSIMO PASSO

  Fase 1 (page views + speed insights): GIA' COMPLETATA ✅
  <Analytics /> e <SpeedInsights /> sono in layout.tsx dal 10 feb 2026.
  Page views automatiche attive su tutte le 10 pagine dashboard + booking + auth.

  → Prossimo: FASE 2 (custom events) quando si passa a Vercel Pro:
    1. Upgrade a Vercel Pro
    2. Creare src/lib/analytics.ts (client) e src/lib/analytics-server.ts (server)
    3. Integrare i 43 custom events mappati sopra (partire da P0)
    4. Verificare nella tab "Events" della Vercel Dashboard
    5. Costruire i funnel (prenotazione, onboarding, personalizzazione, pagamento)
