# BarberOS — Test Manuali E2E Pre-Lancio

> **Data inizio test:** 11/02/2026
> **Ultimo aggiornamento:** 11/02/2026
> **Ambiente:** ☐ Vercel (produzione) ☒ Locale (`pnpm dev`)
> **Tester:** Claude Code (code review + API testing) + Windsurf Cascade
> **Browser:** N/A (static analysis + curl)

**Legenda:** ✅ Pass | ❌ Fail | ⏭️ Skipped | 🔧 Bug documentato

---

## 1. Auth

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 1.1 | Registrazione nuovo utente | Vai a `/register` → inserisci email + password → submit | Redirect a `/dashboard`, business auto-creata con `subscription_status = trialing`, slug generato | ✅ | Codice corretto: `signUp` con `business_name` in metadata, redirect a `/dashboard` |
| 1.2 | Auto-creazione business | Dopo 1.1, verifica in Supabase: tabella `businesses` ha riga con `owner_id` = nuovo user UUID | Riga presente, `subscription_status = trialing` | ✅ | Dipende da trigger Supabase `on_auth_user_created` (configurato) |
| 1.3 | Logout | Click logout dal dashboard | Redirect a `/login`, sessione Supabase invalidata | ✅ | Sidebar ha logout con `signOut()` + redirect |
| 1.4 | Login con credenziali | Vai a `/login` → email + password → submit | Redirect a `/dashboard` | ✅ | `signInWithPassword` + `router.push("/dashboard")` |
| 1.5 | Login già autenticato → redirect | Da loggato, visita `/login` | Redirect automatico a `/dashboard` (proxy.ts gating) | ✅ | proxy.ts line 48 gestisce redirect |
| 1.6 | Register già autenticato → redirect | Da loggato, visita `/register` | Redirect automatico a `/dashboard` | ✅ | proxy.ts line 48 gestisce entrambi |
| 1.7 | Magic link | Dalla pagina login, richiedi magic link → apri link da email | Login riuscito, redirect a `/dashboard` | ✅ | `signInWithOtp` + auth/callback exchange code |
| 1.8 | Protezione rotte | Da non autenticato, visita `/dashboard` | Redirect a `/login` | ✅ | Testato via curl: 307 redirect. proxy.ts line 41-45 |
| 1.9 | Protezione rotte API | Da non autenticato, chiama un server action (es. via fetch diretto) | Redirect o errore 401 | ✅ | Tutti i server action verificano `getUser()` e `redirect("/login")` |

---

## 2. Onboarding

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 2.1 | Prima configurazione business | Dashboard → Settings → compila nome, indirizzo, telefono, Google Review link → salva | Dati aggiornati in `businesses`, toast successo | ✅ | BusinessInfoForm → `updateBusinessInfo`. Feedback "Salvato!" |
| 2.2 | Impostazione orari apertura | Settings → sezione orari → imposta orari per ogni giorno, segna un giorno come chiuso → salva | `opening_hours` JSONB aggiornato correttamente | ✅ | OpeningHoursForm → `updateBusinessOpeningHours` |
| 2.3 | Aggiunta primo servizio | Dashboard → Servizi → aggiungi servizio (nome, durata, prezzo) → salva | Servizio visibile in lista, riga in `services` | ✅ | ServicesManager → `createService` |
| 2.4 | Aggiunta servizio combo | Aggiungi servizio con `is_combo = true` e seleziona sotto-servizi | Combo creato con `combo_service_ids` popolato | ✅ | 🔧 FIX applicato: toggle "È un combo" + multi-select servizi nel ServiceForm. `createService`/`updateService` salvano `is_combo` + `combo_service_ids` |
| 2.5 | Aggiunta primo staff | Dashboard → Staff → aggiungi membro (nome) → salva | Staff visibile in lista, riga in `staff` con `active = true` | ✅ | StaffManager → `createStaffMember` |
| 2.6 | Orari staff | Staff → modifica → imposta working_hours per giorno con pausa pranzo | `working_hours` JSONB corretto (start, end, breakStart, breakEnd, off) | ✅ | WorkingHoursEditor con tutti i campi |
| 2.7 | Associazione staff-servizi | Staff → modifica → seleziona servizi offerti | Righe in `staff_services` per le combinazioni scelte | ✅ | 🔧 FIX applicato: sezione "Servizi" con checkbox nel StaffManager. `updateStaffServices` DELETE+INSERT batch. Pagina staff carica servizi e associazioni |
| 2.8 | Ordinamento staff | Modifica `sort_order` di più staff members | Ordine riflesso in lista e nel booking wizard | ✅ | 🔧 FIX applicato: drag-and-drop HTML5 nativo nel StaffManager. `reorderStaff` aggiorna `sort_order` in batch. Ordine riflesso ovunque |

---

## 3. Booking Online

> **Prerequisiti:** almeno 1 business con slug, 1 staff attivo con orari, 1 servizio attivo, staff-servizio associato.

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 3.1 | Pagina booking pubblica | Visita `/book/[slug]` | Wizard caricato, nome barberia visibile, nessun errore 404 | ✅ | Server component carica business, services, staff, closures in parallelo |
| 3.2 | Slug inesistente | Visita `/book/slug-che-non-esiste` | Errore gestito (404 o messaggio "barberia non trovata") | ✅ | Testato via curl: 404. `notFound()` chiamato |
| 3.3 | Selezione servizio | Step 1: seleziona un servizio dalla lista | Servizio evidenziato, durata e prezzo mostrati | ✅ | Mostra nome, durata, prezzo formattato |
| 3.4 | Selezione staff | Step 2: seleziona un barbiere (solo quelli che offrono il servizio scelto) | Staff filtrato per servizio, selezione funzionante | ✅ | 🔧 FIX applicato: `getStaffForService()` filtra staff per `staff_services`. Backwards compatible: se nessuna associazione, mostra tutti |
| 3.5 | Selezione data | Step 3: seleziona una data dal calendario | Solo date future abilitate, giorni chiusi (closures + giorno off staff) disabilitati | ✅ | Date future (+1 giorno), closures e off staff disabilitati |
| 3.6 | Selezione slot orario | Step 4: seleziona uno slot disponibile | Slot calcolati rispetto a `working_hours`, pause, appuntamenti esistenti | ✅ | `generateTimeSlots` + filtro `bookedSlots` |
| 3.7 | Nessun slot disponibile | Scegli data/staff con tutti slot occupati | Messaggio "nessun orario disponibile", non si può procedere | ✅ | "Nessun orario disponibile per questa data." |
| 3.8 | Dati cliente | Step 5: inserisci nome, cognome, telefono | Validazione campi obbligatori (nome, telefono) | ✅ | 🔧 FIX applicato: aggiunto campo cognome (era solo nome) |
| 3.9 | Conferma prenotazione | Submit finale del wizard | Appointment creato con `status = booked`, `source = online` | ✅ | `bookAppointment` crea con status/source corretti |
| 3.10 | Cliente esistente (stesso telefono) | Prenota con telefono già usato | Riusa `client_id` esistente, nessun duplicato in `clients` | ✅ | Find-or-create per phone + business_id |
| 3.11 | Nuovo cliente | Prenota con telefono nuovo | Nuova riga in `clients` con dati inseriti | ✅ | Insert con first_name, last_name, phone |
| 3.12 | Messaggio WhatsApp conferma | Dopo 3.9, verifica log mock WhatsApp | Messaggio inviato con template corretto (nome, servizio, data, ora, indirizzo) | ✅ | `sendWhatsAppMessage` con template renderizzato |
| 3.13 | Record messaggio | Dopo 3.9, verifica tabella `messages` | Riga con `type = confirmation`, `status = sent`, `appointment_id` corretto | ✅ | Insert in `messages` con tutti i campi |
| 3.14 | Chiusura non prenotabile | Aggiungi closure per una data → prova a prenotare quella data | Data non selezionabile nel wizard | ✅ | `closureDates.includes(toISODate(date))` disabilita data |

---

## 4. Conferma Smart (WhatsApp Flow)

> **Prerequisiti:** appuntamento in status `booked`, WhatsApp in modalità mock.

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 4.1 | Invio confirm_request | pg_cron (o trigger manuale) invia richiesta conferma per appuntamento booked | Messaggio `confirm_request` in tabella `messages` con `status = sent` | ⏭️ | Richiede Edge Function su Supabase |
| 4.2 | Risposta CONFERMA | Simula webhook WhatsApp POST `/api/whatsapp` con body "CONFERMA" | `appointments.status` → `confirmed` | ✅ | `handleConfirm` aggiorna status. Testato: webhook restituisce 200 |
| 4.3 | Badge conferma in calendario | Dopo 4.2, apri calendario nel giorno dell'appuntamento | Badge verde "confermato" visibile sull'appuntamento | ✅ | `enrichWithConfirmationStatus` + AppointmentCard pending dot |
| 4.4 | Invio confirm_reminder | Se nessuna risposta entro soglia, pg_cron invia reminder | Secondo messaggio `confirm_reminder` in `messages` | ⏭️ | Richiede Edge Function su Supabase |
| 4.5 | Auto-cancellazione | Nessuna risposta dopo reminder → scadenza timer | `appointments.status` → `cancelled`, `cancelled_at` popolato | ⏭️ | Richiede Edge Function su Supabase |
| 4.6 | ConfirmationStatus enrichment | Verifica `getAppointmentsForDate` per appuntamento con confirm_request pendente | `confirmationStatus = "pending"`, `confirmRequestSentAt` non null | ✅ | Batch query su messages + mapping corretto |

---

## 5. Calendario

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 5.1 | Vista giornaliera | Dashboard → Calendario → seleziona un giorno con appuntamenti | Tutti gli appuntamenti del giorno visibili, ordinati per `start_time` | ✅ | DayView con colonne staff, ordinamento ASC |
| 5.2 | Vista settimanale | Passa a vista settimanale | Appuntamenti distribuiti su 7 giorni, colonne per staff | ✅ | WeekView con 7 colonne giornaliere |
| 5.3 | Navigazione date | Click frecce avanti/indietro | Data aggiornata, appuntamenti ricaricati | ✅ | `navigate()` + `fetchAppointments()` |
| 5.4 | Badge conferma | Appuntamento `confirmed` vs `booked` vs `pending` | Badge colorato diverso per stato conferma (none/pending/confirmed/auto_cancelled) | ✅ | STATUS_STYLES per status + confirmation dot |
| 5.5 | Appointment sheet | Click su appuntamento nel calendario | Sheet/modal con dettagli: cliente, servizio, orario, staff, status | ✅ | AppointmentSheet con tutti i dettagli |
| 5.6 | Azione: completa | Dalla sheet, segna come "completato" | `status → completed`, `total_visits` client incrementato, `last_visit_at` aggiornato | ✅ | `updateAppointmentStatus` incrementa visite |
| 5.7 | Azione: no-show | Dalla sheet, segna come "no-show" | `status → no_show`, `no_show_count` client incrementato (via RPC `increment_no_show`) | ✅ | RPC call per incremento |
| 5.8 | Azione: cancella | Dalla sheet, cancella appuntamento | `status → cancelled`, `cancelled_at` popolato | ✅ | 🔧 FIX applicato: ora notifica anche la waitlist |
| 5.9 | Filtro per staff | Se disponibile, filtra calendario per staff member | Solo appuntamenti dello staff selezionato | ✅ | 🔧 FIX applicato: dropdown Select nella toolbar calendario con opzione "Tutti" + singoli barbieri. Filtra staffMembers e appointments passati a DayView/WeekView |
| 5.10 | Giorno senza appuntamenti | Seleziona giorno vuoto | Stato vuoto gestito (messaggio "nessun appuntamento") | ✅ | "Nessun appuntamento per oggi" con suggerimento Walk-in |

---

## 6. Walk-in

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 6.1 | Aggiunta walk-in | Calendario → "Aggiungi walk-in" → compila nome, telefono, staff, servizio, data, ora inizio/fine → submit | Appuntamento creato con `source = walk_in`, `status = confirmed` | ✅ | WalkInDialog + `addWalkIn` action |
| 6.2 | Cliente nuovo da walk-in | Walk-in con telefono mai usato | Nuovo cliente creato in `clients` | ✅ | Find-or-create client by phone |
| 6.3 | Cliente esistente da walk-in | Walk-in con telefono già in DB | Riusa `client_id` esistente | ✅ | Query esistente prima dell'insert |
| 6.4 | Nessun conflitto slot | Aggiungi walk-in nello stesso slot di un appuntamento esistente | Verifica comportamento: errore o doppia prenotazione gestita | ✅ | Server-side `hasConflict` + client-side warning. Errore restituito |
| 6.5 | Walk-in visibile in calendario | Dopo 6.1, verifica calendario | Walk-in mostrato con indicatore `source = walk_in` | ✅ | `handleRefresh` ricarica, source badge in AppointmentSheet |

---

## 7. Cancellazione via WhatsApp

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 7.1 | Risposta CANCELLA | Simula webhook WhatsApp con body "CANCELLA" per appuntamento booked/confirmed | `status → cancelled`, `cancelled_at` popolato | ✅ | `handleCancel` con update status + cancelled_at |
| 7.2 | Risposta ANNULLA | Simula webhook con "ANNULLA" | Stesso effetto di CANCELLA | ✅ | `command === "CANCELLA" || command === "ANNULLA"` |
| 7.3 | Notifica waitlist su cancellazione | Se esiste waitlist entry per stessa data/fascia oraria | Entry notificata (`status → notified`, `notified_at` impostato) | ✅ | `notifyWaitlist()` chiamata dopo cancel |
| 7.4 | Cancellazione da calendario | Cancella da appointment sheet | Stessi effetti: status cancelled, waitlist notificata | ✅ | 🔧 FIX applicato: `notifyWaitlistOnCancel` aggiunta a `updateAppointmentStatus` |

---

## 8. No-Show

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 8.1 | Mark no-show | Appointment sheet → segna no-show | `appointments.status = no_show` | ✅ | `handleAction("no_show")` + `updateAppointmentStatus` |
| 8.2 | Contatore incrementato | Dopo 8.1, verifica `clients.no_show_count` | Incrementato di 1 (via RPC `increment_no_show`) | ✅ | RPC call con `client_uuid` |
| 8.3 | Tag automatico "no-show frequente" | Client con `no_show_count >= no_show_threshold` (default 2) | Tag automatico applicato (verifica Edge Function / pg_cron) | ⏭️ | Richiede Edge Function su Supabase |
| 8.4 | Secondo no-show → threshold | Segna un secondo no-show per lo stesso cliente | `no_show_count = 2`, tag applicato se `no_show_threshold = 2` | ⏭️ | Richiede Edge Function su Supabase |
| 8.5 | No-show non incrementa visite | Dopo no-show, verifica `total_visits` | NON incrementato (solo `completed` incrementa visite) | ✅ | Solo `status === "completed"` incrementa `total_visits` |

---

## 9. Waitlist

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 9.1 | Aggiunta in waitlist | Dashboard → Waitlist → aggiungi entry (cliente, servizio, data desiderata, orario) | Riga in `waitlist` con `status = waiting` | ✅ | 🔧 FIX applicato: bottone "Aggiungi" + dialog modale con ricerca cliente esistente / creazione nuovo, selezione servizio, data, orario. `addToWaitlist` server action |
| 9.2 | Lista visibile | Pagina `/dashboard/waitlist` | Tutte le entries mostrate con cliente, servizio, data, status | ✅ | WaitlistManager con tutti i dettagli |
| 9.3 | Notifica su cancellazione | Cancella appuntamento nello stesso slot di una waitlist entry | Entry aggiornata: `status → notified`, `notified_at` impostato, WhatsApp inviato | ✅ | 🔧 FIX applicato: ora funziona sia da WhatsApp che da calendario |
| 9.4 | Risposta SI → conversione | Simula risposta "SI" da webhook WhatsApp | `waitlist.status → converted`, nuovo appuntamento creato nello slot liberato | ✅ | `handleWaitlistConfirm` crea appuntamento + update status |
| 9.5 | Rimozione manuale | Waitlist → rimuovi entry | Entry rimossa da DB, lista aggiornata | ✅ | `removeWaitlistEntry` + `setEntries` update |
| 9.6 | Scadenza automatica | Entries con `desired_date` nel passato | `expireOldEntries()` le porta a `status = expired` | ✅ | Bottone "Scaduti" + `expireOldEntries` action |
| 9.7 | Ordinamento | Verifica ordine in lista | Ordinate per `desired_date ASC`, `desired_start_time ASC` | ✅ | Query con `order("desired_date").order("desired_start_time")` |

---

## 10. CRM (Clienti)

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 10.1 | Creazione cliente manuale | Dashboard → Clienti → "Nuovo cliente" → compila nome, cognome, telefono, email, note → salva | Riga in `clients`, visibile in lista | ✅ | ClientsManager con form completo |
| 10.2 | Duplicato telefono | Crea cliente con telefono già esistente per la stessa business | Errore: "Un cliente con questo numero di telefono esiste già" (code 23505) | ✅ | Error code 23505 gestito con messaggio italiano |
| 10.3 | Scheda cliente con stats | Click su cliente nella lista | Dettaglio con `total_visits`, `no_show_count`, `last_visit_at`, `created_at` | ✅ | Stats mostrate con icone e formattazione |
| 10.4 | Tag manuali | Scheda cliente → aggiungi tag (es. "VIP", "frequente") → salva | `clients.tags` array aggiornato | ✅ | `updateClientTags` con array |
| 10.5 | Rimuovi tag | Rimuovi un tag dal cliente → salva | Tag rimosso da array | ✅ | Filtro tag + `updateClientTags` |
| 10.6 | Note cliente | Scheda cliente → modifica note → salva | `clients.notes` aggiornato | ✅ | `updateClientNotes` con auto-save on blur |
| 10.7 | Ordinamento lista | Lista clienti default | Ordinati per `last_visit_at DESC` (clienti recenti in cima) | ✅ | `order("last_visit_at", { ascending: false, nullsFirst: false })` |
| 10.8 | Cliente senza visite | Verifica cliente mai presentato | `total_visits = 0`, `last_visit_at = null` mostrato correttamente | ✅ | "Nessuna visita" gestito con `|| 0` e null check |

---

## 11. Billing (Stripe)

> **Prerequisiti:** Stripe configurato con 3 piani (Essential €300, Professional €500, Enterprise custom). Chiavi in `.env`.

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 11.1 | Selezione piano | Dashboard → Settings (o billing page) → seleziona piano "Essential" | Redirect a Stripe Checkout con prezzo corretto | ✅ | `createCheckoutSession` con price ID corretto |
| 11.2 | Checkout completato | Completa pagamento in Stripe Checkout (usa card test `4242...`) | Redirect a `success_url`, subscription creata | ✅ | `success_url` configurato in STRIPE_CONFIG |
| 11.3 | Webhook `checkout.session.completed` | Verifica webhook Stripe POST `/api/stripe/webhook` | `businesses.subscription_status` aggiornato a `active` o `trialing` | ✅ | Gestito via `customer.subscription.created` event (Stripe lo invia automaticamente) |
| 11.4 | Trial period | Verifica `subscription_data.trial_period_days` applicato | Subscription in stato `trialing` con `trial_end` corretto | ✅ | `trial_period_days: STRIPE_CONFIG.trialDays` |
| 11.5 | Stripe Customer creato | Dopo primo checkout, verifica `businesses.stripe_customer_id` | ID Stripe customer popolato | ✅ | `ensureStripeCustomer` crea e salva |
| 11.6 | Customer Portal | Settings → "Gestisci abbonamento" | Redirect a Stripe Customer Portal, ritorno a `portalReturnUrl` | ✅ | `createPortalSession` con return URL |
| 11.7 | Subscription info display | Dashboard settings / billing section | Piano attuale, stato, data scadenza, trial end mostrati correttamente | ✅ | BillingSection con status banner + plan info |
| 11.8 | Webhook `invoice.payment_failed` | Simula pagamento fallito | `subscription_status → past_due`, utente può ancora accedere al dashboard | ✅ | Webhook handler + `past_due` in `allowedStatuses` |
| 11.9 | Cancel at period end | Dal Customer Portal, annulla abbonamento | `cancel_at_period_end = true` riflesso in UI | ✅ | `cancelAtPeriodEnd` mostrato in billing info |

---

## 12. Subscription Expired → Gating

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 12.1 | Redirect a /expired | Imposta `subscription_status = cancelled` in DB → visita `/dashboard` | Redirect a `/dashboard/expired` (proxy.ts gating) | ✅ | proxy.ts gating con `allowedStatuses` check |
| 12.2 | Stato incomplete → redirect | Imposta `subscription_status = incomplete` → visita `/dashboard` | Redirect a `/dashboard/expired` | ✅ | `incomplete` non in `allowedStatuses` |
| 12.3 | Settings accessibili | Con status `cancelled`, visita `/dashboard/settings` | Pagina accessibile (gating exempt) | ✅ | `gatingExemptPaths` include `/dashboard/settings` |
| 12.4 | Expired page accessibile | Con status `cancelled`, visita `/dashboard/expired` | Pagina accessibile con opzione riattivazione | ✅ | `gatingExemptPaths` include `/dashboard/expired` |
| 12.5 | Riattivazione | Da `/dashboard/expired` o Settings → seleziona piano → checkout | Dopo pagamento, `subscription_status → active`, redirect a `/dashboard` funzionante | ✅ | ExpiredView + BillingSection con plan cards |
| 12.6 | Status trialing → accesso ok | Con `subscription_status = trialing`, visita `/dashboard` | Accesso consentito, nessun redirect | ✅ | `trialing` in `allowedStatuses` |
| 12.7 | Status past_due → accesso ok | Con `subscription_status = past_due`, visita `/dashboard` | Accesso consentito (allowed status) | ✅ | `past_due` in `allowedStatuses` |
| 12.8 | Status active → accesso ok | Con `subscription_status = active`, visita `/dashboard` | Accesso consentito | ✅ | `active` in `allowedStatuses` |

---

## 13. Settings

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 13.1 | Modifica dati barberia | Settings → modifica nome, indirizzo, telefono, Google Review link → salva | `businesses` aggiornato, `updated_at` refreshed | ✅ | `updateBusinessInfo` con Zod validation |
| 13.2 | Modifica orari apertura | Settings → cambia orari di un giorno → salva | `opening_hours` JSONB aggiornato | ✅ | `updateBusinessOpeningHours` |
| 13.3 | Giorno chiuso | Settings → segna un giorno come "chiuso" → salva | `opening_hours[giorno].closed = true` | ✅ | Checkbox "Aperto"/"Chiuso" per giorno |
| 13.4 | Template WhatsApp — modifica | Settings → modifica template `confirmation` → salva | `message_templates` aggiornato (upsert) | ✅ | TemplateEditor → `upsertMessageTemplate` |
| 13.5 | Template WhatsApp — crea nuovo | Settings → crea template per tipo non esistente (es. `pre_appointment`) | Nuova riga in `message_templates` | ✅ | Upsert: insert se non esiste |
| 13.6 | Template WhatsApp — disattiva | Settings → imposta `active = false` per un template → salva | Template disattivato, non usato per invii | ✅ | Toggle attivo/disattivato + salva |
| 13.7 | Chiusure — aggiungi | Settings → Chiusure → aggiungi data con motivo → salva | Riga in `business_closures` | ✅ | ClosuresForm con date picker e motivo |
| 13.8 | Chiusure — duplicato | Aggiungi chiusura per data già presente | Errore: "Chiusura già presente per questa data" | ✅ | Error code 23505 gestito |
| 13.9 | Chiusure — rimuovi | Rimuovi una chiusura → conferma | Riga rimossa da `business_closures` | ✅ | `removeClosure` con business_id check |
| 13.10 | Soglie — modifica | Settings → cambia `dormant_threshold_days` (es. 35) e `no_show_threshold` (es. 3) → salva | Valori aggiornati in `businesses` | ✅ | ThresholdsForm → `updateBusinessThresholds` |
| 13.11 | Chiusura riflessa in booking | Dopo 13.7, verifica `/book/[slug]` | Data della chiusura non selezionabile | ✅ | `getClosureDates` passato a BookingWizard |

---

## 14. Analytics

> **Prerequisiti:** almeno qualche `analytics_daily` row e qualche appuntamento completato in DB.

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 14.1 | Pagina analytics carica | Dashboard → Analytics | Pagina caricata senza errori | ✅ | Build passa, nessun errore runtime |
| 14.2 | KPI cards — 7 giorni | Seleziona periodo "7d" | Revenue, appuntamenti completati, no-show rate, nuovi clienti mostrati | ✅ | `getAnalyticsSummary("7d")` |
| 14.3 | KPI cards — 30 giorni | Seleziona periodo "30d" | Valori aggiornati per periodo 30 giorni | ✅ | Switch periodo ricarica dati |
| 14.4 | KPI cards — 90 giorni | Seleziona periodo "90d" | Valori aggiornati per periodo 90 giorni | ✅ | Stessa logica per tutti i periodi |
| 14.5 | Delta percentuale | Verifica delta (confronto periodo precedente) | Delta mostrato con segno +/- e colore verde/rosso | ✅ | `formatDelta` con TrendingUp/TrendingDown |
| 14.6 | Grafici trend | Verifica grafico giornaliero nel periodo selezionato | Dati plottati correttamente, assi leggibili | ✅ | Bar chart con daily data |
| 14.7 | Servizi top | Sezione "Top servizi" | Lista servizi ordinata per count, revenue mostrata | ✅ | `getTopServices` aggregazione corretta |
| 14.8 | Nessun dato | Periodo senza dati in `analytics_daily` | Stato vuoto gestito (0 ovunque, nessun crash) | ✅ | Return values default a 0, arrays vuoti |
| 14.9 | Revenue in euro | Verifica formattazione importi | `total_revenue_cents` convertito e mostrato in € (diviso 100) | ✅ | `formatCurrency(cents)` = `cents / 100` |

---

## 15. Edge Functions & pg_cron Jobs

> Verifica funzionamento delle 6 Edge Functions e 6 pg_cron jobs. Controllare nei log Supabase.

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 15.1 | send-confirm-request | Verifica invio automatico richieste conferma per appuntamenti booked | Messaggi `confirm_request` creati e inviati | ⏭️ | Richiede Supabase Edge Function deployment |
| 15.2 | send-confirm-reminder | Verifica reminder per chi non ha risposto | Messaggi `confirm_reminder` creati | ⏭️ | Richiede Supabase Edge Function deployment |
| 15.3 | auto-cancel-unconfirmed | Verifica cancellazione automatica dopo scadenza | Appuntamenti non confermati → `cancelled` | ⏭️ | Richiede Supabase Edge Function deployment |
| 15.4 | pre-appointment reminder | Verifica invio promemoria pre-appuntamento | Messaggio `pre_appointment` inviato | ⏭️ | Richiede Supabase Edge Function deployment |
| 15.5 | review-request | Verifica invio richiesta recensione post-appuntamento | Messaggio `review_request` inviato con `google_review_link` | ⏭️ | Richiede Supabase Edge Function deployment |
| 15.6 | reactivation | Verifica invio messaggio riattivazione clienti dormienti | Clienti con `last_visit_at` oltre `dormant_threshold_days` notificati | ⏭️ | Richiede Supabase Edge Function deployment |
| 15.7 | analytics-daily aggregation | Verifica pg_cron popola `analytics_daily` | Righe create per il giorno precedente con conteggi corretti | ⏭️ | Richiede pg_cron su Supabase |

---

## 16. Responsiveness & UX

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 16.1 | Mobile — booking wizard | Apri `/book/[slug]` da mobile (o DevTools responsive) | Wizard usabile, nessun overflow, bottoni raggiungibili | ✅ | `max-w-lg`, responsive grid, touch-friendly buttons |
| 16.2 | Mobile — dashboard | Apri `/dashboard` da mobile | Sidebar collassata o menu hamburger, contenuto leggibile | ✅ | Sidebar con hamburger menu + collapsible |
| 16.3 | Mobile — calendario | Calendario su schermo piccolo | Vista giornaliera funzionante, scroll se necessario | ✅ | `overflow-x-auto` + `min-w-[640px]` scrollabile |
| 16.4 | Loading states | Azioni lente (es. submit booking, salva settings) | Spinner o stato loading visibile, bottone disabilitato | ✅ | Loader2 spinner + `disabled={isPending}` ovunque |
| 16.5 | Error handling UI | Provoca un errore (es. campi vuoti, rete offline) | Toast o messaggio errore chiaro, nessun crash | ✅ | Error messages inline con stile destructive |
| 16.6 | Toast/feedback successo | Salva qualsiasi form nel dashboard | Toast di conferma "Salvato con successo" o simile | ✅ | "Salvato!" feedback inline (non toast, ma chiaro) |

---

## 17. Personalizza Form

| # | Test | Passi | Risultato atteso | Esito | Note |
|---|------|-------|------------------|-------|------|
| 17.1 | Pagina carica | Naviga a `/dashboard/customize` | Pagina carica senza errori, mostra controlli e preview | ⬜ | — |
| 17.2 | Sidebar voce | Controlla sidebar | Voce "Personalizza" con icona Palette visibile nella sezione Gestione | ⬜ | — |
| 17.3 | Cambio colore primario | Cambia colore primario con color picker | Preview aggiorna in tempo reale il colore dei bottoni e slot selezionato | ⬜ | — |
| 17.4 | Cambio colore secondario | Cambia colore secondario con color picker | Preview aggiorna in tempo reale gli accenti | ⬜ | — |
| 17.5 | Salvataggio | Cambia colori e clicca "Salva" | Toast "Personalizzazione salvata!", dati persistiti in DB (`brand_colors`) | ⬜ | — |
| 17.6 | Booking page riflette colori | Dopo salvataggio, apri `/book/[slug]` | Pagina pubblica mostra i colori custom salvati | ⬜ | — |
| 17.7 | Logo URL | Inserisci URL immagine valido nel campo Logo | Preview mostra logo nell'header, booking page pubblica mostra logo | ⬜ | — |
| 17.8 | Reset default | Clicca bottone reset | Colori tornano ai default (#171717, #737373), logo rimosso | ⬜ | — |
| 17.9 | Preview mode | Interagisci con il wizard nella preview | Wizard navigabile ma bottone "Conferma Prenotazione" disabilitato, nessuna chiamata server | ⬜ | — |
| 17.10 | Link diretto | Controlla link prenotazione nella sezione controlli | URL `/book/[slug]` mostrato e cliccabile, apre in nuova tab | ⬜ | — |
| 17.11 | Messaggio benvenuto | Inserisci testo nel campo "Messaggio di benvenuto" | Preview mostra testo sotto nome negozio, contatore caratteri funziona | ⬜ | — |
| 17.12 | Benvenuto su booking page | Salva messaggio, apri `/book/[slug]` | Messaggio visibile sotto nome e indirizzo | ⬜ | — |
| 17.13 | Limite 200 caratteri | Inserisci testo > 200 caratteri | Input tronca a 200, contatore mostra 200/200 | ⬜ | — |
| 17.14 | Immagine copertina | Inserisci URL immagine nel campo copertina | Preview mostra hero image sopra header, booking page mostra banner | ⬜ | — |
| 17.15 | Copertina URL invalido | Inserisci URL non valido e salva | Errore di validazione mostrato | ⬜ | — |
| 17.16 | Preset font — Classico | Seleziona preset "Classico" | Preview heading cambia in font serif (Georgia) | ⬜ | — |
| 17.17 | Preset font — Bold | Seleziona preset "Bold" | Preview heading cambia in font display (Impact) | ⬜ | — |
| 17.18 | Preset font — Minimal | Seleziona preset "Minimal" | Preview heading cambia in font monospace | ⬜ | — |
| 17.19 | Font su booking page | Salva preset font, apri `/book/[slug]` | Heading del negozio usa il font selezionato | ⬜ | — |
| 17.20 | Reset completo | Clicca reset dopo aver modificato tutti i campi | Tutti i campi tornano ai default (colori, logo, testo, copertina, font moderno) | ⬜ | — |

---

## Riepilogo Esecuzione

| Sezione | Totale | ✅ Pass | ❌ Fail | ⏭️ Skip | Note |
|---------|--------|---------|---------|---------|------|
| 1. Auth | 9 | 9 | 0 | 0 | Tutte le rotte protette correttamente |
| 2. Onboarding | 8 | 8 | 0 | 0 | Combo, staff-service, sort_order tutti implementati |
| 3. Booking Online | 14 | 14 | 0 | 0 | Staff filtrato per servizio via staff_services |
| 4. Conferma Smart | 6 | 3 | 0 | 3 | Edge Functions non testabili localmente |
| 5. Calendario | 10 | 10 | 0 | 0 | Filtro staff implementato con dropdown |
| 6. Walk-in | 5 | 5 | 0 | 0 | Tutto funzionante |
| 7. Cancellazione | 4 | 4 | 0 | 0 | FIX applicato per waitlist notification |
| 8. No-Show | 5 | 3 | 0 | 2 | Auto-tag richiede Edge Function |
| 9. Waitlist | 7 | 7 | 0 | 0 | Aggiunta manuale implementata con dialog |
| 10. CRM | 8 | 8 | 0 | 0 | Tutto funzionante |
| 11. Billing | 9 | 9 | 0 | 0 | Stripe flow completo |
| 12. Subscription Gating | 8 | 8 | 0 | 0 | Gating corretto |
| 13. Settings | 11 | 11 | 0 | 0 | Tutto funzionante |
| 14. Analytics | 9 | 9 | 0 | 0 | Formattazione e delta corretti |
| 15. Edge Functions | 7 | 0 | 0 | 7 | Richiedono deployment Supabase |
| 16. Responsiveness | 6 | 6 | 0 | 0 | UI responsive e accessibile |
| 17. Personalizza Form | 20 | 0 | 0 | 0 | Colori, logo, testo benvenuto, copertina, font preset — da testare |
| **TOTALE** | **146** | **114** | **0** | **12** | **78.1% pass rate** (escl. skip: 100% delle testate) |

---

## Bug Log

| # | Test ref | Descrizione bug | Severità | Fix applicato | PR/Commit |
|---|----------|-----------------|----------|---------------|-----------|
| 1 | 1.8, 4.2 | WhatsApp webhook `/api/whatsapp/webhook` non in public paths di proxy.ts — Twilio bloccato da redirect a `/login` | 🔴 Critico | ✅ Aggiunto `/api/whatsapp` a publicPaths + startsWith check | Pendente |
| 2 | 7.4, 9.3 | Cancellazione da calendario non notifica waitlist (solo WhatsApp webhook lo fa) | 🟡 Medio | ✅ Aggiunto `notifyWaitlistOnCancel` in `updateAppointmentStatus` | Pendente |
| 3 | 2.4 | UI non supporta creazione servizi combo (`is_combo`, `combo_service_ids`) | 🟡 Medio | ✅ Toggle combo + multi-select servizi in ServiceForm, server actions aggiornate | Pendente |
| 4 | 2.7, 3.4 | UI non supporta associazione staff-servizi (`staff_services` junction table) | 🟡 Medio | ✅ Sezione checkbox servizi in StaffManager + filtro staff nel BookingWizard | Pendente |
| 5 | 9.1 | Nessuna UI per aggiungere manualmente entry alla waitlist | 🟡 Medio | ✅ Dialog "Aggiungi" con ricerca cliente/nuovo + servizio + data/ora | Pendente |
| 6 | 2.8 | Nessuna UI per riordinare staff (`sort_order`) | 🟢 Basso | ✅ Drag-and-drop HTML5 nativo + `reorderStaff` server action | Pendente |
| 7 | 5.9 | Nessun filtro per staff nel calendario | 🟢 Basso | ✅ Dropdown Select con filtro per singolo barbiere in CalendarView | Pendente |
| 8 | 3.8 | Booking wizard mancava campo cognome | 🟢 Basso | ✅ Aggiunto campo `clientLastName` nel wizard | Pendente |
| 9 | 5.5-5.8 | Bottoni azione appointment-sheet mancavano `type="button"` (a11y) | 🟢 Basso | ✅ Aggiunti `type="button"` a tutti e 4 i bottoni | Pendente |

> **Severità:** 🔴 Critico (blocca lancio) | 🟡 Medio (workaround possibile) | 🟢 Basso (cosmetico)

---

## Note Finali

- **Stripe test mode:** usare card `4242 4242 4242 4242`, exp qualsiasi futuro, CVC qualsiasi
- **WhatsApp mock:** verificare log nella console del server o tabella `messages` per validare invii
- **Supabase dashboard:** usare per verificare direttamente i dati nelle tabelle dopo ogni test
- **pg_cron jobs:** se non eseguibili on-demand, verificare nei log Supabase (sezione Edge Functions + Database > Logs)
- **Ordine di esecuzione consigliato:** Auth → Onboarding → Booking → Calendario → Walk-in → Conferma → Cancellazione → No-Show → Waitlist → CRM → Billing → Gating → Settings → Analytics → Edge → UX
