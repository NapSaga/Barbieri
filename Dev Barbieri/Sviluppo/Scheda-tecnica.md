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

CORE 6: NOTIFICHE WHATSAPP AUTOMATICHE

Messaggio di conferma prenotazione: inviato istantaneamente dopo la prenotazione con data, ora, servizio, indirizzo barberia.
Reminder 24 ore prima: "Ciao [nome], ti ricordiamo l'appuntamento domani alle [ora] per [servizio]. Per disdire rispondi ANNULLA."
Reminder 2 ore prima: "Ci vediamo tra 2 ore! [nome barberia], [indirizzo]."
Notifica cancellazione: se il cliente cancella, messaggio di conferma cancellazione + lo slot torna disponibile.
Tutti i messaggi personalizzabili dal barbiere (testo, tono, emoji).
Integrazione tramite WhatsApp Business API (Twilio o 360dialog).
Il barbiere NON deve fare nulla manualmente: tutto automatico dopo il setup.

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

Frontend: Next.js 16 con App Router e React Server Components. React 19 con React Compiler. Tailwind CSS v4. Componenti custom (shadcn/ui previsto ma non integrato). Turbopack come bundler di sviluppo. TypeScript strict mode. Lucide React per icone.

Backend: Supabase (PostgreSQL 17 + Auth + Row Level Security + Edge Functions Deno per logica serverless). Server Actions di Next.js per mutazioni autenticate. Supabase JS client per query runtime (beneficia di RLS automatico).

ORM e database: Drizzle ORM per query type-safe e migrazioni. Supabase come provider PostgreSQL. Migrazioni versionata con drizzle-kit.

Notifiche WhatsApp: Twilio o 360dialog tramite WhatsApp Business API. Webhook endpoint su Supabase Edge Functions per gestione risposte in ingresso (ANNULLA, SI). Queue con pg_cron + pg_net per scheduling messaggi (reminder 24h, 2h, recensioni, riattivazione).

Autenticazione: Supabase Auth con magic link email + password. JWT con refresh token. RLS policies per isolamento dati tra barberie.

Pagamenti abbonamento: Stripe Billing con 3 piani (Essential €300/mese, Professional €500/mese, Enterprise custom). Trial 30 giorni. Stripe Checkout per pagamento con selezione piano. Webhook Stripe (/api/stripe/webhook) per sync stato abbonamento su DB. Customer Portal per self-service (cambio carta, cancellazione, fatture). Setup €1.000 una tantum fatturato separatamente.

Cron e job scheduling: pg_cron nativo di Supabase per job ricorrenti (reminder, riattivazione, analytics). Supabase Edge Functions triggerati da database webhooks per eventi real-time.

Monitoring: Sentry per error tracking. Vercel Analytics per performance. Supabase Dashboard per query e database health.

AI (fase 2 post-MVP): Claude API via Anthropic SDK per suggerimenti automatici, previsione no-show, generazione testi marketing.

Hosting (previsto): Vercel per frontend, Server Actions e API routes. Supabase Cloud per database, auth, edge functions, cron (già attivo). Dominio custom con Cloudflare per DNS e CDN.

CI/CD (previsto): GitHub Actions per test e deploy automatico. Vercel Preview Deployments. Lint con Biome.

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

businesses: id (uuid), name, slug, address, phone, logo_url, google_review_link, opening_hours (jsonb), brand_colors (jsonb), timezone, stripe_customer_id, subscription_status, created_at, updated_at.

staff: id (uuid), business_id (fk), name, photo_url, working_hours (jsonb), active, sort_order, created_at, updated_at.

services: id (uuid), business_id (fk), name, duration_minutes (int), price_cents (int), is_combo (bool), combo_service_ids (uuid array), display_order (int), active, created_at, updated_at.

staff_services: staff_id (fk), service_id (fk) — tabella ponte many-to-many.

clients: id (uuid), business_id (fk), first_name, last_name, phone (unique per business), email, notes (text), tags (text array), no_show_count (int default 0), total_visits (int default 0), last_visit_at (timestamptz), created_at, updated_at.

appointments: id (uuid), business_id (fk), client_id (fk), staff_id (fk), service_id (fk), date (date), start_time (time), end_time (time), status (enum: booked, confirmed, completed, cancelled, no_show), source (enum: online, walk_in, manual, waitlist), cancelled_at (timestamptz nullable), created_at, updated_at.

waitlist: id (uuid), business_id (fk), client_id (fk), service_id (fk), desired_date (date), desired_start_time (time), desired_end_time (time), status (enum: waiting, notified, converted, expired), notified_at (timestamptz nullable), created_at.

messages: id (uuid), business_id (fk), client_id (fk), appointment_id (fk nullable), type (enum: confirmation, reminder_24h, reminder_2h, cancellation, review_request, reactivation, waitlist_notify), whatsapp_message_id (text), status (enum: queued, sent, delivered, read, failed), scheduled_for (timestamptz), sent_at (timestamptz nullable), created_at.

message_templates: id (uuid), business_id (fk), type (enum), body_template (text con placeholder tipo {{client_name}}, {{service_name}}, {{date}}, {{time}}, {{booking_link}}, {{review_link}}), active, created_at, updated_at.

analytics_daily: id (uuid), business_id (fk), date (date), total_revenue_cents (int), appointments_completed (int), appointments_cancelled (int), appointments_no_show (int), new_clients (int), returning_clients (int), created_at. Calcolata da cron job notturno.

Indici: appointments (business_id, date), clients (business_id, phone), messages (scheduled_for, status), analytics_daily (business_id, date). RLS policy su ogni tabella filtrando per business_id dell'utente autenticato.

---

FLUSSI PRINCIPALI

Flusso prenotazione: cliente apre link (barberia.barberos.it o slug custom) → sceglie servizio → sceglie barbiere → sistema mostra solo slot realmente disponibili calcolati su orari staff, durata servizio, appuntamenti esistenti → cliente inserisce nome e telefono → conferma → server action crea appointment con status booked + crea client se non esiste + schedula messaggio WhatsApp conferma + broadcast realtime aggiorna calendario dashboard.

Flusso cancellazione: cliente risponde ANNULLA al reminder → webhook riceve messaggio → edge function trova appointment attivo per quel numero → aggiorna status a cancelled + cancella reminder pendenti → se waitlist presente per quello slot, notifica primo in coda → primo che risponde SI, sistema crea nuovo appointment con source waitlist.

Flusso walk-in: barbiere clicca aggiungi walk-in → seleziona cliente esistente (ricerca per nome o telefono) o ne crea uno nuovo → seleziona servizio → appointment creato con source walk_in e status confirmed.

Flusso no-show: il barbiere segna manualmente come no-show dalla dashboard → incrementa no_show_count del client → se count supera soglia (default 2), badge alert visibile nella lista clienti.

Flusso recensione: pg_cron ogni ora cerca appuntamenti completati da più di 2 ore senza messaggio review_request inviato → controlla che ultimo review_request per quel client sia più vecchio di 30 giorni → schedula messaggio WhatsApp con link Google review.

Flusso riattivazione: pg_cron giornaliero alle 10:00 cerca clienti con last_visit_at più vecchio di soglia configurata (default 28 giorni) → controlla che non esista messaggio reactivation inviato negli ultimi 28 giorni → schedula messaggio WhatsApp con link booking.

Flusso analytics: pg_cron alle 02:05 UTC (03:05 Roma) calcola metriche del giorno precedente → UPSERT su analytics_daily → dashboard legge da questa tabella per visualizzazione veloce senza query pesanti sugli appuntamenti.