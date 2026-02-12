MVP BARBEROS — SCHEDA TECNICA PRODOTTO

---

CORE 1: BOOKING PUBBLICO

Pagina di prenotazione pubblica con brand del barbiere (logo, colori, nome).
Il cliente apre il link, sceglie il servizio, sceglie il barbiere (se più di uno), sceglie data e ora tra gli slot disponibili, conferma con nome e numero di telefono.
Nessuna app da scaricare, funziona da browser mobile e desktop.
Il link si condivide ovunque: bio Instagram, Google Business, stato WhatsApp, biglietto da visita con QR.
Conferma istantanea via WhatsApp al cliente con riepilogo appuntamento.
Il sistema blocca automaticamente lo slot e aggiorna il calendario in tempo reale.
Gestione servizi combinati: il cliente può prenotare taglio + barba come unico appuntamento con durata sommata.
Durata minima slot: 15 minuti (pensato per servizi rapidi da barbiere).
Blocco slot passati: per la data odierna, gli slot con orario già trascorso non vengono mostrati. Protezione doppia: client-side (slot nascosti) + server-side (prenotazione rifiutata se data+ora nel passato).
Prevenzione double booking a 6 livelli: (1) slot occupati nascosti nel wizard, (2) slot passati nascosti, (3) warning visivo walk-in, (4) hasConflict() server-side, (5) conflict check waitlist WhatsApp, (6) partial unique index PostgreSQL (appointments_no_overlap_idx) come fallback atomico contro race condition.

---

CORE 2: DASHBOARD BARBIERE

Calendario giornaliero e settimanale con vista per poltrona e per barbiere.
Drag and drop per spostare appuntamenti.
Vista rapida di ogni appuntamento: nome cliente, servizio, durata, nota.
Aggiunta manuale di appuntamento (per walk-in o chiamate telefoniche).
Indicatore visivo per slot vuoti, slot occupati, no-show.
Filtro per barbiere singolo in caso di team.
Accesso da qualsiasi dispositivo, responsive mobile-first.
Login con email e password, sessione persistente.

---

CORE 3: GESTIONE SERVIZI

Lista servizi personalizzabile: nome, durata, prezzo.
Durate predefinite obbligatorie: 15, 30, 45, 60, 75, 90, 105 o 120 minuti (incrementi di 15 min).
La selezione avviene tramite dropdown (non input numerico libero) per evitare durate arbitrarie che creerebbero problemi con la griglia slot del booking.
Validazione server-side con Zod: qualsiasi durata non nell'elenco viene rifiutata.
Servizi combinabili (esempio: taglio 30 min + barba 30 min = combo 60 min a prezzo dedicato).
Possibilità di assegnare servizi specifici a barbieri specifici (vedi CORE 4).
Attivazione e disattivazione servizi senza cancellarli.
Ordine di visualizzazione personalizzabile nella pagina booking.

---

CORE 4: GESTIONE STAFF

Aggiunta barbieri con nome, foto, servizi offerti.
Orari di lavoro per barbiere: giorni lavorativi, ora inizio, ora fine, pausa pranzo.
Gestione ferie e giorni di assenza (blocco slot automatico).

Associazione servizi per barbiere:
- Ogni barbiere può essere abilitato solo ai servizi che sa eseguire (pannello "Servizi" con checkbox).
- Se nessun barbiere ha servizi configurati → tutti i barbieri appaiono per ogni servizio (retrocompatibile).
- Se almeno un barbiere ha servizi configurati → nella pagina di prenotazione appare solo chi ha quel servizio associato.
- Filtro servizi prenotabili: se esistono associazioni staff_services, solo i servizi con almeno un barbiere associato appaiono nella pagina di booking. Servizi senza barbiere NON vengono mostrati al cliente.
- Tabella ponte staff_services (many-to-many) gestita tramite server action updateStaffServices.

Logica orari intelligente (intersezione):
- Gli slot disponibili per la prenotazione sono calcolati come INTERSEZIONE tra orari di apertura del negozio e orari di lavoro del barbiere.
- effectiveStart = il più tardi tra apertura negozio e inizio turno barbiere.
- effectiveEnd = il più presto tra chiusura negozio e fine turno barbiere.
- Se il barbiere è in giorno di riposo → nessuno slot, anche se il negozio è aperto.
- Se il negozio è chiuso → nessuno slot, anche se il barbiere è disponibile.
- Esempio: negozio aperto sabato 09:00-19:00, barbiere lavora sabato 09:00-17:00 → slot fino alle 16:30 (ultimo slot da 30 min che finisce alle 17:00).
- Esempio: negozio aperto giovedì fino alle 21:00, barbiere lavora fino alle 19:00 → slot fino alle 18:30.
- I break del barbiere (pausa pranzo) si applicano dentro l'intersezione.

Il cliente vede solo i barbieri disponibili nello slot selezionato.

---

CORE 5: CRM CLIENTI

Scheda cliente automatica creata alla prima prenotazione.
Dati: nome, cognome, telefono, email (opzionale).
Storico completo appuntamenti con data, servizio, barbiere, esito (completato, no-show, cancellato).
Campo note libero per annotare preferenze (esempio: sfumatura alta, rasoio ai lati, allergia a prodotto X).
Tag manuali: VIP, problematico, nuovo.
Contatore visite totali e data ultima visita visibili in lista.
Ricerca clienti per nome o telefono.
Possibilità di aggiungere cliente manualmente (senza che prenoti online).

---

CORE 6: NOTIFICHE WHATSAPP AUTOMATICHE (Sistema Conferma Intelligente)

Sistema di conferma basato su pg_cron + Edge Functions + Twilio WhatsApp API.

Flusso per ogni appuntamento:
1. Richiesta conferma: messaggio con timing smart basato sull'orario dell'appuntamento (sera prima alle 20:00 per appuntamenti pomeridiani, giorno prima alle 12:00 per mattina presto).
2. Secondo reminder: se il cliente non risponde entro la mattina del giorno dell'appuntamento.
3. Auto-cancellazione: alla deadline se non conferma → slot liberato → notifica automatica al primo in waitlist.
4. Pre-appuntamento: "Ci vediamo tra poco!" ~2h prima (solo per confermati).

Comandi WhatsApp gestiti dal webhook:
- CONFERMA → booked → confirmed
- CANCELLA / ANNULLA → cancella appuntamento + notifica waitlist
- CAMBIA ORARIO → invia link prenotazione
- SI → conferma dalla waitlist

Altre automazioni:
- Richiesta recensione Google: ~2h dopo completamento (con link diretto).
- Riattivazione clienti dormienti: 1x/giorno per clienti inattivi > soglia configurabile.

Tutti i messaggi personalizzabili dal barbiere (testo, tono, emoji) tramite UI settings.
Integrazione tramite Twilio WhatsApp Business API. Dual-mode: live (Twilio) o mock (console.log).
Il barbiere NON deve fare nulla manualmente: tutto automatico dopo il setup.
6 Edge Functions + 6 pg_cron schedules + 6 SQL helper functions.

---

CORE 7: LISTA D'ATTESA

Se uno slot è pieno, il cliente può mettersi in lista d'attesa per quella fascia oraria.
Se qualcuno cancella, notifica WhatsApp automatica al primo in lista: "Si è liberato un posto alle [ora]. Vuoi prenotare? Rispondi SI."
Primo che conferma prende lo slot, gli altri restano in lista.
Il barbiere vede la lista d'attesa nella dashboard con numero di persone per slot.
Integrazione booking pubblico: se il cliente seleziona una data senza slot disponibili nella pagina /book/[slug], appare "Avvisami se si libera un posto" con form inline per iscriversi automaticamente alla waitlist.
Badge calendario: nella vista giornaliera del calendario, un banner blu mostra quanti clienti sono in lista d'attesa per la data visualizzata.
Validazione date: sia server-side (Zod .refine()) che client-side impediscono l'inserimento di date passate.

---

CORE 8: GESTIONE NO-SHOW E STATO APPUNTAMENTI

Se il cliente non si presenta e non cancella, il barbiere lo segna come no-show con un tap.
Il sistema registra il no-show nella scheda cliente.
Contatore no-show visibile nella scheda: dopo 2 no-show il cliente viene flaggato automaticamente.
Possibilità futura (fase 2): richiedere deposito o prepagamento ai clienti con storico no-show.

Protezioni stato appuntamento:
- Non è possibile segnare "completato" o "no-show" un appuntamento con data futura (blocco server-side + pulsanti disabilitati).
- Pulsante "Ripristina a Confermato" per annullare completamento o no-show errato (con rollback automatico di total_visits / no_show_count).
- Auto-complete: appuntamenti confermati vengono segnati automaticamente come completati 20 minuti dopo la fine (ritardo configurabile per barberia da Impostazioni > Regole automatiche).

---

CORE 9: RICHIESTA RECENSIONE GOOGLE

2 ore dopo l'appuntamento completato, messaggio WhatsApp automatico: "Grazie [nome]! Com'è andata? Lasciaci una recensione su Google, ci aiuti tantissimo → [link diretto Google review]."
Il link porta direttamente alla scheda Google Business del barbiere con il form recensione aperto.
Inviato solo ad appuntamenti segnati come completati, non ai no-show o cancellati.
Frequenza limitata: massimo una richiesta ogni 30 giorni per cliente per non risultare spam.

---

CORE 10: RIATTIVAZIONE CLIENTI DORMIENTI

Il sistema identifica automaticamente i clienti che non prenotano da più di 4 settimane (soglia configurabile).
Messaggio WhatsApp automatico: "Ciao [nome], è passato un po'! Vuoi prenotare il prossimo taglio? Prenota qui → [link booking]."
Un solo messaggio per ciclo di dormienza, non spam ripetuto.
Il barbiere vede la lista clienti dormienti nella dashboard con data ultima visita e numero visite totali.
Può decidere di inviare manualmente un messaggio personalizzato dalla scheda cliente.

---

CORE 11: DASHBOARD ANALYTICS BASE

Fatturato giornaliero: somma dei prezzi dei servizi completati oggi.
Fatturato settimanale e mensile con confronto periodo precedente.
Numero appuntamenti completati, cancellati, no-show per periodo.
No-show rate in percentuale.
Servizio più prenotato e servizio con fatturato più alto.
Numero clienti nuovi vs ricorrenti nel periodo.
Tutto visibile in una sola schermata, senza click multipli.

---

CORE 12: IMPOSTAZIONI E CONFIGURAZIONE

Dati barberia: nome, indirizzo, telefono, logo, colori brand.
Orari di apertura e chiusura per giorno della settimana.
Giorni di chiusura straordinaria (feste, ferie).
Testi personalizzabili per tutti i messaggi WhatsApp.
Link Google Business per recensioni.
Gestione account: cambio password, email, dati fatturazione.

---

CORE 13: SISTEMA REFERRAL

Programma referral per crescita virale: ogni barbiere può invitare colleghi sulla piattaforma.
Il referrer riceve €50 di credito Stripe sulla prossima fattura per ogni invitato che si abbona.
L'invitato riceve 20% di sconto sul primo mese (trial resta sempre 7 giorni).
Codice referral unico per ogni business (formato REF-NOME-XXXX), generato automaticamente alla registrazione.
Link condivisibile: /register?ref=CODICE. Pulsante share WhatsApp integrato.
Dashboard /dashboard/referral con: 3 KPI cards (invitati, convertiti, crediti), codice copiabile, sezione "Come funziona" con breakdown premi, tabella referral con stati (in attesa, convertito, premiato, scaduto).
Sidebar: nuova sezione "Crescita" con voce "Referral" (icona Gift).
Registrazione: se ?ref= presente nell'URL, badge "Invitato da [nome barberia] — 20% di sconto sul primo mese!".
Webhook Stripe: su invoice.paid, processReferralReward() applica credito automatico al referrer via stripe.customers.createBalanceTransaction().
Nessun limite al numero di referral: più inviti = più crediti (5 referral = €250 = quasi 1 mese gratis su Essential).

---

STACK TECNOLOGICO

Frontend: Next.js 16 con App Router e React Server Components. React 19 con React Compiler. Tailwind CSS v4 + tw-animate-css. shadcn/ui (17 componenti Radix-based integrati) + Lucide React per icone. Dark mode con next-themes. Motion (Framer Motion) per animazioni. Sonner per toast notifications. Turbopack come bundler di sviluppo. TypeScript strict mode.

Backend: Supabase (PostgreSQL 17 + Auth + Row Level Security + Edge Functions Deno per logica serverless). Server Actions di Next.js per mutazioni autenticate. Supabase JS client per query runtime (beneficia di RLS automatico).

ORM e database: Drizzle ORM per query type-safe e migrazioni. Supabase come provider PostgreSQL. Migrazioni versionata con drizzle-kit.

Notifiche WhatsApp: Twilio (^5.12.1) tramite WhatsApp Business API. Dual-mode: live Twilio o mock console.log. Webhook /api/whatsapp/webhook per risposte in ingresso (CONFERMA, CANCELLA, CAMBIA ORARIO, SI). pg_cron + pg_net + 6 Edge Functions Deno per scheduling automatico (conferma intelligente, review, riattivazione).

Autenticazione: Supabase Auth con magic link email + password. JWT con refresh token. RLS policies per isolamento dati tra barberie.

Pagamenti abbonamento: Stripe Billing con 3 piani (Essential €300/mese, Professional €500/mese, Enterprise custom). Trial 7 giorni. Stripe Checkout per pagamento con selezione piano e codici promozionali/coupon (allow_promotion_codes). Webhook Stripe (/api/stripe/webhook) per sync stato abbonamento su DB + processamento referral reward (€50 credito via Customer Balance al referrer). Customer Portal per self-service (cambio carta, cancellazione, fatture). Setup €1.000 una tantum fatturato separatamente.

Cron e job scheduling: pg_cron nativo di Supabase per job ricorrenti (reminder, riattivazione, analytics). Supabase Edge Functions triggerati da database webhooks per eventi real-time.

PWA (Progressive Web App): @serwist/next 9.5.5 per service worker con precache e runtime caching. Web App Manifest (standalone, start_url /dashboard, theme_color #09090b). Icone 192x192 e 512x512. Installabile su mobile (Android + iOS) come app standalone con icona home screen. Build usa webpack (next build --webpack) perché Serwist non supporta Turbopack; dev resta Turbopack.

Monitoring: Sentry per error tracking (previsto). Vercel Analytics per performance. Supabase Dashboard per query e database health.

AI (fase 2 post-MVP): Claude API via Anthropic SDK per suggerimenti automatici, previsione no-show, generazione testi marketing.

Hosting: Vercel per frontend, Server Actions e API routes (collegato). Supabase Cloud per database, auth, edge functions, cron (già attivo). Dominio custom con Cloudflare per DNS e CDN (da configurare).

CI/CD (attivo): GitHub Actions (.github/workflows/ci.yml) per typecheck, lint, test e build automatico su ogni push/PR a main. pnpm 10 + Node.js 22 + caching dipendenze. Vercel Preview Deployments. Lint con Biome 2.3.14 (0 errori, 0 warning). 139 unit test Vitest.

---

COSA NON FA L'MVP

Nessuna app nativa iOS o Android (PWA installabile su mobile + browser).
Nessun pagamento online del cliente finale (niente POS, niente prepagamento).
Nessuna gestione multi-sede (un account = una barberia).
Nessuna fatturazione elettronica SDI (fase 2).
Nessuno scontrino telematico (fase 2).
Nessun programma fedeltà a punti (fase 2).
Nessun AI avanzata: no dynamic pricing, no previsione no-show, no content generation (fase 2).
Nessuna integrazione social media per posting automatico (fase 2).
Nessun catalogo prodotti e-commerce (fase 2).

---

DATI TECNICI INFRASTRUTTURA

Costo infra per 10 clienti barbiere: circa €224 al mese (Vercel Pro €20, Supabase Pro €25, WhatsApp API €65, Stripe fees €72, AI API €30, email e tool €10).
Costo infra per 20 clienti: circa €400 al mese.
Costo infra per 50 clienti: circa €914 al mese.
Costo marginale per cliente aggiuntivo: €12-15 al mese.
Margine lordo: 96%+.

---

DATABASE: TABELLE PRINCIPALI

businesses: id (uuid), name, slug, address, phone, logo_url, google_review_link, opening_hours (jsonb), welcome_text (text), cover_image_url (text), font_preset (text), brand_colors (jsonb), timezone, stripe_customer_id, subscription_status, dormant_threshold_days (int default 28), no_show_threshold (int default 2), auto_complete_delay_minutes (int default 20), referral_code (text unique), referred_by (uuid fk → businesses.id), created_at, updated_at.

staff: id (uuid), business_id (fk), name, photo_url, working_hours (jsonb), active, sort_order, created_at, updated_at.

services: id (uuid), business_id (fk), name, duration_minutes (int), price_cents (int), is_combo (bool), combo_service_ids (uuid array), display_order (int), active, created_at, updated_at.

staff_services: staff_id (fk), service_id (fk) — tabella ponte many-to-many.

clients: id (uuid), business_id (fk), first_name, last_name, phone (unique per business), email, notes (text), tags (text array), no_show_count (int default 0), total_visits (int default 0), last_visit_at (timestamptz), created_at, updated_at.

appointments: id (uuid), business_id (fk), client_id (fk), staff_id (fk), service_id (fk), date (date), start_time (time), end_time (time), status (enum: booked, confirmed, completed, cancelled, no_show), source (enum: online, walk_in, manual, waitlist), cancelled_at (timestamptz nullable), created_at, updated_at. Partial unique index: appointments_no_overlap_idx(staff_id, date, start_time) WHERE status NOT IN ('cancelled','no_show') per prevenzione atomica double booking.

waitlist: id (uuid), business_id (fk), client_id (fk), service_id (fk), desired_date (date), desired_start_time (time), desired_end_time (time), status (enum: waiting, notified, converted, expired), notified_at (timestamptz nullable), created_at.

messages: id (uuid), business_id (fk), client_id (fk), appointment_id (fk nullable), type (enum: confirmation, confirm_request, confirm_reminder, pre_appointment, cancellation, review_request, reactivation, waitlist_notify), whatsapp_message_id (text), status (enum: queued, sent, delivered, read, failed), scheduled_for (timestamptz), sent_at (timestamptz nullable), created_at.

message_templates: id (uuid), business_id (fk), type (enum), body_template (text con placeholder tipo {{client_name}}, {{service_name}}, {{date}}, {{time}}, {{booking_link}}, {{review_link}}), active, created_at, updated_at.

analytics_daily: id (uuid), business_id (fk), date (date), total_revenue_cents (int), appointments_completed (int), appointments_cancelled (int), appointments_no_show (int), new_clients (int), returning_clients (int), created_at. Calcolata da cron job notturno.

business_closures: id (uuid), business_id (fk), date (date), reason (text nullable), created_at. Per gestione chiusure straordinarie (feste, ferie). Integrato nel booking wizard (date disabilitate) e nel calendario (banner arancione).

referrals: id (uuid), referrer_business_id (fk), referred_business_id (fk), status (enum: pending, converted, rewarded, expired), reward_amount_cents (int default 5000), stripe_credit_id (text), converted_at (timestamptz), rewarded_at (timestamptz), created_at. Per tracciamento referral tra barberie. RLS: solo il referrer può vedere i propri referral.

Indici: appointments (business_id+date, staff_id+date, client_id, service_id), clients (business_id+phone, business_id), staff (business_id), services (business_id), staff_services (service_id), messages (scheduled_for+status, business_id, client_id, appointment_id), analytics_daily (business_id+date), waitlist (business_id+desired_date, client_id, service_id), business_closures (business_id+date, business_id). RLS policy su ogni tabella filtrando per business_id dell'utente autenticato. Security headers (CSP, HSTS, X-Frame-Options DENY) applicati via next.config.ts. Leaked Password Protection abilitata su Supabase Auth.

---

FLUSSI PRINCIPALI

Flusso prenotazione: cliente apre link (barberia.barberos.it o slug custom) → sceglie servizio → sistema filtra barbieri (solo quelli con quel servizio associato, o tutti se nessuno ha servizi configurati) → sceglie barbiere → sceglie data → sistema calcola slot disponibili come INTERSEZIONE tra orari di apertura negozio e orari di lavoro del barbiere selezionato (effectiveStart = MAX dei due inizi, effectiveEnd = MIN delle due chiusure), meno gli slot occupati da appuntamenti booked/confirmed/completed, meno gli slot con orario ≤ ora attuale se la data è oggi → cliente inserisce nome e telefono → conferma → server action crea appointment con status booked + crea client se non esiste + schedula messaggio WhatsApp conferma + broadcast realtime aggiorna calendario dashboard. Se nessun slot disponibile per la data selezionata → bottone "Avvisami se si libera un posto" → form inline (nome, telefono) → iscrizione automatica alla lista d'attesa → notifica WhatsApp automatica su cancellazione. Tutte le modifiche a orari, servizi, staff e associazioni staff-servizi invalidano automaticamente la pagina booking pubblica (revalidatePath).

Flusso cancellazione: cliente risponde CANCELLA/ANNULLA al messaggio WhatsApp → webhook /api/whatsapp/webhook riceve messaggio → trova client per telefono → trova prossimo appuntamento attivo → aggiorna status a cancelled + cancella messaggi pendenti → se waitlist presente per quello slot, notifica primo in coda con WhatsApp → primo che risponde SI, sistema crea nuovo appointment con source waitlist.

Flusso walk-in: barbiere clicca aggiungi walk-in → seleziona cliente esistente (ricerca per nome o telefono) o ne crea uno nuovo → seleziona servizio → appointment creato con source walk_in e status confirmed.

Flusso no-show: il barbiere segna manualmente come no-show dalla dashboard → incrementa no_show_count del client → se count supera soglia (default 2), badge alert visibile nella lista clienti.

Flusso recensione: pg_cron ogni ora (:15) → review-request Edge Function → find_review_appointments() cerca appuntamenti completati 1.5-2.5h fa con Google review link configurato e senza review_request già inviato → invia messaggio WhatsApp con link Google review.

Flusso riattivazione: pg_cron giornaliero alle 11:00 Roma (10:00 UTC) → reactivation Edge Function → find_dormant_clients() cerca clienti con last_visit_at più vecchio di soglia configurata (default 28 giorni) e senza messaggio reactivation recente → invia messaggio WhatsApp con link booking.

Flusso analytics: pg_cron alle 02:05 UTC (03:05 Roma) calcola metriche del giorno precedente → UPSERT su analytics_daily → dashboard legge da questa tabella per visualizzazione veloce senza query pesanti sugli appuntamenti.

Flusso referral: barbiere condivide link /register?ref=REF-XXXX → nuovo barbiere apre link → pagina registrazione valida codice (validateReferralCode) → mostra badge invitato → alla registrazione, trigger SQL salva referred_by e crea record referrals con status 'pending' → nuovo barbiere completa trial e paga prima fattura → webhook Stripe invoice.paid → processReferralReward() trova referrer → stripe.customers.createBalanceTransaction(-5000 cents EUR) → aggiorna referrals status → 'converted' → 'rewarded' → credito scalato automaticamente dalla prossima fattura del referrer.