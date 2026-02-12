BARBEROS — PIANI E PREZZI

Ultimo aggiornamento: 12 febbraio 2026

---

3 PIANI DISPONIBILI

Setup una tantum: €500 (addebitato via Stripe al checkout, insieme al primo pagamento)
Include: analisi barberia, configurazione completa, import clienti, training personalizzato, 30 giorni supporto premium.
Stripe Product: Setup & Onboarding BarberOS (prod_Txi5JcLgAyUgxl)
Stripe Price: price_1SzmfYK75hVrlrvakliriMVK (€500 one-time)
Flag DB: setup_fee_paid + setup_fee_paid_at su businesses — se true, non viene più addebitato (no doppio addebito su resubscribe)
Webhook: checkout.session.completed → match su product ID (STRIPE_PRODUCT_SETUP) → setta flag + timestamp
Enterprise: Setup White Glove €1.500-€2.000 (gestito manualmente, non su Stripe)

Trial: 7 giorni gratuiti per tutti i piani (funzionalità limitate al piano scelto)
Fatturazione: mensile, tramite Stripe
Contratto: nessun vincolo, disdici quando vuoi
Pagamento: carta di credito/debito (Visa, Mastercard, Amex), Apple Pay, Google Pay

---

PIANO ESSENTIAL — €300/mese

Per barberie con 1-2 poltrone.

- Booking online con link personalizzato
- Calendario multi-poltrona
- CRM clienti con tag e note
- WhatsApp automatico (conferma, reminder, cancellazione)
- Lista d'attesa intelligente
- Analytics base
- Chiusure straordinarie

Stripe Product: BarberOS Essential (prod_TwyoUI0JLvWcj3)
Stripe Price: price_1Sz4yuK75hVrlrva5iqHgE52 (€300/mese ricorrente)

---

PIANO PROFESSIONAL — €500/mese (consigliato)

Per barberie con 3-5 poltrone.

Tutto Essential +
- AI integrata (riattivazione, suggerimenti)
- Analytics avanzati per poltrona e barbiere
- Campagne WhatsApp broadcast
- Supporto prioritario

Stripe Product: BarberOS Professional (prod_TwypWo5jLd3doz)
Stripe Price: price_1Sz4yvK75hVrlrvaemSc8lLf (€500/mese ricorrente)

---

PIANO ENTERPRISE — Prezzo custom

Per barberie multi-sede.

Tutto Professional +
- Configurazione dedicata
- SLA garantito
- Account manager dedicato
- Multi-sede

Stripe Product: BarberOS Enterprise (prod_TwyphvT1F82GrB)
Prezzo: gestito manualmente, contattare giovannidifonzobusiness@gmail.com

---

FEATURES COMUNI A TUTTI I PIANI

Calendario e Prenotazioni
- Calendario giornaliero e settimanale con vista per barbiere
- Pagina prenotazione pubblica con link condivisibile (/book/slug)
- Walk-in: aggiunta manuale clienti dalla dashboard
- Gestione stati: prenotato, confermato, completato, cancellato, no-show

Gestione Staff
- Profili barbiere limitati per piano (Essential: max 2, Professional: max 5, Enterprise: illimitato)
- Orari di lavoro personalizzati per ogni barbiere (7 giorni, pausa pranzo)
- Associazione servizi per barbiere: ogni barbiere può essere abilitato solo ai servizi che sa eseguire
  - Il cliente nella pagina di prenotazione vede solo i barbieri abilitati al servizio scelto
  - Se nessun barbiere ha servizi configurati, tutti appaiono per ogni servizio (retrocompatibile)
- Logica orari intelligente: gli slot disponibili sono calcolati come INTERSEZIONE tra orari di apertura del negozio e orari di lavoro del barbiere
  - Esempio: negozio aperto fino alle 19:00, barbiere lavora fino alle 17:00 il sabato → slot fino alle 16:30 (ultimo slot da 30 min)
  - Esempio: negozio aperto fino alle 21:00 il giovedì, barbiere lavora fino alle 19:00 → slot fino alle 18:30
  - Se il barbiere è in giorno di riposo → nessuno slot, anche se il negozio è aperto
  - Se il negozio è chiuso → nessuno slot, anche se il barbiere è disponibile
- Attivazione/disattivazione senza perdere storico
- Drag & drop per riordinare i barbieri nella pagina di prenotazione

Gestione Servizi
- Servizi illimitati con nome, durata, prezzo
- Durate predefinite: 15, 30, 45, 60, 75, 90, 105 o 120 minuti (incrementi di 15 min)
  - Garantisce compatibilità con la griglia slot del booking
  - Selezione tramite dropdown (non input libero) per evitare errori
- Servizi combo (es. taglio + barba)
- Ordine visualizzazione personalizzabile
- Attivazione/disattivazione

CRM Clienti
- Schede cliente automatiche (create alla prima prenotazione)
- Ricerca per nome o telefono
- Tag manuali e automatici (VIP, Nuovo, Problematico, Affidabile, Non conferma)
- Note libere per preferenze cliente
- Storico visite e contatore no-show

Automazioni WhatsApp
- Conferma prenotazione istantanea (tutti i piani)
- Sistema conferma intelligente: richiesta + reminder + auto-cancellazione (tutti i piani)
- Reminder pre-appuntamento ~2h prima (tutti i piani)
- Richiesta recensione Google automatica post-appuntamento (solo Professional/Enterprise)
- Riattivazione clienti dormienti con soglia configurabile (solo Professional/Enterprise)
- Tag automatici clienti: "Affidabile" / "Non conferma" (solo Professional/Enterprise)
- Template personalizzabili per ogni tipo di messaggio
- Comandi cliente: CONFERMA, CANCELLA, CAMBIA ORARIO, SI

Lista d'Attesa
- Iscrizione automatica su slot pieno
- Notifica WhatsApp al primo in lista quando si libera uno slot
- Conversione automatica con risposta "SI"

Analytics
- KPI: fatturato, completati, no-show rate, nuovi clienti
- Grafici giornalieri fatturato e appuntamenti
- Classifica servizi più richiesti
- Breakdown clienti nuovi vs ricorrenti
- Filtro periodo: 7gg / 30gg / 90gg

Impostazioni
- Dati barberia, orari apertura, chiusure straordinarie
- Link Google Review per recensioni automatiche
- Regole automatiche (soglia dormiente, soglia no-show)
- Stato connessione WhatsApp
- Gestione abbonamento (attivazione, cambio piano, cancellazione dal dashboard con conferma, riattivazione)

---

COSTI INFRASTRUTTURA (per il team)

| Servizio | Costo mensile | Note |
|----------|--------------|-------|
| Supabase Pro | $25 | Database, Auth, Edge Functions, pg_cron |
| Vercel Pro | $20 | Hosting frontend + Server Actions |
| Twilio WhatsApp | ~€0.05/msg | Business API, volume-based |
| Stripe fees | 1.5% + €0.25/txn | Su abbonamenti (area EUR) |
| Dominio + Cloudflare | ~€15/anno | DNS, CDN, SSL |

Costo fisso infrastruttura: ~€50/mese
Costo variabile WhatsApp: ~€3-5/barbiere/mese (stima 60-100 msg/mese)

---

MARGINI (stima con mix Essential/Professional)

| Clienti | Revenue mensile (media €400/cl) | Costi infra | Margine lordo |
|---------|-------------------------------|-------------|---------------|
| 5 | €2.000 | ~€80 | ~€1.920 (96%) |
| 10 | €4.000 | ~€120 | ~€3.880 (97%) |
| 20 | €8.000 | ~€200 | ~€7.800 (97%) |
| 50 | €20.000 | ~€400 | ~€19.600 (98%) |

Nota: revenue media €400/cliente assume mix 60% Essential (€300) + 40% Professional (€500).
Nota: i costi Twilio scalano con il volume messaggi. Stripe prende ~1.5% + €0.25 per transazione su carta EU.
Nota: setup €500 una tantum non incluso nella tabella (addebitato via Stripe al checkout).

---

STRIPE SETUP

4 Prodotti Stripe:
- BarberOS Essential (prod_TwyoUI0JLvWcj3) → price_1Sz4yuK75hVrlrva5iqHgE52 (€300/mese ricorrente)
- BarberOS Professional (prod_TwypWo5jLd3doz) → price_1Sz4yvK75hVrlrvaemSc8lLf (€500/mese ricorrente)
- BarberOS Enterprise (prod_TwyphvT1F82GrB) → prezzo custom (gestito manualmente)
- Setup & Onboarding BarberOS (prod_Txi5JcLgAyUgxl) → price_1SzmfYK75hVrlrvakliriMVK (€500 one-time)

Vecchio prodotto "Barberos Pro" (prod_TwyPNdkh0a8xAT) → deprecato, non più usato.

Setup fee: €500 una tantum, addebitato subito al checkout come secondo line_items[]
- Se setup_fee_paid = true nel DB → non viene aggiunto (no doppio addebito su resubscribe)
- Webhook checkout.session.completed: processCheckoutCompleted() fa listLineItems → match su product ID (STRIPE_PRODUCT_SETUP) → setta setup_fee_paid=true + setup_fee_paid_at

Trial: 7 giorni (configurato in STRIPE_CONFIG.trialDays)
- Il trial rispetta il piano scelto (Essential → limiti Essential, Professional → limiti Professional)
- Setup fee addebitato subito, subscription parte dopo 7 giorni
Codici promozionali: abilitati in Checkout (allow_promotion_codes: true) — supporta coupon e referral code
Customer Portal: attivo per gestione self-service (cambio carta, cancellazione, fatture)

Env vars:
- STRIPE_SECRET_KEY → sk_live_... (server-only)
- STRIPE_WEBHOOK_SECRET → whsec_... (da configurare quando c'è il dominio)
- STRIPE_PRICE_ESSENTIAL → price_1Sz4yuK75hVrlrva5iqHgE52
- STRIPE_PRICE_PROFESSIONAL → price_1Sz4yvK75hVrlrvaemSc8lLf
- STRIPE_PRICE_SETUP → price_1SzmfYK75hVrlrvakliriMVK
- STRIPE_PRODUCT_SETUP → prod_Txi5JcLgAyUgxl (product ID per matching robusto nel webhook)

Webhook eventi gestiti:
- customer.subscription.created → sync status + piano su DB
- customer.subscription.updated → sync status + piano su DB
- customer.subscription.deleted → status → cancelled
- checkout.session.completed → processCheckoutCompleted() (setup fee via product ID matching)
- invoice.paid → status → active + processReferralReward()
- invoice.payment_failed → status → past_due

Stati abbonamento nel DB (subscription_status enum):
- trialing → prova gratuita (default alla registrazione)
- active → abbonamento attivo
- past_due → pagamento fallito
- cancelled → cancellato
- incomplete → setup non completato

---

FLUSSO UTENTE

1. Registrazione → business creata con subscription_status = trialing, stripe_customer_id = null
2. Redirect automatico a /dashboard/expired (scelta piano obbligatoria)
   - proxy.ts: utenti trialing senza stripe_customer_id → redirect a scelta piano
   - UI: icona Rocket, "Scegli il tuo piano", "Hai 7 giorni di prova gratuita"
3. Scelta piano (Essential/Professional) → redirect a Stripe Checkout
   - Line items: subscription (trial 7gg) + setup fee €500 (one-time, addebitato subito)
   - Se referral: sconto 20% primo mese (coupon REFERRAL_20_OFF)
4. Pagamento setup fee (€500 addebitato subito) → webhook checkout.session.completed → setup_fee_paid=true
   webhook subscription.created → status = trialing, piano salvato
5. 7 giorni di prova con funzionalità del piano scelto (Essential: max 2 staff, Professional: max 5)
6. Al termine trial: Stripe addebita primo mese → webhook invoice.paid → status = active
7. Gestione autonoma: "Gestisci abbonamento" → Stripe Customer Portal, oppure "Cancella abbonamento" dal dashboard → cancellazione soft (resta attivo fino a fine periodo) → possibilità di riattivare prima della scadenza
8. Se cancella e riabbona: setup fee NON riaddebitato (setup_fee_paid = true)
9. Enterprise: contatto diretto via email → setup manuale

---

PROSSIMI PASSI

- Sconto annuale: 2 mesi gratis (€3.000/anno Essential, €5.000/anno Professional)
- Add-on WhatsApp: sovrapprezzo se messaggi > 200/mese
