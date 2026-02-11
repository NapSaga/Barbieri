BARBEROS MVP — GUIDA RECUPERO CREDENZIALI

Ultimo aggiornamento: 11 febbraio 2026

Questa guida spiega dove trovare e come configurare tutte le credenziali
necessarie per far funzionare BarberOS in produzione. Utile per:
- Prima configurazione del progetto
- Setup di nuovi ambienti (staging, produzione)
- Onboarding di nuovi sviluppatori
- Futuro: configurazione sub-account per clienti barbieri

---

RIEPILOGO VARIABILI D'AMBIENTE

Tutte le variabili vanno configurate su Vercel (Settings > Environment Variables)
e, dove indicato, anche su Supabase Edge Functions.

| Variabile | Servizio | Tipo | Ambienti |
|-----------|----------|------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase | Pubblica | Tutti |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase | Pubblica | Tutti |
| SUPABASE_SERVICE_ROLE_KEY | Supabase | Segreta | Prod + Preview |
| NEXT_PUBLIC_APP_URL | Vercel | Pubblica | Tutti |
| STRIPE_SECRET_KEY | Stripe | Segreta | Prod + Preview |
| STRIPE_WEBHOOK_SECRET | Stripe | Segreta | Prod + Preview |
| STRIPE_PRICE_ESSENTIAL | Stripe | Segreta | Prod + Preview |
| STRIPE_PRICE_PROFESSIONAL | Stripe | Segreta | Prod + Preview |
| TWILIO_ACCOUNT_SID | Twilio | Segreta | Prod + Preview |
| TWILIO_AUTH_TOKEN | Twilio | Segreta | Prod + Preview |
| TWILIO_WHATSAPP_FROM | Twilio | Segreta | Prod + Preview |

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
