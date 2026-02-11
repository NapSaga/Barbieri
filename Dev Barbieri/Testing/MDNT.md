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

---

## Secondo giro di test (11/02/2026)

Un secondo passaggio approfondito ha individuato **4 nuovi bug** non emersi nel primo giro.

### Fix applicati (secondo giro)

#### 5. Slot no-show non liberati per rebooking (MEDIO)

**Problema:** `hasConflict()` e `getStaffBookedSlots()` in `appointments.ts` escludevano solo gli appuntamenti `cancelled`, ma non quelli `no_show`. Se un cliente non si presentava e il barbiere lo segnava come no-show, quello slot restava "occupato" nel sistema: nessun nuovo walk-in o prenotazione online poteva prendere lo stesso orario.

**File modificato:** `src/actions/appointments.ts`
**Fix:** Cambiato `.neq("status", "cancelled")` con `.not("status", "in", '("cancelled","no_show")')` in entrambe le funzioni. Ora gli slot no-show vengono liberati automaticamente.

---

#### 6. Booking wizard ignorava gli orari di apertura della business (MEDIO)

**Problema:** Il wizard di prenotazione pubblica (`/book/[slug]`) controllava solo gli orari di lavoro del singolo barbiere (`working_hours`) e le chiusure straordinarie (`closureDates`), ma NON gli orari di apertura della barberia (`business.opening_hours`). Se la barberia segnava Lunedi' come "chiuso" nelle impostazioni ma un barbiere aveva orari di lavoro il Lunedi', il cliente poteva comunque prenotare quel giorno.

**File modificato:** `src/components/booking/booking-wizard.tsx`
**Fix:** Aggiunto check `business.opening_hours?.[dayKey]?.closed === true` nella logica di disabilitazione date. Ora se la barberia e' chiusa in un giorno, quel giorno non e' selezionabile anche se il barbiere ha orari configurati.

---

#### 7. Import dinamici ridondanti in notifyWaitlistOnCancel (BASSO)

**Problema:** La funzione `notifyWaitlistOnCancel()` faceva `await import("@/lib/whatsapp")` per importare `sendWhatsAppMessage` e `renderTemplate`, anche se questi moduli sono gia' importati staticamente in cima al file `appointments.ts`. L'import dinamico aggiungeva overhead inutile a ogni cancellazione.

**File modificato:** `src/actions/appointments.ts`
**Fix:** Rimosso l'import dinamico ridondante di `@/lib/whatsapp`. Mantenuto solo l'import dinamico di `@/lib/templates` (che NON e' importato staticamente).

---

#### 8. Waitlist comando SI senza conflict check (MEDIO)

**Problema:** Quando un cliente rispondeva "SI" via WhatsApp per accettare uno slot dalla waitlist, `handleWaitlistConfirm()` creava l'appuntamento **senza verificare conflitti**. Lo slot poteva essere stato preso nel frattempo da un altro booking o walk-in. Inoltre sceglieva il primo staff attivo arbitrariamente (`.limit(1)`) senza controllare disponibilita', e non inviava nessun messaggio WhatsApp di conferma al cliente.

**File modificato:** `src/app/api/whatsapp/webhook/route.ts`
**Fix:**
- Aggiunta funzione `hasConflictAdmin()` (stessa logica di `hasConflict()` in appointments.ts ma con AdminClient)
- Itera su tutti gli staff attivi cercandone uno senza conflitti nello slot richiesto
- Se nessuno staff e' disponibile: waitlist entry → `expired`, messaggio WhatsApp al cliente "slot non piu' disponibile" + link booking
- Se staff disponibile: crea appuntamento + messaggio WhatsApp di conferma + record messages
- Refactored per usare `findClientByPhone()` condiviso invece di query duplicata

---

### Riepilogo complessivo dopo 2 giri + fix successivi

| Metrica | Primo giro | Secondo giro | Fix successivi | Totale |
|---------|-----------|-------------|----------------|--------|
| Bug trovati | 9 | 4 | 0 | 13 |
| Bug fixati | 4 | 3 | 1 (#8) | 8 |
| Feature gap | 5 | 0 | 0 | 5 |
| typecheck | Pass | Pass | Pass | Pass |
| build | Pass | Pass | Pass | Pass |

---

## Test Automatici con Vitest (11/02/2026 — sessione successiva)

Dopo i test manuali, e' stato attivato un test runner automatico (Vitest) per coprire tutte le **funzioni pure** della codebase con test unitari.

### Cosa e' stato fatto

1. **Installato Vitest** (`pnpm add -D vitest`) con `vitest.config.ts` e path alias `@/*`
2. **Estratte utility condivise** in `src/lib/time-utils.ts`:
   - `addMinutesToTime`, `timeToMinutes`, `minutesToTop`, `minutesToHeight`, `formatPrice`
   - Queste funzioni erano duplicate in 4 file diversi (booking-wizard, walk-in-dialog, day-view, appointment-sheet)
   - I 4 file ora importano dal modulo condiviso
3. **Estratto `mapStatus`** dal webhook Stripe in `src/lib/stripe-utils.ts` (testabile senza side-effect)
4. **Scritti 95 test in 6 file:**

| File test | Test | Cosa copre |
|-----------|------|-----------|
| `time-utils.test.ts` | 24 | addMinutesToTime (overflow, cap 23:59), timeToMinutes, minutesToTop, minutesToHeight, formatPrice (EUR locale) |
| `whatsapp.test.ts` | 8 | renderTemplate: sostituzione variabili, variabili mancanti, injection prevention, template vuoto |
| `rate-limit.test.ts` | 11 | checkRateLimit (limiti, reset finestra, IP indipendenti), getClientIp (x-forwarded-for, x-real-ip, fallback) |
| `slots.test.ts` | 11 | getAvailableSlots: slot base, pause, appuntamenti esistenti, boundary duration, staff diversi |
| `stripe-utils.test.ts` | 11 | mapStatus: tutti gli stati Stripe → DB enum, stato sconosciuto |
| `validation.test.ts` | 30 | Zod schemas: dateSchema, timeSchema, uuidSchema, walkInSchema, bookAppointmentSchema, serviceFormSchema, createClientSchema |

5. **CI aggiornata**: `pnpm test` aggiunto in `.github/workflows/ci.yml` tra Lint e Build

### Risultati

```
pnpm test → 95/95 pass (749ms)
pnpm typecheck → pass
pnpm build → pass
pnpm lint → 0 nuovi errori (3 pre-esistenti noExplicitAny)
```

### Cosa coprono i test automatici

Funzioni pure senza dipendenze esterne: calcoli tempo, formato prezzo, rate limiter, slot availability, mapping status Stripe, template WhatsApp, validazione input Zod.

### Cosa NON coprono (e perche')

- **Server Actions** → richiedono Supabase reale (test di integrazione, non unitari)
- **Flusso autenticazione** → richiede browser + Supabase Auth
- **proxy.ts** → richiede context Next.js
- **Webhook end-to-end** → richiedono firma Stripe/Twilio + DB
- **Rendering componenti React** → richiederebbe @testing-library/react (non installato)
- **Edge Functions / pg_cron** → eseguiti da Supabase, non testabili localmente

I test manuali con AI (checklist 126 casi) restano la copertura principale per i flussi end-to-end. I test automatici Vitest sono un livello aggiuntivo che protegge le funzioni pure da regressioni.
