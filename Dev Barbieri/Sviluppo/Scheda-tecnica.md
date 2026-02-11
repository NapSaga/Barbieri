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
Servizi combinabili (esempio: taglio 20 min + barba 15 min = combo 35 min a prezzo dedicato).
Possibilità di assegnare servizi specifici a barbieri specifici.
Attivazione e disattivazione servizi senza cancellarli.
Ordine di visualizzazione personalizzabile nella pagina booking.

---

CORE 4: GESTIONE STAFF

Aggiunta barbieri con nome, foto, servizi offerti.
Orari di lavoro per barbiere: giorni lavorativi, ora inizio, ora fine, pausa pranzo.
Gestione ferie e giorni di assenza (blocco slot automatico).
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

---

CORE 8: GESTIONE NO-SHOW

Se il cliente non si presenta e non cancella, il barbiere lo segna come no-show con un tap.
Il sistema registra il no-show nella scheda cliente.
Contatore no-show visibile nella scheda: dopo 2 no-show il cliente viene flaggato automaticamente.
Possibilità futura (fase 2): richiedere deposito o prepagamento ai clienti con storico no-show.

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

STACK TECNOLOGICO

Frontend: Next.js 16 con App Router e React Server Components. React 19 con React Compiler. Tailwind CSS v4 + tw-animate-css. shadcn/ui (17 componenti Radix-based integrati) + Lucide React per icone. Dark mode con next-themes. Motion (Framer Motion) per animazioni. Sonner per toast notifications. Turbopack come bundler di sviluppo. TypeScript strict mode.

Backend: Supabase (PostgreSQL 17 + Auth + Row Level Security + Edge Functions Deno per logica serverless). Server Actions di Next.js per mutazioni autenticate. Supabase JS client per query runtime (beneficia di RLS automatico).

ORM e database: Drizzle ORM per query type-safe e migrazioni. Supabase come provider PostgreSQL. Migrazioni versionata con drizzle-kit.

Notifiche WhatsApp: Twilio (^5.12.1) tramite WhatsApp Business API. Dual-mode: live Twilio o mock console.log. Webhook /api/whatsapp/webhook per risposte in ingresso (CONFERMA, CANCELLA, CAMBIA ORARIO, SI). pg_cron + pg_net + 6 Edge Functions Deno per scheduling automatico (conferma intelligente, review, riattivazione).

Autenticazione: Supabase Auth con magic link email + password. JWT con refresh token. RLS policies per isolamento dati tra barberie.

Pagamenti abbonamento: Stripe Billing con 3 piani (Essential €300/mese, Professional €500/mese, Enterprise custom). Trial 30 giorni. Stripe Checkout per pagamento con selezione piano. Webhook Stripe (/api/stripe/webhook) per sync stato abbonamento su DB. Customer Portal per self-service (cambio carta, cancellazione, fatture). Setup €1.000 una tantum fatturato separatamente.

Cron e job scheduling: pg_cron nativo di Supabase per job ricorrenti (reminder, riattivazione, analytics). Supabase Edge Functions triggerati da database webhooks per eventi real-time.

Monitoring: Sentry per error tracking. Vercel Analytics per performance. Supabase Dashboard per query e database health.

AI (fase 2 post-MVP): Claude API via Anthropic SDK per suggerimenti automatici, previsione no-show, generazione testi marketing.

Hosting: Vercel per frontend, Server Actions e API routes (collegato). Supabase Cloud per database, auth, edge functions, cron (già attivo). Dominio custom con Cloudflare per DNS e CDN (da configurare).

CI/CD (attivo): GitHub Actions (.github/workflows/ci.yml) per typecheck, lint, test e build automatico su ogni push/PR a main. pnpm 10 + Node.js 22 + caching dipendenze. Vercel Preview Deployments. Lint con Biome 2.3.14 (0 errori, 0 warning). 139 unit test Vitest.

---

COSA NON FA L'MVP

Nessuna app nativa iOS o Android (solo PWA e browser).
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

businesses: id (uuid), name, slug, address, phone, logo_url, google_review_link, opening_hours (jsonb), welcome_text (text), cover_image_url (text), font_preset (text), brand_colors (jsonb), timezone, stripe_customer_id, subscription_status, dormant_threshold_days (int default 28), no_show_threshold (int default 2), auto_complete_delay_minutes (int default 20), created_at, updated_at.

staff: id (uuid), business_id (fk), name, photo_url, working_hours (jsonb), active, sort_order, created_at, updated_at.

services: id (uuid), business_id (fk), name, duration_minutes (int), price_cents (int), is_combo (bool), combo_service_ids (uuid array), display_order (int), active, created_at, updated_at.

staff_services: staff_id (fk), service_id (fk) — tabella ponte many-to-many.

clients: id (uuid), business_id (fk), first_name, last_name, phone (unique per business), email, notes (text), tags (text array), no_show_count (int default 0), total_visits (int default 0), last_visit_at (timestamptz), created_at, updated_at.

appointments: id (uuid), business_id (fk), client_id (fk), staff_id (fk), service_id (fk), date (date), start_time (time), end_time (time), status (enum: booked, confirmed, completed, cancelled, no_show), source (enum: online, walk_in, manual, waitlist), cancelled_at (timestamptz nullable), created_at, updated_at.

waitlist: id (uuid), business_id (fk), client_id (fk), service_id (fk), desired_date (date), desired_start_time (time), desired_end_time (time), status (enum: waiting, notified, converted, expired), notified_at (timestamptz nullable), created_at.

messages: id (uuid), business_id (fk), client_id (fk), appointment_id (fk nullable), type (enum: confirmation, confirm_request, confirm_reminder, pre_appointment, cancellation, review_request, reactivation, waitlist_notify), whatsapp_message_id (text), status (enum: queued, sent, delivered, read, failed), scheduled_for (timestamptz), sent_at (timestamptz nullable), created_at.

message_templates: id (uuid), business_id (fk), type (enum), body_template (text con placeholder tipo {{client_name}}, {{service_name}}, {{date}}, {{time}}, {{booking_link}}, {{review_link}}), active, created_at, updated_at.

analytics_daily: id (uuid), business_id (fk), date (date), total_revenue_cents (int), appointments_completed (int), appointments_cancelled (int), appointments_no_show (int), new_clients (int), returning_clients (int), created_at. Calcolata da cron job notturno.

business_closures: id (uuid), business_id (fk), date (date), reason (text nullable), created_at. Per gestione chiusure straordinarie (feste, ferie). Integrato nel booking wizard (date disabilitate) e nel calendario (banner arancione).

Indici: appointments (business_id+date, staff_id+date, client_id, service_id), clients (business_id+phone, business_id), staff (business_id), services (business_id), staff_services (service_id), messages (scheduled_for+status, business_id, client_id, appointment_id), analytics_daily (business_id+date), waitlist (business_id+desired_date, client_id, service_id), business_closures (business_id+date, business_id). RLS policy su ogni tabella filtrando per business_id dell'utente autenticato. Security headers (CSP, HSTS, X-Frame-Options DENY) applicati via next.config.ts. Leaked Password Protection abilitata su Supabase Auth.

---

FLUSSI PRINCIPALI

Flusso prenotazione: cliente apre link (barberia.barberos.it o slug custom) → sceglie servizio → sceglie barbiere → sistema mostra solo slot realmente disponibili calcolati su orari staff, durata servizio, appuntamenti esistenti → cliente inserisce nome e telefono → conferma → server action crea appointment con status booked + crea client se non esiste + schedula messaggio WhatsApp conferma + broadcast realtime aggiorna calendario dashboard.

Flusso cancellazione: cliente risponde CANCELLA/ANNULLA al messaggio WhatsApp → webhook /api/whatsapp/webhook riceve messaggio → trova client per telefono → trova prossimo appuntamento attivo → aggiorna status a cancelled + cancella messaggi pendenti → se waitlist presente per quello slot, notifica primo in coda con WhatsApp → primo che risponde SI, sistema crea nuovo appointment con source waitlist.

Flusso walk-in: barbiere clicca aggiungi walk-in → seleziona cliente esistente (ricerca per nome o telefono) o ne crea uno nuovo → seleziona servizio → appointment creato con source walk_in e status confirmed.

Flusso no-show: il barbiere segna manualmente come no-show dalla dashboard → incrementa no_show_count del client → se count supera soglia (default 2), badge alert visibile nella lista clienti.

Flusso recensione: pg_cron ogni ora (:15) → review-request Edge Function → find_review_appointments() cerca appuntamenti completati 1.5-2.5h fa con Google review link configurato e senza review_request già inviato → invia messaggio WhatsApp con link Google review.

Flusso riattivazione: pg_cron giornaliero alle 11:00 Roma (10:00 UTC) → reactivation Edge Function → find_dormant_clients() cerca clienti con last_visit_at più vecchio di soglia configurata (default 28 giorni) e senza messaggio reactivation recente → invia messaggio WhatsApp con link booking.

Flusso analytics: pg_cron alle 02:05 UTC (03:05 Roma) calcola metriche del giorno precedente → UPSERT su analytics_daily → dashboard legge da questa tabella per visualizzazione veloce senza query pesanti sugli appuntamenti.