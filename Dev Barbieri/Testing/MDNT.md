# MDNT — Meeting/Dev Notes Today

**Data:** 11 febbraio 2026

---

## Cosa e' successo oggi

Oggi e' stata la prima volta che sono stati configurati e eseguiti i test E2E per BarberOS. La checklist completa si trova in `test-checklist.md` nella stessa cartella.

---

## Come funzionano i test

Il processo di testing e' progettato per essere eseguito con l'AI (Claude Code):

1. **La checklist** (`test-checklist.md`) contiene 146 test cases organizzati in 17 sezioni che coprono tutta l'app: Auth, Onboarding, Booking, Conferma Smart, Calendario, Walk-in, Cancellazione, No-Show, Waitlist, CRM, Billing, Subscription Gating, Settings, Analytics, Edge Functions, Responsiveness, Personalizza Form.

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

## Implementazione Feature Gap (11/02/2026 — sessione Windsurf Cascade)

Dopo i test E2E e i fix dei bug, sono stati implementati tutti e **5 i feature gap** identificati. Queste erano funzionalita' previste nello schema DB che non avevano ancora una UI.

### Step 1 — Filtro staff nel calendario

**Problema:** La vista giornaliera/settimanale mostrava tutti i barbieri senza possibilita' di filtrare per uno specifico.

**File modificato:** `src/components/calendar/calendar-view.tsx`
**Implementazione:**
- Dropdown `Select` (shadcn/ui) nella toolbar con opzione "Tutti" + singoli barbieri
- Stato filtro locale (`useState`), `useMemo` per `filteredStaff` e `filteredAppointments`
- Lista filtrata passata a `DayView` e `WeekView`
- Dropdown visibile solo se ci sono 2+ staff members

### Step 2 — Riordino staff con drag-and-drop

**Problema:** Il campo `sort_order` nella tabella `staff` non era modificabile da UI.

**File modificati:** `src/components/staff/staff-manager.tsx`, `src/actions/staff.ts`
**Implementazione:**
- Drag-and-drop HTML5 nativo (NO librerie esterne) con handle `GripVertical`
- Server action `reorderStaff(staffIds[])` aggiorna `sort_order` in batch
- Aggiornamento ottimistico della lista locale + `revalidatePath`

### Step 3 — Associazione staff-servizi

**Problema:** La tabella `staff_services` esisteva ma nessuna UI per gestirla. Il booking wizard mostrava tutti gli staff indipendentemente dal servizio.

**File modificati:** `src/components/staff/staff-manager.tsx`, `src/actions/staff.ts`, `src/components/booking/booking-wizard.tsx`, `src/app/book/[slug]/page.tsx`, `src/app/(dashboard)/dashboard/staff/page.tsx`
**Implementazione:**
- Sezione "Servizi" con checkbox nel pannello modifica staff (componente `StaffServicesEditor`)
- Server actions `getStaffServices()` e `updateStaffServices(staffId, serviceIds[])` (DELETE vecchi + INSERT nuovi)
- Booking wizard: `getStaffForService()` filtra barbieri per servizio selezionato
- Backwards compatible: se nessuna associazione esiste, mostra tutti gli staff

### Step 4 — UI servizi combo

**Problema:** Lo schema aveva `is_combo` e `combo_service_ids` ma il CRUD servizi non li esponeva.

**File modificati:** `src/components/services/services-manager.tsx`, `src/actions/services.ts`
**Implementazione:**
- Toggle "E' un combo" (checkbox con icona `Layers`) nel form servizio
- Se attivo: lista checkbox dei servizi attivi non-combo da includere
- Durata e prezzo del combo indipendenti (settati manualmente)
- Server actions `createService`/`updateService` aggiornate per salvare `is_combo` + `combo_service_ids`
- Badge "Combo" nella lista servizi

### Step 5 — Aggiunta manuale entry waitlist

**Problema:** Il WaitlistManager mostrava e rimuoveva entry ma non permetteva aggiunta manuale.

**File modificati:** `src/components/waitlist/waitlist-manager.tsx`, `src/actions/waitlist.ts`, `src/app/(dashboard)/dashboard/waitlist/page.tsx`
**Implementazione:**
- Bottone "Aggiungi" nell'header + dialog modale `AddToWaitlistDialog`
- Selezione cliente: tab "Esistente" (ricerca per nome/telefono) o "Nuovo" (form nome + cognome + telefono)
- Selezione servizio (dropdown servizi attivi), data desiderata, orario preferito (opzionale)
- Server action `addToWaitlist()` con Zod validation, find-or-create client per telefono
- End time calcolato automaticamente dalla durata del servizio
- Pagina waitlist aggiornata per passare `clients` e `services` al componente

### Riepilogo dopo implementazione feature gap

| Metrica | Prima | Dopo |
|---------|-------|------|
| Test pass | 108/126 | 114/126 |
| Test fail | 6 | 0 |
| Test skip | 12 | 12 |
| Pass rate (escl. skip) | 94.7% | **100%** |
| Feature gap | 5 | **0** |
| Bug aperti | 5 | **0** |
| typecheck | Pass | Pass |
| build | Pass | Pass |

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

---

## Refactor Lint / A11y / Formatting (11/02/2026 — sessione Windsurf Cascade)

Dopo l'attivazione della CI, `pnpm lint` passava con 0 errori ma **43 warning** (regole downgrade a `warn` in biome.json). In questa sessione tutti i 43 warning sono stati risolti, portando il risultato a **0 errori, 0 warning**.

### Categorie di fix

#### 1. Accessibilita' (a11y) — `noLabelWithoutControl` (26 fix)

Tutti i `<label>` senza associazione esplicita al campo input sono stati corretti aggiungendo `htmlFor` al label e `id` all'input corrispondente.

| Componente | Label fixate |
|------------|-------------|
| `walk-in-dialog.tsx` | 6 (nome, telefono, servizio, barbiere, ora inizio, ora fine) |
| `clients-manager.tsx` | 5 (nome, cognome, telefono, email, note) |
| `settings-manager.tsx` | 7 (nome barberia, telefono, indirizzo, Google review, soglia dormiente, soglia no-show, data chiusura, motivo chiusura) |
| `waitlist-manager.tsx` | 4 (cliente, servizio, data, orario) |
| `services-manager.tsx` | 3 (nome, durata, prezzo) |
| `staff-manager.tsx` | 1 (nome) |

#### 2. Accessibilita' (a11y) — `noStaticElementInteractions` + `useKeyWithClickEvents` (3 fix)

Backdrop overlay (div con `onClick` per chiudere modali) convertiti da `<div>` a `<button>` con `tabIndex={-1}` e `onKeyDown` per Escape:
- `appointment-sheet.tsx` — backdrop overlay
- `walk-in-dialog.tsx` — backdrop overlay

Drag handle in `staff-manager.tsx` — `biome-ignore` comment perche' il `onMouseDown` su div e' necessario per il drag-and-drop HTML5 nativo (non esiste un elemento semantico equivalente).

#### 3. Import inutilizzati — `noUnusedImports` (3 fix)

- `clients-manager.tsx` — rimosso `Calendar` (lucide-react)
- `sidebar.tsx` — rimosso `PanelLeftOpen` (lucide-react)
- `appointment-sheet.tsx` — rimosso `MapPin` (lucide-react)

#### 4. Parametri inutilizzati — `noUnusedFunctionParameters` (3 fix)

- `expired-view.tsx` — `subscriptionInfo` → `_subscriptionInfo`
- `week-view.tsx` — `staffMembers` → `_staffMembers`
- `settings-manager.tsx` — `id` → `_id` (in `SettingsSection`)

#### 5. `noExplicitAny` — biome-ignore comments (6 fix)

Dove `any` e' necessario per il Supabase admin client (senza generated types) o per cast di risultati query dinamici, aggiunto `biome-ignore lint/suspicious/noExplicitAny` con spiegazione:
- `analytics.ts` — `row.service as any` (join result)
- `appointments.ts` — `supabase: any` e `rawAppointments: any[]` (enrichWithConfirmationStatus)
- `billing.ts` — `supabase: any` (ensureStripeCustomer)
- `dashboard/page.tsx` — `staffMembers as any` (estratto in variabile `typedStaff`)
- `stripe/webhook/route.ts` — `as any` su admin client `.from().update()`
- `whatsapp/webhook/route.ts` — `SupabaseClient<any, "public", any>` type alias

#### 6. `noArrayIndexKey` (1 fix)

- `day-view.tsx` — `key={i}` → `key={\`hour-${START_HOUR + i}\`}` (chiave stabile basata sull'ora)

#### 7. `useSemanticElements` (1 fix)

- `appointment-sheet.tsx` — `<div role="button">` → `<button>` per il backdrop

#### 8. Formatting (biome formatter) (~12 file)

Correzioni di formattazione per rispettare il line width di 100 caratteri:
- Ternari wrappati su piu' righe (`services.ts` x2)
- If-return su singola riga (`waitlist.ts`)
- JSX return inline (`waitlist/page.tsx`)
- `.map()` callback riformattato (`booking-wizard.tsx`)
- Import ordering (`calendar-view.tsx`)
- Function signature wrapping (`staff-manager.tsx`, `expired-view.tsx`)
- Label multiline per rispettare 100 char (`walk-in-dialog.tsx`, `clients-manager.tsx`, `services-manager.tsx`, `settings-manager.tsx`, `waitlist-manager.tsx`)
- onClick handler multiline (`waitlist-manager.tsx`)
- `.update()` chain break (`stripe/webhook/route.ts`)

### Risultato finale

```
pnpm lint → 0 errori, 0 warning (prima: 0 errori, 43 warning)
pnpm typecheck → pass
pnpm build → pass
pnpm test → 95/95 pass
```

### Nota

La configurazione `biome.json` NON e' stata modificata. Le regole restano a `warn`, ma ora tutti i warning sono stati risolti nel codice. Questo significa che nuovi warning introdotti in futuro verranno segnalati dalla CI.

---

## Test Manuale Pagina Clienti (11/02/2026 — sessione Windsurf Cascade)

Test approfondito della pagina `/dashboard/clients` eseguito manualmente nel browser (localhost:3000). Tutti i 10 casi verificati con esito positivo.

### Funzionalita' testate

| # | Funzionalita' | Esito | Dettagli |
|---|---------------|-------|----------|
| 1 | Ricerca per nome | ✅ | Filtraggio real-time, "Giovanni" → 2 risultati |
| 2 | Ricerca per telefono | ✅ | "3456" → risultati corrispondenti |
| 3 | Reset ricerca | ✅ | Torna alla lista completa |
| 4 | Aggiunta nuovo cliente | ✅ | "Luca Bianchi" creato, validazione campi funzionante, lista aggiornata automaticamente (7 clienti totali) |
| 5 | Dettagli cliente espandibili | ✅ | Click espande card con statistiche: visite, no-show, ultima visita, email |
| 6 | Sistema tag (6 tag) | ✅ | VIP, Nuovo, Affidabile, Non conferma, Problematico, Alto rischio no-show — selezione multipla con feedback visivo |
| 7 | Note cliente | ✅ | Testo libero salvato e persistente tra navigazioni |
| 8 | Statistiche visite | ✅ | Contatore visite e data ultima visita corretti |
| 9 | Tasso no-show | ✅ | Calcolato e mostrato (0 per clienti test) |
| 10 | Lista clienti | ✅ | Ordinamento alfabetico, avatar con iniziali, espandi/comprimi smooth |

### Osservazioni

- **UX eccellente**: interfaccia intuitiva e fluida
- **Ricerca potente**: filtraggio real-time per nome e telefono
- **Sistema tag completo**: 6 tag con selezione multipla e colori differenziati
- **Auto-save**: tag e note salvati automaticamente
- **Validazione form**: previene errori di inserimento (campi obbligatori: nome, telefono)
- **Responsive**: animazioni smooth e feedback visivo chiaro

### Conclusione

La pagina Clienti e' **pienamente funzionale** e pronta per uso in produzione. Nessun bug riscontrato. Conferma i risultati della sezione 10 (CRM) della test-checklist.

---

## Test Manuale Pagina Servizi (11/02/2026 — sessione Windsurf Cascade)

Test approfondito della pagina `/dashboard/services` eseguito manualmente nel browser (localhost:3000). Tutte le 6 funzionalita' CRUD verificate con esito positivo.

### Funzionalita' testate

| # | Funzionalita' | Esito | Dettagli |
|---|---------------|-------|----------|
| 1 | Visualizzazione lista servizi | ✅ | 3 servizi iniziali, nome/durata/prezzo visibili, contatore totale corretto |
| 2 | Aggiunta nuovo servizio | ✅ | "Rasatura Completa" (25 min, 18€) creato, lista aggiornata automaticamente, contatore 3→4 |
| 3 | Modifica servizio | ✅ | Prezzo cambiato da 18€ a 20€, campi pre-compilati, salvataggio immediato |
| 4 | Toggle disattiva/attiva | ✅ | Badge "Disattivato" visibile, toggle inverso funzionante, stato visivo chiaro |
| 5 | Eliminazione servizio | ✅ | "Rasatura Completa" eliminato, rimozione immediata, contatore 4→3 |
| 6 | Validazione campi obbligatori | ✅ | Campo nome vuoto → messaggio "Compila questo campo", salvataggio impedito |

### Osservazioni

- **Performance eccellenti**: tutte le operazioni CRUD istantanee senza lag
- **Validazione robusta**: campi obbligatori validati con messaggi nativi del browser
- **Gestione stato**: contatore servizi aggiornato automaticamente ad ogni operazione
- **UX fluida**: modal apertura/chiusura senza problemi, toggle attiva/disattiva reversibile
- **Icone chiare**: ogni azione (Disattiva, Modifica, Elimina) ha icona riconoscibile

### Conclusione

La pagina Servizi e' **pienamente funzionale** e pronta per uso in produzione. Nessun bug riscontrato. Conferma i risultati della sezione 2 (Onboarding, test 2.3-2.4) della test-checklist.

---

## Test Manuale Pagina Staff (11/02/2026 — sessione Windsurf Cascade)

Test approfondito della pagina `/dashboard/staff` eseguito manualmente nel browser (localhost:3000). 6 funzionalita' testate, tutte ✅, 1 bug UX trovato e fixato.

### Funzionalita' testate

| # | Funzionalita' | Esito | Dettagli |
|---|---------------|-------|----------|
| 1 | Visualizzazione lista staff | ✅ | 2 barbieri iniziali (Antonio Romano, Luca Ferrari), iniziale/nome/stato visibili, contatore corretto |
| 2 | Aggiunta nuovo membro | ✅ | "Marco Bianchi" aggiunto, appare con iniziale "M" e stato "Attivo", contatore 2→3 |
| 3 | Modifica membro | ✅ | Modifica inline tramite assegnazione servizi e gestione orari |
| 4 | Assegnazione servizi | ✅ | Pannello checkbox espandibile, "Taglio Uomo" e "Barba" assegnati, messaggio "Salvato!" |
| 5 | Toggle attiva/disattiva | ✅ | Badge "Disattivato" visibile, riattivazione immediata |
| 6 | Eliminazione membro | ✅ | "Marco Bianchi" eliminato, contatore 3→2 |

### Bug trovato e fixato

#### ⚠️ Mancanza conferma eliminazione staff (BASSO → FIXATO)

**Problema:** Il click sul cestino eliminava immediatamente il barbiere senza conferma. Un click accidentale poteva cancellare un membro staff senza possibilita' di annullamento.

**File modificato:** `src/components/staff/staff-manager.tsx`
**Fix:** Sostituito `confirm()` nativo del browser con un pannello di conferma inline integrato nella card del barbiere:
- Icona `AlertTriangle` rossa con messaggio "Eliminare [nome]?"
- Testo esplicativo: "Tutti i suoi appuntamenti resteranno ma senza barbiere assegnato."
- Bottone "Elimina" (rosso) + bottone "Annulla"
- Spinner durante l'operazione, stato `deletingId` per gestire quale card mostra la conferma

### Osservazioni

- **Design inline efficiente**: form di aggiunta compatto e intuitivo
- **Gestione servizi granulare**: checkbox per assegnare servizi specifici a ciascun barbiere
- **Performance ottimali**: tutte le operazioni istantanee
- **Flessibilita'**: se nessun servizio selezionato, il barbiere puo' eseguire tutti i servizi

### Conclusione

La pagina Staff e' **pienamente funzionale** e pronta per uso in produzione. Bug di conferma eliminazione fixato. Conferma i risultati della sezione 2 (Onboarding, test 2.5-2.8) della test-checklist.

---

## Test Manuale Pagina Lista d'Attesa (11/02/2026 — sessione Windsurf Cascade)

Test approfondito della pagina `/dashboard/waitlist` eseguito manualmente nel browser (localhost:3000). 5 funzionalita' testate, tutte ✅, 1 bug di validazione trovato e fixato.

### Funzionalita' testate

| # | Funzionalita' | Esito | Dettagli |
|---|---------------|-------|----------|
| 1 | Stato vuoto | ✅ | Icona orologio, "Nessuno in lista d'attesa", 4 contatori a 0 (In attesa, Notificati, Convertiti, Scaduti) |
| 2 | Aggiunta cliente | ✅ | Modal con tab "Esistente"/"Nuovo", ricerca cliente, dropdown servizi con durata, date picker, orario opzionale |
| 3 | Validazione campi | ✅ | Errore "Seleziona una data" se data vuota, campi obbligatori identificati |
| 4 | Dashboard contatori | ✅ | 4 card statistiche con icone distintive (orologio, campanella, check, calendario) |
| 5 | Ricerca | ✅ | Barra di ricerca con placeholder "Cerca nome, telefono, servizio..." |

### Bug trovato e fixato

#### ⚠️ Validazione date passate mancante lato server (MEDIO → FIXATO)

**Problema:** L'input date HTML aveva gia' `min={today}` che impediva la selezione di date passate nel browser, ma il server action `addToWaitlist` non validava che la data fosse oggi o nel futuro. Un client modificato o una richiesta diretta poteva inserire date passate nella waitlist.

**File modificati:**
- `src/actions/waitlist.ts` — Aggiunto `.refine()` allo schema Zod `addToWaitlistSchema` per rifiutare date passate con messaggio "La data deve essere oggi o nel futuro"
- `src/components/waitlist/waitlist-manager.tsx` — Aggiunta validazione client-side esplicita `desiredDate < today` in `handleSubmit()` come doppia protezione

### Osservazioni

- **Interfaccia chiara**: stato vuoto ben progettato con messaggi informativi
- **Dashboard completa**: 4 contatori per monitorare lo stato della lista
- **Automazione intelligente**: clienti aggiunti automaticamente su cancellazione appuntamenti
- **Form strutturato**: selezione clienti esistenti/nuovi + servizi con durata
- **Flessibilita'**: orario preferito opzionale

### Conclusione

La pagina Lista d'Attesa e' **pienamente funzionale** e pronta per uso in produzione. Bug di validazione date fixato (server + client). Conferma i risultati della sezione 9 (Waitlist) della test-checklist.

---

## Integrazione Waitlist — Booking + Calendario (11/02/2026 — sessione Windsurf Cascade)

Due nuove feature implementate per collegare la lista d'attesa al booking pubblico e al calendario del barbiere.

### Feature 1 — Auto-add waitlist dal booking wizard

Quando un cliente seleziona una data senza slot disponibili nella pagina di prenotazione pubblica (`/book/[slug]`), ora appare un bottone **"Avvisami se si libera un posto"**. Cliccandolo si apre un form inline (nome, cognome, telefono) che iscrive il cliente alla lista d'attesa per quella data e servizio.

**File modificati:**
- `src/actions/waitlist.ts` — Nuova server action `addToWaitlistPublic()` (no auth, usa businessId direttamente, find-or-create client per telefono, Zod validation con date future)
- `src/components/booking/booking-wizard.tsx` — Stato `waitlistMode`, form inline con nome/cognome/telefono, schermata di successo "Sei in lista d'attesa!" con icona blu

**Flusso completo:**
1. Cliente sceglie servizio → barbiere → data
2. Se nessun slot disponibile → appare "Avvisami se si libera un posto"
3. Cliente inserisce dati → "Iscrivimi"
4. Entry creata in `waitlist` con `status = waiting`
5. Schermata conferma: "Ti avviseremo via WhatsApp se si libera un posto"
6. Quando un appuntamento viene cancellato → `notifyWaitlistOnCancel()` invia WhatsApp automaticamente

### Feature 2 — Badge waitlist nel calendario

Il calendario del barbiere ora mostra un banner blu quando ci sono clienti in lista d'attesa per la data visualizzata. Es: "2 clienti in lista d'attesa per questa data".

**File modificati:**
- `src/actions/waitlist.ts` — Nuova server action `getWaitlistCountsByDate()` (ritorna mappa `date → count` per entry `waiting` da oggi in poi)
- `src/app/(dashboard)/dashboard/page.tsx` — Fetch `waitlistCounts` in parallelo con gli altri dati, passato a `CalendarView`
- `src/components/calendar/calendar-view.tsx` — Nuova prop `waitlistCounts`, banner blu con icona `ClockAlert` sopra il banner chiusure

### Risultato

Il barbiere ora ha visibilita' immediata sulla domanda dei clienti per ogni giorno, e i clienti che non trovano posto vengono automaticamente catturati nella lista d'attesa invece di perdersi.

---

## Analytics Real-Time Trigger (11/02/2026 — sessione Windsurf Cascade)

La pagina Analytics (/dashboard/analytics) non mostrava i dati degli appuntamenti completati. Indagine completa del flusso dati ha rivelato il problema e la fix e' stata applicata.

### Problema identificato

La tabella `analytics_daily` veniva popolata **solo una volta al giorno** dal cron job `analytics-daily-calc` (02:05 UTC), che calcolava **solo il giorno precedente** (`CURRENT_DATE - 1`). Conseguenze:

1. Appuntamenti completati oggi non apparivano in Analytics fino a dopodomani mattina
2. Se un appuntamento veniva completato/modificato dopo il passaggio del cron per quella data, il dato restava sbagliato
3. Il barbiere vedeva sempre dati in ritardo di 1-2 giorni

Dati trovati su Supabase:
- `analytics_daily` aveva solo 2 righe (9 e 10 Feb), entrambe con 0 completati e 0 fatturato
- 1 appuntamento completato il 13 Feb ("Taglio Uomo", €25.00) non era stato calcolato
- Il cron del 11 Feb alle 02:05 aveva calcolato il 10 Feb (correttamente 0)

### Soluzione implementata

**Approccio: trigger real-time + cron notturno come safety net**

1. **Backfill dati mancanti**: eseguito `calculate_analytics_daily()` per tutte le date con appuntamenti (11-14 Feb). Il 13 Feb ora mostra correttamente €25.00 fatturato, 1 completato, 1 no-show.

2. **Trigger SQL real-time** (migrazione #22 `analytics_realtime_trigger`):
   - Funzione `recalc_analytics_on_appointment_change()` (SECURITY DEFINER, search_path = 'public')
   - Trigger `trg_recalc_analytics` su `appointments` (AFTER INSERT/UPDATE OF status,date,service_id/DELETE)
   - Quando un appuntamento cambia stato, data o servizio → `calculate_analytics_daily(date)` viene chiamata istantaneamente
   - Se la data cambia su UPDATE, ricalcola sia la vecchia che la nuova data
   - Su DELETE, ricalcola la data dell'appuntamento eliminato

3. **Cron aggiornato**: `analytics-daily-calc` ora calcola sia `CURRENT_DATE - 1` che `CURRENT_DATE` (safety net per eventuali incongruenze)

### File modificati/creati

- `supabase/migrations/20260211_analytics_realtime_trigger.sql` — nuova migrazione (trigger + funzione + cron update)
- `Dev Barbieri/Sviluppo/Architettura.md` — 10 SQL functions, trigger, 22 migrazioni, flusso cambio stato aggiornato
- `Dev Barbieri/Sviluppo/Configurazioni.md` — funzioni DB (calculate_analytics_daily, recalc_analytics_on_appointment_change), migrazione #22
- `CLAUDE.md` — analytics trigger info nella sezione External Services
- `Dev Barbieri/Sviluppo/Stato-progetto.md` — Sezione 12 aggiornata con trigger real-time
- `Dev Barbieri/Sviluppo/Scheda-tecnica.md` — CORE 11, analytics_daily, Flusso analytics aggiornati
- `Dev Barbieri/Sviluppo/Roadmap.md` — Fase C analytics entry aggiornata
- `Dev Barbieri/Sviluppo/Stack-moderno.md` — Sezione cron aggiornata

### Risultato

D'ora in poi, ogni cambio di stato appuntamento (completato, cancellato, no-show) aggiorna Analytics **istantaneamente**. Il barbiere vede fatturato, appuntamenti e servizi piu' richiesti in tempo reale senza ritardi.
