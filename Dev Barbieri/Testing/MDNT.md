# MDNT — Meeting/Dev Notes Today

**Data:** 11 febbraio 2026

---

## Cosa e' successo oggi

Oggi e' stata la prima volta che sono stati configurati e eseguiti i test E2E per BarberOS. La checklist completa si trova in `test-checklist.md` nella stessa cartella.

---

## Come funzionano i test

Il processo di testing e' progettato per essere eseguito con l'AI (Claude Code):

1. **La checklist** (`test-checklist.md`) contiene 126 test cases organizzati in 16 sezioni che coprono tutta l'app: Auth, Onboarding, Booking, Conferma Smart, Calendario, Walk-in, Cancellazione, No-Show, Waitlist, CRM, Billing, Subscription Gating, Settings, Analytics, Edge Functions, Responsiveness.

2. **L'AI legge la checklist**, poi analizza tutto il codice sorgente (server actions, componenti, proxy, webhook, schema DB) e confronta il comportamento del codice con il risultato atteso di ogni test.

3. **Per ogni test l'AI segna:**
   - ✅ Pass — il codice implementa correttamente il comportamento atteso
   - ❌ Fail — c'e' un bug o una feature mancante
   - ⏭️ Skip — il test richiede servizi esterni non testabili localmente (es. Edge Functions Supabase, pg_cron)

4. **Per ogni fail l'AI:**
   - Diagnostica la causa root nel codice
   - Classifica la severita' (Critico / Medio / Basso)
   - Se e' un bug fixabile: implementa il fix direttamente nel codice
   - Se e' una feature mancante: documenta nel bug log e nella roadmap

5. **Dopo tutti i fix**, l'AI verifica che typecheck (`tsc --noEmit`) e build (`pnpm build`) passino ancora.

6. **La checklist viene aggiornata** con i risultati, il riepilogo e il bug log completo.

Per rieseguire i test in futuro: basta chiedere all'AI di leggere `test-checklist.md` e rieseguire la verifica. I test sono ripetibili e la checklist si aggiorna ogni volta.

---

## Risultati della prima esecuzione (11/02/2026)

| Metrica | Valore |
|---------|--------|
| Test totali | 126 |
| Pass | 108 |
| Fail | 6 |
| Skip | 12 (Edge Functions/pg_cron non testabili localmente) |
| Pass rate | 85.7% totale, 94.7% escludendo skip |
| Bug trovati | 9 (1 critico, 3 medi, 5 bassi) |
| Bug fixati | 4 |
| Bug documentati per roadmap | 5 (feature gap, non regressioni) |

---

## Fix applicati grazie ai test

### 1. WhatsApp webhook bloccato dal proxy (CRITICO)

**Problema:** Il webhook WhatsApp (`/api/whatsapp/webhook`) non era nei path pubblici di `proxy.ts`. Twilio mandava POST al webhook, ma il proxy lo redirigeva a `/login` con un 307. Risultato: tutta l'integrazione WhatsApp (comandi CONFERMA, CANCELLA, waitlist) era rotta in produzione.

**File modificato:** `src/proxy.ts`
**Fix:** Aggiunto `"/api/whatsapp"` all'array `publicPaths` e `request.nextUrl.pathname.startsWith("/api/whatsapp/")` al check `isPublicPath`.

---

### 2. Cancellazione da calendario non notificava la waitlist (MEDIO)

**Problema:** Quando un appuntamento veniva cancellato dalla appointment sheet del calendario (tramite `updateAppointmentStatus`), la waitlist NON veniva notificata. Solo la cancellazione via WhatsApp webhook chiamava `notifyWaitlist()`. Quindi se il barbiere cancellava manualmente, il primo in waitlist non riceveva il messaggio.

**File modificato:** `src/actions/appointments.ts`
**Fix:** Aggiunta funzione `notifyWaitlistOnCancel()` che cerca la prima entry in waitlist per la stessa data/business, la mette in stato "notified", e invia il messaggio WhatsApp. Chiamata dentro `updateAppointmentStatus` quando il nuovo status e' "cancelled".

---

### 3. Campo cognome mancante nel booking wizard (BASSO)

**Problema:** Il booking wizard pubblico (`/book/[slug]`) aveva solo il campo "Nome" nello step di conferma. Nessun campo "Cognome". Il cliente veniva creato senza last_name.

**File modificato:** `src/components/booking/booking-wizard.tsx`
**Fix:** Aggiunto stato `clientLastName`, campo input "Cognome" nel form di conferma (griglia 2 colonne Nome + Cognome), e passaggio a `bookAppointment` come `clientLastName`.

---

### 4. Bottoni azione senza type="button" (BASSO)

**Problema:** I 4 bottoni azione nell'appointment sheet (Conferma, Completato, No-show, Cancella) non avevano `type="button"`. Per accessibilita' e per evitare submit accidentali in contesti form, il type esplicito e' necessario.

**File modificato:** `src/components/calendar/appointment-sheet.tsx`
**Fix:** Aggiunto `type="button"` a tutti e 4 i bottoni.

---

## Bug documentati ma non fixati (feature gap)

Questi non sono regressioni ma funzionalita' previste nello schema DB che non hanno ancora una UI:

| # | Descrizione | Dove manca |
|---|-------------|------------|
| 1 | UI per creare servizi combo (`is_combo` + `combo_service_ids`) | ServicesManager |
| 2 | UI per associare staff a servizi (tabella `staff_services`) | StaffManager / Booking Wizard |
| 3 | UI per aggiungere manualmente entry alla waitlist | WaitlistManager |
| 4 | UI per riordinare staff con drag-and-drop (`sort_order`) | StaffManager |
| 5 | Filtro per singolo barbiere nel calendario | CalendarView / DayView |

Questi sono stati aggiunti alla Roadmap come "Feature Gap da test E2E".
