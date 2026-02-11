BARBEROS — PIANI E PREZZI

Ultimo aggiornamento: 11 febbraio 2026

---

3 PIANI DISPONIBILI

Setup una tantum: €1.000 (fatturato separatamente, non su Stripe)
Include: analisi barberia, configurazione completa, import clienti, training personalizzato, 30 giorni supporto premium.

Trial: 7 giorni gratuiti per tutti i piani (tutte le funzionalità)
Fatturazione: mensile, tramite Stripe
Contratto: 12 mesi
Pagamento: carta di credito/debito (Visa, Mastercard, Amex), Apple Pay, Google Pay
Garanzia risultati: se dopo 3 mesi non vedi un ritorno almeno 2x, esci senza penali.

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
- Profili barbiere illimitati
- Orari di lavoro personalizzati per ogni barbiere (7 giorni, pausa pranzo)
- Attivazione/disattivazione senza perdere storico

Gestione Servizi
- Servizi illimitati con nome, durata, prezzo
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
- Conferma prenotazione istantanea
- Sistema conferma intelligente (richiesta + reminder + auto-cancellazione)
- Reminder pre-appuntamento (~2h prima)
- Richiesta recensione Google automatica post-appuntamento
- Riattivazione clienti dormienti (soglia configurabile)
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
- Gestione abbonamento (attivazione, cambio piano, cancellazione)

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
Nota: setup €1.000 una tantum non incluso nella tabella (fatturato separatamente).

---

STRIPE SETUP

3 Prodotti Stripe:
- BarberOS Essential (prod_TwyoUI0JLvWcj3) → price_1Sz4yuK75hVrlrva5iqHgE52 (€300/mese)
- BarberOS Professional (prod_TwypWo5jLd3doz) → price_1Sz4yvK75hVrlrvaemSc8lLf (€500/mese)
- BarberOS Enterprise (prod_TwyphvT1F82GrB) → prezzo custom (gestito manualmente)

Vecchio prodotto "Barberos Pro" (prod_TwyPNdkh0a8xAT) → deprecato, non più usato.

Trial: 7 giorni (configurato in STRIPE_CONFIG.trialDays)
Codici promozionali: abilitati in Checkout (allow_promotion_codes: true) — supporta coupon e referral code
Customer Portal: attivo per gestione self-service (cambio carta, cancellazione, fatture)

Env vars:
- STRIPE_SECRET_KEY → sk_live_... (server-only)
- STRIPE_WEBHOOK_SECRET → whsec_... (da configurare quando c'è il dominio)
- STRIPE_PRICE_ESSENTIAL → price_1Sz4yuK75hVrlrva5iqHgE52
- STRIPE_PRICE_PROFESSIONAL → price_1Sz4yvK75hVrlrvaemSc8lLf

Webhook eventi gestiti:
- customer.subscription.created → sync status su DB
- customer.subscription.updated → sync status su DB
- customer.subscription.deleted → status → cancelled
- invoice.paid → status → active
- invoice.payment_failed → status → past_due

Stati abbonamento nel DB (subscription_status enum):
- trialing → prova gratuita (default alla registrazione)
- active → abbonamento attivo
- past_due → pagamento fallito
- cancelled → cancellato
- incomplete → setup non completato

---

FLUSSO UTENTE

1. Registrazione gratuita → business creata con subscription_status = trialing
2. 7 giorni di prova completa (tutte le funzionalità)
3. Al termine: sezione "Abbonamento" in Impostazioni → 3 card piani
4. Scelta piano (Essential/Professional) → redirect a Stripe Checkout
5. Pagamento → webhook → status = active, piano salvato in metadata
6. Gestione autonoma da "Gestisci abbonamento" → Stripe Customer Portal
7. Enterprise: contatto diretto via email → setup manuale

---

PROSSIMI PASSI

- Configurare webhook Stripe quando il dominio è pronto
- Aggiungere gating: bloccare funzionalità se subscription scaduta
- Sconto annuale: 2 mesi gratis (€3.000/anno Essential, €5.000/anno Professional)
- Add-on WhatsApp: sovrapprezzo se messaggi > 200/mese
