## Contesto
BarberOS e' un SaaS per barbershop (Next.js 16, React 19, Supabase, Tailwind v4, shadcn/ui).
Leggi CLAUDE.md per le convenzioni del progetto.
Leggi Dev Barbieri/Sviluppo/Stato-progetto.md per il contesto completo.

## Regole per ogni step

1. Leggere SEMPRE i file coinvolti prima di modificarli
2. UI in italiano (come tutto il progetto)
3. Usare i componenti shadcn/ui gia' presenti in src/components/ui/
4. Server actions con validazione Zod (zod/v4) come tutti gli altri moduli in src/actions/
5. Dopo ogni step: `pnpm typecheck && pnpm test && pnpm build` devono passare
6. NON installare nuove dipendenze senza chiedere prima


BARBEROS MVP — SISTEMA REFERRAL

Ultimo aggiornamento: 11 febbraio 2026
Stato: DA FARE

---

OBIETTIVO

Permettere ai barbieri (clienti BarberOS) di invitare altri barbieri sulla piattaforma.
Per ogni referral che si abbona, il referrer guadagna un credito/sconto sulla propria fattura mensile.
Questo crea un loop virale: piu' barbieri inviti, meno paghi (o guadagni).

---

MODELLO REFERRAL

  Meccanismo: Sconto in fattura via Stripe Coupon
  - Ogni business ha un codice referral unico (es. "REF-MARIO-A3B2")
  - Quando un nuovo barbiere si registra usando il codice referral:
    → Il NUOVO utente riceve: 20% sconto sul primo mese (trial resta sempre 7 giorni come da Piani.md)
    → Il REFERRER riceve: €50 di credito sulla prossima fattura (Stripe Credit)
  - Il credito viene applicato automaticamente via Stripe Customer Balance o Coupon
  - Nessun limite al numero di referral (piu' inviti = piu' crediti)
  - Il credito si accumula: 5 referral = €250 di credito = quasi 1 mese gratis su Essential

  Perche' Stripe Coupon/Credit:
  - Stripe gia' integrato con allow_promotion_codes: true
  - Customer Balance Credits: Stripe scala automaticamente dalla prossima invoice
  - Nessun sistema di pagamento custom da costruire
  - Tracciabilita' completa nella Stripe Dashboard

  Alternativa futura (post-MVP):
  - Cashout: il referrer puo' richiedere il credito come bonifico (Stripe Connect)
  - Commissione ricorrente: % sulla fattura del referral per 12 mesi
  - Tier system: Bronze (1-2 ref), Silver (3-5), Gold (6+) con reward crescenti

---

ARCHITETTURA TECNICA

  1. Database (nuova tabella + colonna)

     Nuova colonna su businesses:
     - referral_code TEXT UNIQUE — codice referral unico (generato alla registrazione)
     - referred_by UUID FK → businesses.id — chi ha invitato questa business

     Nuova tabella referrals:
     - id UUID PK
     - referrer_business_id UUID FK → businesses.id (chi ha invitato)
     - referred_business_id UUID FK → businesses.id (chi e' stato invitato)
     - status ENUM ('pending', 'converted', 'rewarded', 'expired')
       - pending: il referral si e' registrato ma non ha ancora pagato
       - converted: il referral ha attivato un abbonamento a pagamento
       - rewarded: il credito e' stato applicato al referrer
       - expired: il referral non si e' mai abbonato (scaduto dopo 90 giorni)
     - reward_amount_cents INTEGER — importo credito (default 5000 = €50)
     - stripe_credit_id TEXT — ID del credito Stripe applicato
     - converted_at TIMESTAMPTZ — quando il referral ha pagato
     - rewarded_at TIMESTAMPTZ — quando il credito e' stato applicato
     - created_at TIMESTAMPTZ DEFAULT NOW()

     RLS:
     - SELECT: business puo' vedere solo i propri referral (referrer_business_id = get_user_business_id())
     - INSERT: nessuno (gestito da webhook/server action con service role)
     - UPDATE: nessuno (gestito da webhook con service role)

  2. Flusso Registrazione con Referral

     a) Il referrer condivide il suo link: https://DOMINIO/register?ref=REF-MARIO-A3B2
     b) La pagina /register legge il query param ?ref= e lo salva in un cookie/hidden field
     c) Alla registrazione, il trigger on_auth_user_created:
        - Genera un referral_code unico per la nuova business (come fa gia' con lo slug)
        - Se c'e' un referral code nel metadata: salva referred_by con l'ID della business referrer
     d) Server action o webhook: crea un record nella tabella referrals con status 'pending'
     e) Quando il referral paga (webhook Stripe: invoice.paid per la prima volta):
        - Aggiorna referrals.status → 'converted'
        - Applica credito al referrer via Stripe Customer Balance:
          stripe.customers.createBalanceTransaction(referrerCustomerId, { amount: -5000, currency: 'eur' })
        - Aggiorna referrals.status → 'rewarded'
        - (Opzionale) Invia notifica al referrer

  3. Integrazione Stripe

     Webhook (route.ts gia' esistente):
     - Aggiungere handler per invoice.paid:
       → Se e' la prima invoice pagata (non trial)
       → Controllare se la business ha referred_by
       → Se si': creare credito Stripe per il referrer + aggiornare referrals

     Stripe Customer Balance:
     - stripe.customers.createBalanceTransaction(): aggiunge credito negativo (sconto)
     - Il credito viene scalato automaticamente dalla prossima invoice
     - Visibile nel Customer Portal del referrer

  4. Sidebar

     Nuova sezione "Crescita" nella sidebar, tra "Aspetto" e "Analisi":
     - Icona: Gift (lucide-react) o Users (gia' importata)
     - Label: "Referral"
     - Href: /dashboard/referral

  5. Pagina /dashboard/referral

     Componente: src/components/referral/referral-dashboard.tsx

     Sezioni:
     a) Il tuo codice referral
        - Codice grande e copiabile (click to copy con toast "Copiato!")
        - Link condivisibile: https://DOMINIO/register?ref=REF-XXXX
        - Pulsanti: "Copia link", "Condividi su WhatsApp"
        - WhatsApp share: wa.me/?text=... con messaggio precompilato

     b) Come funziona (3 step illustrati)
        - 1. Condividi il tuo link con un collega barbiere
        - 2. Quando si registra e attiva l'abbonamento
        - 3. Ricevi €50 di credito sulla tua prossima fattura

     c) I tuoi referral (tabella)
        - Colonne: Barberia, Data registrazione, Stato, Credito
        - Badge stato: 🟡 In attesa, ✅ Convertito, 💰 Premiato, ⏰ Scaduto
        - Empty state: "Non hai ancora invitato nessuno. Condividi il tuo link!"

     d) Riepilogo crediti
        - Totale crediti guadagnati (€)
        - Crediti in attesa (referral registrati ma non ancora paganti)
        - Crediti applicati (gia' scalati dalla fattura)

  6. Server Actions (src/actions/referral.ts)

     - getReferralInfo(): restituisce codice referral, link, statistiche
     - getReferrals(): lista referral con stato e importi
     - validateReferralCode(code): verifica che il codice esista (usato in /register)

     Validazione Zod:
     - referralCodeSchema: z.string().regex(/^REF-[A-Z0-9-]+$/)

  7. Generazione Codice Referral

     Formato: REF-{NOME_BUSINESS_ABBREVIATO}-{4_CHAR_RANDOM}
     Esempio: REF-MARIO-A3B2, REF-TONYS-X7K9

     Generazione: nel trigger SQL on_auth_user_created (gia' esistente)
     oppure in una migrazione che genera codici per tutte le business esistenti
     + logica nella registrazione per le nuove

---

STEP DI IMPLEMENTAZIONE

  Step 1 — Migrazione Database
  Priorita': P0 (prerequisito per tutto)
  Tempo stimato: 30 min

  [ ] Creare migrazione SQL:
      - ALTER TABLE businesses ADD COLUMN referral_code TEXT UNIQUE;
      - ALTER TABLE businesses ADD COLUMN referred_by UUID REFERENCES businesses(id);
      - CREATE TABLE referrals (...) con RLS
      - Generare referral_code per tutte le business esistenti
      - Aggiornare trigger on_auth_user_created per generare referral_code
  [ ] Aggiornare src/db/schema.ts con nuove colonne e tabella
  [ ] pnpm typecheck && pnpm test && pnpm build

  Step 2 — Server Actions
  Priorita': P0
  Tempo stimato: 1 ora

  [ ] Creare src/actions/referral.ts:
      - getReferralInfo(): codice, link, stats aggregate
      - getReferrals(): lista referral con join su businesses per nome
      - validateReferralCode(code): check esistenza (usato da /register, no auth richiesta)
  [ ] Validazione Zod su tutti gli input
  [ ] pnpm typecheck && pnpm test && pnpm build

  Step 3 — Pagina Referral Dashboard
  Priorita': P0
  Tempo stimato: 2 ore

  [ ] Creare src/app/(dashboard)/dashboard/referral/page.tsx (Server Component)
  [ ] Creare src/components/referral/referral-dashboard.tsx (Client Component)
      - Sezione codice con copy-to-clipboard
      - Sezione "Come funziona" con 3 step
      - Tabella referral con badge stato
      - Riepilogo crediti
  [ ] Aggiornare sidebar.tsx: aggiungere sezione "Crescita" con voce "Referral"
  [ ] pnpm typecheck && pnpm test && pnpm build

  Step 4 — Integrazione Registrazione
  Priorita': P0
  Tempo stimato: 1 ora

  [ ] Aggiornare /register/page.tsx:
      - Leggere query param ?ref= dall'URL
      - Validare il codice referral (chiamata a validateReferralCode)
      - Mostrare badge "Invitato da [nome barberia]" se codice valido
      - Passare referral code nei metadata della registrazione Supabase
  [ ] Aggiornare trigger SQL o post-registrazione:
      - Salvare referred_by sulla nuova business
      - Creare record referrals con status 'pending'
  [ ] pnpm typecheck && pnpm test && pnpm build

  Step 5 — Integrazione Stripe Webhook
  Priorita': P0
  Tempo stimato: 1 ora

  [ ] Aggiornare src/app/api/stripe/webhook/route.ts:
      - Nel handler invoice.paid: controllare se e' prima invoice non-trial
      - Se la business ha referred_by:
        → Trovare il referrer
        → stripe.customers.createBalanceTransaction() per applicare credito
        → Aggiornare referrals.status → 'rewarded'
  [ ] Testare flusso completo (registrazione → pagamento → credito)
  [ ] pnpm typecheck && pnpm test && pnpm build

  Step 6 — Test e Polish
  Priorita': P1
  Tempo stimato: 1 ora

  [ ] Aggiungere test Vitest per:
      - Validazione schema referral code
      - Formato generazione codice
      - Logica stato referral
  [ ] Test manuali E2E:
      - Registrazione con ?ref= valido
      - Registrazione con ?ref= invalido (ignorato gracefully)
      - Pagina referral con 0 referral (empty state)
      - Pagina referral con referral in vari stati
      - Copy link + share WhatsApp
  [ ] Aggiornare documentazione:
      - Stato-progetto.md
      - Architettura.md
      - Sidebar: nuova sezione "Crescita"
  [ ] pnpm typecheck && pnpm test && pnpm build

---

SIDEBAR AGGIORNATA (dopo implementazione)

  PRINCIPALE
    Calendario

  GESTIONE
    Clienti
    Servizi
    Staff
    Lista d'attesa

  ASPETTO
    Personalizza

  CRESCITA          ← NUOVA SEZIONE
    Referral

  ANALISI
    Analytics
    Impostazioni

---

FILE COINVOLTI

  Nuovi:
  - supabase/migrations/YYYYMMDD_referral_system.sql
  - src/actions/referral.ts
  - src/components/referral/referral-dashboard.tsx
  - src/app/(dashboard)/dashboard/referral/page.tsx

  Modificati:
  - src/db/schema.ts (nuove colonne + tabella referrals)
  - src/components/shared/sidebar.tsx (sezione "Crescita")
  - src/app/(auth)/register/page.tsx (query param ?ref=)
  - src/app/api/stripe/webhook/route.ts (credito referrer su invoice.paid)

  Documentazione:
  - Dev Barbieri/Sviluppo/Stato-progetto.md
  - Dev Barbieri/Sviluppo/Architettura.md

---

RIEPILOGO

  Step                              | Priorita' | Tempo stimato
  ──────────────────────────────────+───────────+──────────────
  1. Migrazione Database            | P0        | 30 min
  2. Server Actions                 | P0        | 1 ora
  3. Pagina Referral Dashboard      | P0        | 2 ore
  4. Integrazione Registrazione     | P0        | 1 ora
  5. Integrazione Stripe Webhook    | P0        | 1 ora
  6. Test e Polish                  | P1        | 1 ora
  ──────────────────────────────────+───────────+──────────────
  TOTALE                            |           | ~6-7 ore

  Ordine consigliato:
  1. Migrazione DB (prerequisito per tutto)
  2. Server Actions (logica backend)
  3. Pagina Referral Dashboard (UI)
  4. Integrazione Registrazione (flusso ingresso)
  5. Integrazione Stripe Webhook (reward automatico)
  6. Test e documentazione

---

EVOLUZIONE FUTURA (post-MVP)

  Fase 2 — Reward avanzati:
  - Commissione ricorrente: 10% della fattura del referral per 12 mesi
  - Tier system: Bronze (1-2), Silver (3-5), Gold (6+) con reward crescenti
  - Leaderboard: classifica referrer (gamification)

  Fase 3 — Cashout:
  - Stripe Connect per trasferire crediti come denaro reale
  - Dashboard guadagni con storico transazioni
  - Soglia minima cashout (es. €100)

  Fase 4 — Referral bidirezionale:
  - Anche i clienti finali (chi prenota) possono invitare amici
  - Il barbiere riceve notifica "Nuovo cliente da referral di Mario Rossi"
  - Sconto per il cliente che invita (es. prossimo taglio -20%)
