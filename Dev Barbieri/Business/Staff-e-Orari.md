BARBEROS — GESTIONE STAFF E ORARI

Documento per presentazione. Spiega come funziona la logica di staff, orari di lavoro, servizi e prenotazione.

Ultimo aggiornamento: 11 febbraio 2026 (notte)

---

CONCETTI CHIAVE

1. Business (Barberia)
   - Ogni account BarberOS corrisponde a una barberia
   - La barberia ha orari di apertura generali (opening_hours): per ogni giorno della settimana, orario apertura, orario chiusura, e flag aperto/chiuso
   - Ha anche giorni di chiusura straordinaria (feste, ferie) gestibili dalla dashboard

2. Staff (Barbieri)
   - Ogni barberia può avere più barbieri (illimitati nel piano)
   - Ogni barbiere ha: nome, foto (opzionale), stato attivo/inattivo, ordine di visualizzazione
   - Ogni barbiere ha i propri orari di lavoro indipendenti dalla barberia

3. Servizi
   - Ogni barberia definisce i propri servizi: nome, durata (15-120 min in step da 15), prezzo
   - I servizi possono essere combinati (es. Taglio + Barba = combo con durata sommata)
   - Ogni servizio può essere attivato/disattivato senza cancellarlo

4. Associazione Staff ↔ Servizi
   - Tabella ponte many-to-many: ogni barbiere può offrire uno o più servizi
   - Ogni servizio può essere offerto da uno o più barbieri
   - Se nessuna associazione è configurata → tutti i barbieri offrono tutti i servizi (fallback)

---

ORARI DI LAVORO STAFF

Ogni barbiere ha un record JSON "working_hours" con 7 giorni:

  {
    "monday":    { "start": "09:00", "end": "19:00", "breakStart": "13:00", "breakEnd": "14:00", "off": false },
    "tuesday":   { "start": "09:00", "end": "19:00", "off": false },
    "wednesday": { "start": "09:00", "end": "19:00", "off": false },
    "thursday":  { "start": "09:00", "end": "19:00", "off": false },
    "friday":    { "start": "09:00", "end": "19:00", "off": false },
    "saturday":  { "start": "09:00", "end": "17:00", "off": false },
    "sunday":    { "start": "09:00", "end": "13:00", "off": true }
  }

Per ogni giorno:
- start / end: orario inizio e fine turno (formato HH:MM)
- breakStart / breakEnd: pausa pranzo (opzionale)
- off: true = giorno libero, il barbiere non lavora

Valori di default alla creazione di un nuovo barbiere:
- Lun-Ven: 09:00 - 19:00
- Sabato: 09:00 - 17:00
- Domenica: off

Il barbiere può personalizzare liberamente i propri orari dalla pagina Staff della dashboard.

---

ORARI DI APERTURA BUSINESS

La barberia ha un record JSON "opening_hours" con 7 giorni:

  {
    "monday":    { "open": "09:00", "close": "20:00", "closed": false },
    "tuesday":   { "open": "09:00", "close": "20:00", "closed": false },
    ...
    "sunday":    { "open": "09:00", "close": "13:00", "closed": true }
  }

Per ogni giorno:
- open / close: orario apertura e chiusura della barberia
- closed: true = barberia chiusa quel giorno

Configurabili dalla pagina Impostazioni > Orari di apertura.

---

LOGICA SLOT DISPONIBILI (BOOKING)

Quando un cliente prenota online, il sistema calcola gli slot disponibili combinando:

1. INTERSEZIONE orari business + orari staff:
   - effectiveStart = il PIÙ TARDI tra business.open e staff.start
   - effectiveEnd = il PIÙ PRESTO tra business.close e staff.end
   - Se staff è off → nessuno slot (anche se la barberia è aperta)
   - Se barberia è chiusa → nessuno slot (anche se lo staff è disponibile)
   - Se intersezione vuota (start >= end) → nessuno slot

   Esempio:
   - Barberia apre 09:00, chiude 20:00
   - Barbiere inizia 10:00, finisce 18:00
   → Slot disponibili: 10:00 - 18:00 (intersezione)

2. PAUSA PRANZO dello staff:
   - Se il barbiere ha breakStart/breakEnd, gli slot che sovrappongono la pausa vengono esclusi
   - Esempio: pausa 13:00-14:00 → nessuno slot che inizia prima delle 14:00 e finisce dopo le 13:00

3. APPUNTAMENTI ESISTENTI:
   - Gli slot che sovrappongono un appuntamento già prenotato (booked, confirmed, completed) vengono esclusi
   - Controllo overlap: slotStart < appointmentEnd AND slotEnd > appointmentStart

4. CHIUSURE STRAORDINARIE:
   - Se la data è in business_closures → nessuno slot per nessun barbiere
   - Le date di chiusura sono disabilitate nel selettore date del booking

5. DURATA SERVIZIO:
   - Lo slot deve avere spazio sufficiente per la durata del servizio scelto
   - Se il servizio dura 45 min e lo slot finisce alle 18:00, l'ultimo slot possibile è 17:15
   - Incremento slot: ogni 15 minuti

6. BLOCCO SLOT PASSATI (data odierna):
   - Se la data selezionata è OGGI, gli slot con orario ≤ ora attuale NON vengono mostrati
   - Esempio: sono le 10:30 → gli slot 09:00, 09:15, 09:30, ..., 10:15, 10:30 non appaiono
   - Il primo slot visibile sarà 10:45 (il prossimo disponibile dopo l'ora corrente)
   - Protezione doppia: anche se qualcuno bypassasse il client, il server rifiuta con errore
     "Non è possibile prenotare un appuntamento nel passato."
   - Per date future (domani, dopodomani, ecc.) tutti gli slot vengono mostrati normalmente

---

FILTRO SERVIZI E STAFF NEL BOOKING

Flusso di prenotazione: Servizio → Barbiere → Data/Ora → Conferma

1. Lista servizi (Step 1):
   - Se esistono associazioni staff_services → mostra SOLO i servizi che hanno almeno un barbiere associato
   - Se nessuna associazione esiste → mostra tutti i servizi attivi (backwards compatible)
   - Servizi senza barbiere associato NON appaiono nella pagina di booking

2. Lista barbieri (Step 2):
   - Dopo aver scelto un servizio, mostra solo i barbieri che offrono quel servizio
   - Se nessuna associazione esiste → mostra tutti i barbieri attivi
   - Se un solo barbiere offre il servizio → salta automaticamente allo step Data/Ora

3. Date e orari (Step 3):
   - Mostra 14 giorni in avanti (a partire da oggi)
   - Per ogni data, calcola gli slot disponibili con la logica sopra
   - Per la data odierna: slot con orario ≤ ora attuale nascosti automaticamente
   - Date chiuse (business_closures) sono disabilitate
   - Giorni off del barbiere sono disabilitati

---

GESTIONE STAFF DALLA DASHBOARD

Pagina: /dashboard/staff

Funzionalità:
- Aggiungere nuovi barbieri (nome obbligatorio)
- Modificare nome e stato attivo/inattivo
- Editor orari di lavoro: pannello espandibile per ogni barbiere con 7 giorni
  - Toggle aperto/chiuso per ogni giorno
  - Ora inizio e fine per ogni giorno
  - Ora inizio e fine pausa (opzionale)
- Associazione servizi: per ogni barbiere, selezionare quali servizi offre (checkbox)
- Riordinare i barbieri (drag & drop con sort_order)
- Eliminare barbieri (con conferma)
- Barbieri inattivi non appaiono nel booking pubblico né nel calendario

Server Actions (src/actions/staff.ts):
- getStaff() — lista barbieri ordinati per sort_order
- createStaffMember(formData) — crea con orari default
- updateStaffMember(staffId, formData) — aggiorna nome e stato
- updateStaffWorkingHours(staffId, workingHours) — aggiorna orari di lavoro
- getStaffServices(businessId?) — lista associazioni staff-servizi
- updateStaffServices(staffId, serviceIds) — aggiorna associazioni (delete + insert)
- reorderStaff(staffIds) — aggiorna sort_order
- deleteStaffMember(staffId) — elimina barbiere

Validazione Zod su tutti gli input:
- Nome: stringa non vuota
- Orari: formato HH:MM con regex
- ID: UUID valido

---

GESTIONE SERVIZI DALLA DASHBOARD

Pagina: /dashboard/services

Funzionalità:
- Creare servizi: nome, durata (15-120 min in step da 15), prezzo
- Modificare servizi esistenti
- Attivare/disattivare servizi (toggle) senza cancellarli
- Eliminare servizi (con conferma)
- Servizi combo: combinazione di più servizi con durata sommata e prezzo dedicato
- Durate permesse: 15, 30, 45, 60, 75, 90, 105, 120 minuti (ALLOWED_DURATIONS)

---

STATO APPUNTAMENTI

Un appuntamento passa attraverso questi stati:

  booked → confirmed → completed
                    ↘ cancelled
                    ↘ no_show

- booked: appena creato (prenotazione online o manuale)
- confirmed: confermato dal cliente (via WhatsApp) o dal barbiere
- completed: servizio completato (manuale o auto-complete dopo 20 min dal termine)
- cancelled: cancellato dal cliente o auto-cancellato per mancata conferma
- no_show: il cliente non si è presentato (segnato manualmente dal barbiere)

Regole:
- Non è possibile segnare "completed" o "no_show" un appuntamento FUTURO (data > oggi)
- È possibile ripristinare un appuntamento da "completed" o "no_show" a "confirmed" (pulsante "Ripristina")
- Il ripristino annulla automaticamente i side-effect (decrementa total_visits o no_show_count)
- Auto-complete: pg_cron ogni 20 min segna confirmed → completed dopo end_time + ritardo configurabile

---

CALENDARIO DASHBOARD

Pagina: /dashboard (home)

- Vista giornaliera: timeline oraria con colonne per ogni barbiere attivo
- Vista settimanale: griglia 7 giorni con appuntamenti
- Navigazione: frecce avanti/indietro, selettore data
- Colori stato: viola (booked), blu (confirmed), verde (completed), rosso (cancelled), grigio (no_show)
- Aggiunta walk-in: dialog modale per appuntamenti senza prenotazione online
- Dettaglio appuntamento: pannello laterale con info cliente, servizio, prezzo, azioni rapide
- Banner waitlist: se ci sono clienti in lista d'attesa per la data visualizzata, banner blu con conteggio
- Filtro per barbiere singolo

---

CHIUSURE STRAORDINARIE

Pagina: /dashboard/settings > Chiusure

- Aggiungere date di chiusura con motivo opzionale (es. "Ferie estive", "Festa patronale")
- Le date di chiusura:
  - Disabilitano tutti gli slot nel booking pubblico per quella data
  - Mostrano un banner arancione nel calendario dashboard
  - Impediscono la creazione di walk-in per quella data
- Rimuovere chiusure per riaprire la data

---

ESEMPIO PRATICO PER PRESENTAZIONE

Scenario: Barberia "Da Marco" con 2 barbieri

Staff:
- Marco: Lun-Sab 09:00-19:00, pausa 13:00-14:00, offre Taglio, Barba, Taglio+Barba
- Antonio: Lun-Ven 10:00-18:00, nessuna pausa, offre solo Taglio e Barba

Servizi:
- Taglio: 30 min, €20 → offerto da Marco e Antonio
- Barba: 20 min, €15 → offerto da Marco e Antonio
- Taglio + Barba (combo): 45 min, €30 → offerto solo da Marco
- Trattamento Capelli: 60 min, €40 → NON associato a nessun barbiere

Cosa vede il cliente nella pagina di booking:
1. Servizi disponibili: Taglio, Barba, Taglio+Barba (il Trattamento Capelli NON appare perché nessun barbiere lo offre)
2. Se sceglie "Taglio": vede Marco e Antonio
3. Se sceglie "Taglio+Barba": vede solo Marco (unico che lo offre) → salta direttamente a Data/Ora
4. Se sceglie Marco + Mercoledì: slot 09:00-13:00 e 14:00-19:00 (pausa esclusa)
5. Se sceglie Antonio + Sabato: nessuno slot (Antonio lavora solo Lun-Ven)

Orari business: Lun-Sab 09:00-20:00, Domenica chiuso
- Marco lavora fino alle 19:00 → ultimo slot possibile alle 18:30 (per servizio 30 min)
- Antonio inizia alle 10:00 → primo slot alle 10:00 (anche se la barberia apre alle 09:00)

Scenario slot passati (per la presentazione):
- Oggi è mercoledì, sono le 14:30
- Il cliente apre la pagina di booking e seleziona "Oggi"
- Sceglie Marco (orario 09:00-19:00, pausa 13:00-14:00)
- Slot che NON appaiono: 09:00, 09:15, ..., 14:15, 14:30 (tutti nel passato)
- Primo slot visibile: 14:45
- Se il cliente avesse selezionato "Domani" → tutti gli slot da 09:00 in poi sarebbero visibili
- Protezione server: anche manipolando il browser, il server rifiuta prenotazioni nel passato
