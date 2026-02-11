BARBEROS MVP — GUIDA CREDENZIALI E CONFIGURAZIONE SERVIZI

Ultimo aggiornamento: 11 febbraio 2026

Questa guida copre:
- Dove trovare ogni credenziale, passo per passo
- Come configurare webhook e servizi esterni
- Come verificare che tutto funzioni
- Come passare da sandbox a produzione (WhatsApp)
- Come gestire sub-account per clienti barbieri (futuro)

Utile per: prima configurazione, nuovi ambienti, onboarding sviluppatori,
setup clienti barbieri.

---

STATO CONFIGURAZIONE ATTUALE

| Servizio | Stato | Note |
|----------|-------|------|
| Supabase (DB + Auth + Edge Functions) | ✅ Configurato | Progetto wvxkxutaasrblbdmhsny, eu-central-1 |
| Vercel (hosting + server actions) | ✅ Configurato | barberos-mvp.vercel.app |
| Stripe (pagamenti + abbonamenti) | ✅ Configurato | 3 piani, webhook attivo, mode live |
| Twilio WhatsApp (messaggistica) | ✅ Configurato | Sandbox mode, webhook attivo |
| Supabase Edge Functions (cron) | ✅ Configurato | 7 functions, secrets Twilio aggiunti |
| Dominio custom | ❌ Non configurato | Usando barberos-mvp.vercel.app |

---

RIEPILOGO VARIABILI D'AMBIENTE

Tutte le variabili vanno configurate su Vercel (Settings > Environment Variables)
e, dove indicato, anche su Supabase Edge Functions.

| # | Variabile | Servizio | Tipo | Dove su Vercel | Stato |
|---|-----------|----------|------|----------------|-------|
| 1 | NEXT_PUBLIC_SUPABASE_URL | Supabase | Pubblica | Dev + Preview + Prod | ✅ |
| 2 | NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase | Pubblica | Dev + Preview + Prod | ✅ |
| 3 | SUPABASE_SERVICE_ROLE_KEY | Supabase | Segreta | All Environments | ✅ |
| 4 | NEXT_PUBLIC_APP_URL | Vercel | Pubblica | All Environments | ✅ |
| 5 | STRIPE_SECRET_KEY | Stripe | Segreta | All Environments | ✅ |
| 6 | STRIPE_WEBHOOK_SECRET | Stripe | Segreta | All Environments | ✅ |
| 7 | STRIPE_PRICE_ESSENTIAL | Stripe | Segreta | Preview + Prod | ✅ |
| 8 | STRIPE_PRICE_PROFESSIONAL | Stripe | Segreta | Preview + Prod | ✅ |
| 9 | TWILIO_ACCOUNT_SID | Twilio | Segreta | All Environments | ✅ |
| 10 | TWILIO_AUTH_TOKEN | Twilio | Segreta | All Environments | ✅ |
| 11 | TWILIO_WHATSAPP_FROM | Twilio | Segreta | All Environments | ✅ |

Configurazioni webhook esterne:

| # | Configurazione | Dove | URL configurato | Stato |
|---|---------------|------|-----------------|-------|
| 1 | Webhook Stripe | Stripe Dashboard > Webhook | https://barberos-mvp.vercel.app/api/stripe/webhook | ✅ |
| 2 | Webhook WhatsApp | Twilio Sandbox Settings | https://barberos-mvp.vercel.app/api/whatsapp/webhook | ✅ |

Secrets su Supabase Edge Functions:

| # | Secret | Stato |
|---|--------|-------|
| 1 | TWILIO_ACCOUNT_SID | ✅ |
| 2 | TWILIO_AUTH_TOKEN | ✅ |
| 3 | TWILIO_WHATSAPP_FROM | ✅ |

Nota: le variabili "Pubblica" (NEXT_PUBLIC_*) sono visibili nel browser.
Le variabili "Segreta" sono solo server-side — MAI esporle lato client.

---

1. SUPABASE

Dove: https://supabase.com/dashboard/project/wvxkxutaasrblbdmhsny/settings/api

1.1 NEXT_PUBLIC_SUPABASE_URL
    - Dashboard Supabase > Settings > API > Project URL
    - Formato: https://[project-id].supabase.co
    - Esempio: https://wvxkxutaasrblbdmhsny.supabase.co

1.2 NEXT_PUBLIC_SUPABASE_ANON_KEY
    - Dashboard Supabase > Settings > API Keys
    - Tab "Legacy anon, service_role API keys"
    - Copia la chiave "anon" (inizia con eyJ...)
    - Questa chiave rispetta le RLS policies — sicura da esporre nel browser

1.3 SUPABASE_SERVICE_ROLE_KEY
    - Dashboard Supabase > Settings > API Keys
    - Tab "Legacy anon, service_role API keys"
    - Copia la chiave "service_role" (inizia con eyJ...)
    - ATTENZIONE: questa chiave BYPASSA tutte le RLS policies
    - Usata SOLO server-side dai webhook (WhatsApp, Stripe)
    - MAI esporre nel browser o in variabili NEXT_PUBLIC_*

Nota: Supabase ha introdotto nuove API keys (Publishable + Secret).
Per ora BarberOS usa le legacy keys (anon + service_role). Le nuove
keys (sb_publishable_*, sb_secret_*) non sono ancora utilizzate.

---

2. VERCEL

2.1 NEXT_PUBLIC_APP_URL
    - E' l'URL pubblico del tuo deploy Vercel
    - Formato: https://[nome-progetto].vercel.app
    - Esempio: https://barberos-mvp.vercel.app
    - SENZA slash finale
    - Usato per:
      - Validazione firma webhook Twilio
      - Redirect dopo checkout/portal Stripe
    - Quando acquisti un dominio custom, aggiorna questa variabile

---

3. STRIPE

Dove: https://dashboard.stripe.com

3.1 STRIPE_SECRET_KEY
    - Dashboard Stripe > Sviluppatori > Chiavi API
    - Sezione "Chiavi standard" > "Chiave privata"
    - Clicca l'icona occhio per rivelare il valore
    - Formato: sk_test_... (test mode) o sk_live_... (live mode)
    - IMPORTANTE: dopo la prima visualizzazione, alcune chiavi non
      possono essere riviste. Salvala subito in un posto sicuro.

    Come creare una nuova chiave (se perdi quella esistente):
    - Dashboard Stripe > Chiavi API > "+ Crea chiave privata"
    - Dai un nome (es. "BarberOS Prod")
    - Copia immediatamente — non sara' piu' visibile

3.2 STRIPE_WEBHOOK_SECRET
    - Dashboard Stripe > Sviluppatori > Webhook
    - Se non esiste un endpoint, creane uno:
      a) Clicca "+ Aggiungi endpoint" (o "Aggiungi destinazione")
      b) Seleziona eventi:
         - customer.subscription.created
         - customer.subscription.updated
         - customer.subscription.deleted
         - invoice.paid
         - invoice.payment_failed
         (puoi aggiungerne altri, il codice ignora quelli non gestiti)
      c) URL endpoint: https://[tuo-dominio]/api/stripe/webhook
      d) Nome: "BarberOS Webhook"
      e) Conferma/Crea
    - Nella pagina dell'endpoint > "Chiave privata della firma digitale"
    - Clicca l'icona occhio per rivelare
    - Formato: whsec_...

    Nota: se cambi dominio, devi creare un NUOVO endpoint webhook
    con il nuovo URL e aggiornare STRIPE_WEBHOOK_SECRET.

3.3 STRIPE_PRICE_ESSENTIAL e STRIPE_PRICE_PROFESSIONAL
    - Questi sono gli ID dei prezzi ricorrenti creati su Stripe
    - Se gia' esistono, li trovi in:
      Dashboard Stripe > Catalogo prodotti > Essential/Professional > Prezzi
    - Formato: price_...
    - Se non esistono, creali con lo script:
      npx tsx scripts/setup-stripe.ts
      (richiede STRIPE_SECRET_KEY configurata in .env.local)
    - Lo script stampa gli ID dei prezzi creati — copiali nelle env vars

---

4. TWILIO (WhatsApp)

Dove: https://console.twilio.com

4.1 TWILIO_ACCOUNT_SID
    - Twilio Console > homepage (dopo login)
    - Sezione "Account Info" > Account SID
    - Formato: AC... (34 caratteri)

4.2 TWILIO_AUTH_TOKEN
    - Twilio Console > homepage > Account Info > Auth Token
    - Clicca l'icona occhio per rivelare
    - ATTENZIONE: se rigeneri il token, quello vecchio smette di funzionare
      immediatamente. Aggiorna subito su Vercel + Supabase Edge Functions.

4.3 TWILIO_WHATSAPP_FROM
    - E' il numero WhatsApp da cui partono i messaggi
    - Sandbox: whatsapp:+14155238886 (numero condiviso Twilio)
    - Produzione: whatsapp:+[tuo-numero-approvato]
    - Il formato DEVE includere il prefisso "whatsapp:" e il "+"

4.4 Configurazione Webhook WhatsApp (Twilio Sandbox)
    Questo NON e' una variabile d'ambiente — e' una configurazione su Twilio.

    a) Twilio Console > Messaging > Try it out > Send a WhatsApp message
    b) Scorri fino a "Sandbox Configuration"
    c) Campo "When a message comes in":
       https://[tuo-dominio]/api/whatsapp/webhook
    d) Metodo: HTTP POST
    e) Salva

    Senza questa configurazione, le risposte dei clienti su WhatsApp
    (CONFERMA, CANCELLA, SI, etc.) NON arriveranno al tuo server.
    Twilio rispondera' con il messaggio generico:
    "Configure your WhatsApp Sandbox's Inbound URL to change this message."

    Nota: se cambi dominio, aggiorna questo URL su Twilio.

4.5 Secrets su Supabase Edge Functions
    Le Edge Functions (conferma smart, review, reactivation) inviano
    messaggi WhatsApp direttamente via Twilio REST API, senza passare
    dal server Next.js. Hanno bisogno delle credenziali Twilio.

    a) Supabase Dashboard > Edge Functions > Secrets
    b) Aggiungi:
       - TWILIO_ACCOUNT_SID (stesso valore di Vercel)
       - TWILIO_AUTH_TOKEN (stesso valore di Vercel)
       - TWILIO_WHATSAPP_FROM (stesso valore di Vercel)

    Senza questi secrets, le Edge Functions restano in mock mode
    (i messaggi vengono solo loggati, non inviati realmente).

---

5. DOVE CONFIGURARE LE VARIABILI

5.1 Vercel (frontend + server actions + webhook routes)
    - Vercel Dashboard > [progetto] > Settings > Environment Variables
    - Seleziona gli ambienti: Production, Preview, Development
    - Dopo ogni modifica: Deployments > Redeploy (le NEXT_PUBLIC_*
      vengono incluse nel bundle al build time)

5.2 Supabase Edge Functions (automazioni cron)
    - Supabase Dashboard > Edge Functions > Secrets
    - Solo le 3 variabili Twilio (le altre sono auto-disponibili)

5.3 Locale (.env.local)
    - Per sviluppo locale, copia le variabili in .env.local
    - Questo file e' in .gitignore — non viene committato
    - Puoi usare le stesse credenziali di produzione o credenziali test

---

6. CHECKLIST CONFIGURAZIONE NUOVO AMBIENTE

[ ] Creare progetto Supabase (o usare esistente)
[ ] Copiare NEXT_PUBLIC_SUPABASE_URL
[ ] Copiare NEXT_PUBLIC_SUPABASE_ANON_KEY (tab Legacy)
[ ] Copiare SUPABASE_SERVICE_ROLE_KEY (tab Legacy)
[ ] Impostare NEXT_PUBLIC_APP_URL con URL Vercel
[ ] Copiare STRIPE_SECRET_KEY da Stripe Dashboard
[ ] Creare webhook Stripe con URL /api/stripe/webhook
[ ] Copiare STRIPE_WEBHOOK_SECRET dal webhook creato
[ ] Creare prezzi Stripe (npx tsx scripts/setup-stripe.ts) o copiare ID esistenti
[ ] Copiare TWILIO_ACCOUNT_SID da Twilio Console
[ ] Copiare TWILIO_AUTH_TOKEN da Twilio Console
[ ] Impostare TWILIO_WHATSAPP_FROM (sandbox o numero approvato)
[ ] Configurare webhook URL su Twilio Sandbox
[ ] Aggiungere secrets Twilio su Supabase Edge Functions
[ ] Redeploy su Vercel
[ ] Testare: prenotazione booking > messaggio WhatsApp ricevuto
[ ] Testare: risposta WhatsApp > webhook processato (log Vercel)
[ ] Testare: abbonamento Stripe > webhook processato (log Vercel)

---

7. TROUBLESHOOTING

Problema: messaggi WhatsApp non inviati (mock mode)
- Verifica che TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM
  siano configurate su Vercel
- Controlla i log Vercel: se vedi "MOCK" nei log, le variabili mancano
- Dopo aver aggiunto le variabili, DEVI fare redeploy

Problema: risposte WhatsApp non arrivano (messaggio generico Twilio)
- Il webhook URL non e' configurato su Twilio Sandbox
- Vai su Twilio Console > Messaging > WhatsApp Sandbox > configura URL
- L'URL deve corrispondere ESATTAMENTE a NEXT_PUBLIC_APP_URL + /api/whatsapp/webhook

Problema: webhook Stripe restituisce 400/500
- Verifica che STRIPE_WEBHOOK_SECRET corrisponda all'endpoint configurato
- Se hai cambiato dominio, crea un nuovo endpoint e aggiorna il secret
- Controlla i log su Stripe Dashboard > Webhook > Consegne eventi

Problema: Edge Functions in mock mode
- I secrets Twilio non sono configurati su Supabase Edge Functions
- Vai su Supabase Dashboard > Edge Functions > Secrets e aggiungili
- Verifica nei log Edge Functions (Dashboard > Edge Functions > Logs)

Problema: firma Twilio non valida in produzione (403 Forbidden)
- NEXT_PUBLIC_APP_URL deve corrispondere ESATTAMENTE all'URL configurato
  su Twilio come webhook (incluso https://, senza slash finale)
- Esempio corretto: https://barberos-mvp.vercel.app
- Esempio errato: https://barberos-mvp.vercel.app/ (slash finale)

---

8. SICUREZZA

- MAI committare credenziali nel codice sorgente
- .env.local e' in .gitignore — verificare che resti cosi'
- Le chiavi segrete (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
  TWILIO_AUTH_TOKEN) non devono MAI apparire in variabili NEXT_PUBLIC_*
- Se una chiave viene compromessa:
  - Stripe: rigenera da Dashboard > Chiavi API > "..." > Rigenera
  - Twilio: rigenera da Console > Account > Auth Token > Rigenera
  - Supabase: rigenera da Dashboard > Settings > API > Rigenera
  - Aggiorna IMMEDIATAMENTE su Vercel + Supabase Edge Functions + .env.local
  - Fai redeploy su Vercel

---

9. VERIFICA CHE TUTTO FUNZIONI

Dopo aver configurato tutte le variabili e fatto il redeploy su Vercel,
esegui questi test in ordine.

9.1 Verifica base — il sito funziona
    - Apri https://barberos-mvp.vercel.app
    - Dovresti vedere la pagina di login
    - Accedi con le tue credenziali
    - La dashboard deve caricarsi senza errori

9.2 Verifica WhatsApp — invio messaggi (App → Cliente)
    - Crea un appuntamento dal booking wizard (https://barberos-mvp.vercel.app/book/[slug])
    - Oppure aggiungi un walk-in dal calendario
    - Controlla i log Vercel (Dashboard > Logs):
      - ✅ Se vedi "✅ WhatsApp sent to..." → Twilio funziona
      - ❌ Se vedi "📱 WhatsApp Message (MOCK)" → le variabili Twilio mancano o il redeploy non e' stato fatto

9.3 Verifica WhatsApp — ricezione risposte (Cliente → App)
    - Dal tuo telefono, manda un messaggio qualsiasi al numero sandbox +1 415 523 8886
    - Se il webhook funziona, dovresti ricevere una risposta con i comandi disponibili
      (CONFERMA, CANCELLA, CAMBIA ORARIO, SI)
    - Se ricevi "Configure your WhatsApp Sandbox's Inbound URL..." → il webhook
      non e' configurato su Twilio (vedi sezione 4.4)
    - Controlla i log Vercel: dovresti vedere "📥 WhatsApp webhook: from=..."

    IMPORTANTE: il sistema WhatsApp di BarberOS NON e' un chatbot generico.
    Non risponde a messaggi come "ciao" o "vorrei prenotare".
    Risponde SOLO a comandi specifici:
    - CONFERMA → conferma un appuntamento pending
    - CANCELLA / ANNULLA → cancella l'appuntamento
    - CAMBIA ORARIO → riceve link per riprenotare
    - SI / SI' → conferma dalla waitlist
    - Qualsiasi altro messaggio → risposta con lista comandi

9.4 Verifica Stripe — webhook
    - Vai su Stripe Dashboard > Webhook > BarberOS Webhook
    - Clicca "Invia evento di test" (se disponibile)
    - Oppure crea un abbonamento test dalla dashboard BarberOS
    - Controlla le "Consegne eventi" su Stripe: devono mostrare status 200
    - Controlla i log Vercel per conferma

9.5 Verifica Edge Functions — cron automatici
    - Supabase Dashboard > Edge Functions > Logs
    - Le functions girano automaticamente ogni 30 minuti (conferma) o ogni ora (review)
    - Se vedi "WhatsApp sent" nei log → invio reale attivo
    - Se vedi "MOCK" → i secrets Twilio mancano (vedi sezione 4.5)

9.6 Verifica Stripe — pagamenti
    - Dalla dashboard BarberOS > Settings > Abbonamento
    - Clicca su un piano per avviare il checkout Stripe
    - Usa la carta test: 4242 4242 4242 4242, scadenza qualsiasi futura, CVC qualsiasi
    - Dopo il pagamento, lo status deve aggiornarsi nel DB

---

10. WHATSAPP: DA SANDBOX A PRODUZIONE

Attualmente BarberOS usa la Twilio WhatsApp Sandbox. Questo ha limitazioni:
- Il numero e' condiviso (+1 415 523 8886)
- Ogni utente deve fare "join [codice]" per ricevere messaggi
- I messaggi hanno un prefisso "[Twilio Sandbox]"
- La sandbox scade dopo 72 ore di inattivita'

Per andare in produzione con WhatsApp serve:

10.1 Registrare un WhatsApp Business Sender
     a) Twilio Console > Messaging > Senders > WhatsApp Senders
     b) Clicca "Register WhatsApp Sender"
     c) Serve un account Facebook Business verificato
     d) Serve un numero di telefono dedicato (puo' essere il numero Twilio acquistato)
     e) Meta deve approvare il profilo WhatsApp Business (1-7 giorni lavorativi)

10.2 Configurare i Message Templates
     WhatsApp Business richiede template pre-approvati per messaggi proattivi
     (cioe' messaggi che il sistema invia per primo, non risposte).
     
     Template necessari per BarberOS:
     - Conferma appuntamento (confirmation)
     - Richiesta conferma (confirm_request)
     - Reminder conferma (confirm_reminder)
     - Pre-appuntamento (pre_appointment)
     - Cancellazione (cancellation)
     - Richiesta recensione (review_request)
     - Riattivazione cliente dormiente (reactivation)
     - Notifica waitlist (waitlist_notify)
     
     I template vanno creati su Twilio Console > Content Template Builder
     e approvati da Meta (24-48 ore).

10.3 Aggiornare le variabili
     - TWILIO_WHATSAPP_FROM: cambia da whatsapp:+14155238886 a whatsapp:+[tuo-numero]
     - Aggiorna su: Vercel + Supabase Edge Functions Secrets + .env.local
     - Aggiorna il webhook URL su Twilio (non piu' Sandbox ma Sender Configuration)

10.4 Costi WhatsApp in produzione
     - Twilio: ~$0.005/messaggio (costo piattaforma)
     - Meta: ~$0.03-0.08/messaggio (varia per paese e tipo)
     - Italia: ~€0.05-0.10 per conversazione (24h window)
     - Stima 100 messaggi/giorno: ~€150-300/mese
     - Incluso nel prezzo dei piani BarberOS (€300-500/mese)

---

11. SUB-ACCOUNT TWILIO PER CLIENTI BARBIERI (FUTURO)

Attualmente BarberOS usa UN SOLO account Twilio centralizzato.
Tutti i messaggi partono dallo stesso numero. Questo e' il modello
corretto per l'MVP e i primi clienti.

Quando si vuole che ogni barbiere abbia il proprio numero WhatsApp:

11.1 Come funzionano i Sub-Account Twilio
     - Dal tuo account master Twilio, crei un sub-account per ogni barbiere
     - Ogni sub-account ha il proprio SID, Auth Token e numero WhatsApp
     - I costi vengono fatturati al tuo account master
     - Puoi rifatturare al barbiere tramite il piano BarberOS

11.2 Modifiche necessarie al codice
     a) Aggiungere colonne alla tabella `businesses`:
        - twilio_account_sid (text, nullable)
        - twilio_auth_token (text, nullable — crittografato)
        - twilio_whatsapp_from (text, nullable)
     
     b) Modificare src/lib/whatsapp.ts:
        - getTwilioConfig() deve accettare un business_id opzionale
        - Se la business ha credenziali proprie → usa quelle
        - Se non le ha → fallback alle variabili d'ambiente globali
     
     c) Modificare le Edge Functions:
        - Ogni function deve leggere le credenziali Twilio dalla business
        - Fallback alle env vars globali se non configurate
     
     d) Aggiungere UI in Settings:
        - Sezione "WhatsApp" con campi per SID, Token, Numero
        - Bottone "Testa connessione"

11.3 Processo per ogni nuovo barbiere
     a) Crea sub-account: Twilio Console > Account > Subaccounts > Create
     b) Acquista numero: Sub-account > Phone Numbers > Buy
     c) Registra WhatsApp Sender per quel numero
     d) Attendi approvazione Meta
     e) Inserisci credenziali nelle Settings BarberOS del barbiere
     f) Testa invio messaggio

11.4 Alternativa semplice (senza sub-account)
     Se non serve un numero dedicato per ogni barbiere, puoi:
     - Usare un solo numero WhatsApp Business approvato
     - Personalizzare il nome del mittente nel profilo WhatsApp Business
       (es. "BarberOS - Prenotazioni")
     - I clienti vedono lo stesso numero ma il messaggio include
       il nome della barberia nel testo

---

12. CAMBIO DOMINIO — CHECKLIST

Quando acquisti un dominio custom (es. barberos.it):

[ ] Configurare DNS su Cloudflare (o altro provider)
[ ] Aggiungere dominio su Vercel (Settings > Domains)
[ ] Aggiornare NEXT_PUBLIC_APP_URL su Vercel con il nuovo dominio
[ ] Creare NUOVO endpoint webhook su Stripe con il nuovo URL
[ ] Aggiornare STRIPE_WEBHOOK_SECRET con il nuovo signing secret
[ ] Aggiornare webhook URL su Twilio (Sandbox o Sender Configuration)
[ ] Redeploy su Vercel
[ ] Testare tutti i webhook (WhatsApp + Stripe)
[ ] (Opzionale) Mantenere il vecchio endpoint Stripe per un periodo di transizione

---

13. LOG CONFIGURAZIONE

11/02/2026 — Configurazione iniziale completata
- Vercel: tutte le 11 variabili d'ambiente configurate
- Stripe: webhook "BarberOS Webhook" creato (we_1SzTPcK75hVrlrvaBhwjn63H)
  URL: https://barberos-mvp.vercel.app/api/stripe/webhook
  Eventi: 46 (inclusi i 5 critici per subscription + invoice)
- Twilio: sandbox configurata
  Webhook URL: https://barberos-mvp.vercel.app/api/whatsapp/webhook
  Numero sandbox: +1 415 523 8886
  Codice sandbox: "join drink-room"
  1 partecipante sandbox: whatsapp:+393667461897
- Supabase Edge Functions: 3 secrets Twilio aggiunti
- Redeploy: da eseguire
