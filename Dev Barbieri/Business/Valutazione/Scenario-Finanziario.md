# Scenario Finanziario BarberOS — Febbraio 2026

**Proiezioni di incasso, costi, break-even e margini con il pricing aggiornato.**

---

## 1. Pricing confermato

| Voce | Essential | Professional | Enterprise |
|---|---|---|---|
| **Setup (una tantum)** | €500 | €500 | €1.500-2.000 (manuale) |
| **Abbonamento** | €300/mese | €500/mese | Custom |
| **Target** | 1-2 poltrone | 3-5 poltrone | Multi-sede |
| **Contratto** | 12 mesi | 12 mesi | Custom |
| **Trial** | 7 giorni | 7 giorni | N/A |

**Mix atteso**: 60% Essential + 40% Professional (basato sul mercato — la maggioranza delle barberie ha 1-2 poltrone, ma quelle strutturate sono più propense a comprare).

**Revenue media per cliente**: (€300 × 0.6) + (€500 × 0.4) = **€380/mese ricorrente** + €500 setup una tantum.

---

## 2. Costi fissi e variabili

### Costi fissi (indipendenti dal numero di clienti)

| Voce | Costo/mese | Costo/anno | Note |
|---|---|---|---|
| Supabase Pro | €23 (~$25) | €276 | Database, Auth, Edge Functions, pg_cron |
| Vercel Pro | €18 (~$20) | €216 | Hosting, Server Actions, Analytics |
| Dominio + Cloudflare | €1,25 | €15 | DNS, CDN, SSL |
| **Totale fisso** | **€42/mese** | **€507/anno** | |

### Costi variabili (per cliente)

| Voce | Costo/cliente/mese | Note |
|---|---|---|
| Twilio WhatsApp | €3-5 | ~60-100 msg/mese a €0.05/msg |
| Stripe fees (su abbonamento) | €5,95-7,75 | 1.5% + €0.25 su €300-500 |
| Stripe fees (su setup €500) | €7,75 (una tantum) | 1.5% + €0.25 |
| **Totale variabile** | **€9-13/cliente/mese** | Media: ~€11/cliente/mese |

### Costo Stripe sul setup (una tantum per cliente)

- Setup €500 → Stripe prende 1.5% + €0.25 = **€7,75**
- Incasso netto setup: **€492,25**

---

## 3. Scenari per numero di clienti

### Ipotesi base

- Mix: 60% Essential (€300/mese) + 40% Professional (€500/mese) → media €380/mese
- Setup: €500 per ogni nuovo cliente
- Costi variabili: €11/cliente/mese (Twilio + Stripe)
- Costi fissi: €42/mese
- Churn: 5%/mese (conservativo — 1 su 20 cancella ogni mese)

---

### Scenario A — 5 clienti

| Voce | Mensile | Annuo |
|---|---|---|
| **Revenue ricorrente** | €1.900 | €22.800 |
| **Setup (una tantum, anno 1)** | — | €2.500 |
| **Revenue totale anno 1** | — | **€25.300** |
| Costi fissi | -€42 | -€507 |
| Costi variabili (5 × €11) | -€55 | -€660 |
| Stripe su setup (5 × €7,75) | — | -€39 |
| **Costi totali** | **-€97/mese** | **-€1.206/anno** |
| **Profitto netto** | **€1.803/mese** | **€24.094/anno** |
| **Margine** | **95%** | |

### Scenario B — 10 clienti

| Voce | Mensile | Annuo |
|---|---|---|
| **Revenue ricorrente** | €3.800 | €45.600 |
| **Setup (una tantum, anno 1)** | — | €5.000 |
| **Revenue totale anno 1** | — | **€50.600** |
| Costi fissi | -€42 | -€507 |
| Costi variabili (10 × €11) | -€110 | -€1.320 |
| Stripe su setup (10 × €7,75) | — | -€78 |
| **Costi totali** | **-€152/mese** | **-€1.905/anno** |
| **Profitto netto** | **€3.648/mese** | **€48.695/anno** |
| **Margine** | **96%** | |

### Scenario C — 20 clienti

| Voce | Mensile | Annuo |
|---|---|---|
| **Revenue ricorrente** | €7.600 | €91.200 |
| **Setup (una tantum, anno 1)** | — | €10.000 |
| **Revenue totale anno 1** | — | **€101.200** |
| Costi fissi | -€42 | -€507 |
| Costi variabili (20 × €11) | -€220 | -€2.640 |
| Stripe su setup (20 × €7,75) | — | -€155 |
| **Costi totali** | **-€262/mese** | **-€3.302/anno** |
| **Profitto netto** | **€7.338/mese** | **€97.898/anno** |
| **Margine** | **97%** | |

### Scenario D — 50 clienti

| Voce | Mensile | Annuo |
|---|---|---|
| **Revenue ricorrente** | €19.000 | €228.000 |
| **Setup (una tantum, anno 1)** | — | €25.000 |
| **Revenue totale anno 1** | — | **€253.000** |
| Costi fissi | -€42 | -€507 |
| Costi variabili (50 × €11) | -€550 | -€6.600 |
| Stripe su setup (50 × €7,75) | — | -€388 |
| **Costi totali** | **-€592/mese** | **-€7.495/anno** |
| **Profitto netto** | **€18.408/mese** | **€245.505/anno** |
| **Margine** | **97%** | |

### Scenario E — 100 clienti

| Voce | Mensile | Annuo |
|---|---|---|
| **Revenue ricorrente** | €38.000 | €456.000 |
| **Setup (una tantum, anno 1)** | — | €50.000 |
| **Revenue totale anno 1** | — | **€506.000** |
| Costi fissi | -€42 | -€507 |
| Costi variabili (100 × €11) | -€1.100 | -€13.200 |
| Stripe su setup (100 × €7,75) | — | -€775 |
| Supabase upgrade (stima) | -€50 | -€600 |
| **Costi totali** | **-€1.192/mese** | **-€15.082/anno** |
| **Profitto netto** | **€36.808/mese** | **€490.918/anno** |
| **Margine** | **97%** | |

---

## 4. Break-even: quando rientri dei costi

### Costi sostenuti finora (sviluppo)

Il software è stato sviluppato da te in prima persona. Il costo-opportunità (quanto avresti guadagnato lavorando per altri) è il vero "investimento":

| Voce | Stima |
|---|---|
| Tempo sviluppo (6-8 mesi) | €0 cash (lavoro proprio) |
| Infrastruttura durante sviluppo (~8 mesi × €42) | ~€340 |
| Twilio test/dev | ~€50 |
| Stripe test | €0 (test mode) |
| **Costo cash totale** | **~€400** |

Il break-even in termini di cash è praticamente **immediato con il primo cliente** (€500 setup + €380/mese > €400 di costi sostenuti).

### Break-even in termini di costo-opportunità

Se valuti il tuo tempo a €25/h (junior dev) per 8 mesi full-time (~1.400h):

| Voce | Importo |
|---|---|
| Costo-opportunità sviluppo | €35.000 |
| Costi cash | €400 |
| **Totale da recuperare** | **€35.400** |

| Clienti | Profitto mensile | Mesi per break-even |
|---|---|---|
| 5 | €1.803 | **20 mesi** |
| 10 | €3.648 | **10 mesi** |
| 20 | €7.338 | **5 mesi** |
| 50 | €18.408 | **2 mesi** |

Con 10 clienti rientri del costo-opportunità in meno di un anno. Con 20 clienti in 5 mesi.

---

## 5. Proiezione crescita 24 mesi

### Ipotesi di acquisizione clienti

- **Mesi 1-3**: 1 cliente/mese (vendita diretta, passaparola) → 3 clienti
- **Mesi 4-6**: 2 clienti/mese (referral attivo, primi case study) → 9 clienti
- **Mesi 7-12**: 3 clienti/mese (venditori, marketing) → 27 clienti
- **Mesi 13-24**: 5 clienti/mese (scala, brand awareness) → 87 clienti
- **Churn**: 5%/mese applicato dal mese 4

### Proiezione mese per mese (primi 12 mesi)

| Mese | Nuovi | Churn | Clienti attivi | MRR | Setup incassato | Profitto netto mese |
|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 1 | €380 | €500 | €827 |
| 2 | 1 | 0 | 2 | €760 | €500 | €1.196 |
| 3 | 1 | 0 | 3 | €1.140 | €500 | €1.565 |
| 4 | 2 | 0 | 5 | €1.900 | €1.000 | €2.803 |
| 5 | 2 | 0 | 7 | €2.660 | €1.000 | €3.573 |
| 6 | 2 | 0 | 9 | €3.420 | €1.000 | €4.279 |
| 7 | 3 | 0 | 12 | €4.560 | €1.500 | €5.928 |
| 8 | 3 | 1 | 14 | €5.320 | €1.500 | €6.616 |
| 9 | 3 | 1 | 16 | €6.080 | €1.500 | €7.304 |
| 10 | 3 | 1 | 18 | €6.840 | €1.500 | €7.992 |
| 11 | 3 | 1 | 20 | €7.600 | €1.500 | €8.680 |
| 12 | 3 | 1 | 22 | €8.360 | €1.500 | €9.368 |

### Totali anno 1

| Metrica | Valore |
|---|---|
| **Clienti a fine anno** | 22 |
| **MRR a fine anno** | €8.360 |
| **ARR a fine anno** | €100.320 |
| **Revenue ricorrente totale anno 1** | ~€52.000 |
| **Setup incassato anno 1** | €13.500 (27 clienti acquisiti) |
| **Revenue totale anno 1** | **~€65.500** |
| **Costi totali anno 1** | ~€3.500 |
| **Profitto netto anno 1** | **~€62.000** |

### Totali anno 2 (mesi 13-24)

| Metrica | Valore |
|---|---|
| **Clienti a fine anno 2** | ~70 (con churn 5%) |
| **MRR a fine anno 2** | ~€26.600 |
| **ARR a fine anno 2** | ~€319.200 |
| **Revenue totale anno 2** | **~€250.000** |
| **Profitto netto anno 2** | **~€235.000** |

---

## 6. Impatto del setup €500 vs €0

| Metrica (anno 1, 27 clienti acquisiti) | Con setup €500 | Senza setup |
|---|---|---|
| Revenue setup | €13.500 | €0 |
| Revenue ricorrente | €52.000 | €52.000 |
| **Revenue totale** | **€65.500** | **€52.000** |
| Conversione stimata | Base | +15-25% più conversioni |
| Clienti stimati (con boost conversione) | 27 | 32-34 |
| Revenue con più clienti | €65.500 | €60.000-64.000 |

**Conclusione**: il setup €500 genera **€1.500-5.500 in più** rispetto a zero setup, anche considerando che senza setup avresti più conversioni. Il setup si giustifica economicamente.

Ma il vero valore del setup è **psicologico**: il cliente che paga €500 upfront è più committed, ha meno churn, e percepisce il prodotto come premium. Il churn di clienti che pagano setup è tipicamente **30-50% inferiore**.

---

## 7. Sensitivity analysis: cosa succede se...

### Churn più alto (10%/mese invece di 5%)

| Metrica | Churn 5% | Churn 10% |
|---|---|---|
| Clienti fine anno 1 | 22 | 16 |
| MRR fine anno 1 | €8.360 | €6.080 |
| Profitto anno 1 | €62.000 | €48.000 |

Anche con churn doppio, il business è profittevole dal mese 1.

### Mix più sbilanciato verso Essential (80/20 invece di 60/40)

| Metrica | Mix 60/40 | Mix 80/20 |
|---|---|---|
| Revenue media/cliente | €380/mese | €340/mese |
| MRR con 22 clienti | €8.360 | €7.480 |
| Differenza annua | — | -€10.560 |

Impatto moderato: €880/mese in meno. Il business resta solido.

### Nessun cliente per 3 mesi (partenza lenta)

| Metrica | Costo |
|---|---|
| Costi fissi 3 mesi senza clienti | €126 (€42 × 3) |
| Impatto | Trascurabile |

I costi fissi sono così bassi che puoi permetterti mesi a zero senza stress.

---

## 8. Riepilogo: i numeri che contano

| Domanda | Risposta |
|---|---|
| **Quanti clienti per coprire i costi fissi?** | **1 cliente** (€380/mese > €42/mese di costi fissi) |
| **Quanti clienti per €2.000/mese netti?** | **6 clienti** |
| **Quanti clienti per €5.000/mese netti?** | **14 clienti** |
| **Quanti clienti per €10.000/mese netti?** | **28 clienti** |
| **Quando rientro del costo-opportunità (€35k)?** | **10 mesi con 10 clienti, 5 mesi con 20 clienti** |
| **Margine lordo?** | **95-97%** a qualsiasi scala |
| **Revenue anno 1 (scenario realistico)?** | **~€65.500** (22 clienti attivi + setup) |
| **Revenue anno 2?** | **~€250.000** (70 clienti attivi) |
| **Costo per acquisire un cliente?** | €0 se passaparola, €50-200 se ads/venditori |
| **LTV medio (12 mesi, churn 5%)?** | €380 × 12 × 0.95^6 ≈ **€3.350** + €500 setup = **€3.850** |
| **Rapporto LTV/CAC?** | €3.850 / €100 (stima) = **38x** (eccellente, >3x è buono) |

---

## 9. Il setup €500 nel contesto

Il setup da €500 con 50 clienti nel primo anno genera **€25.000 extra** rispetto a zero setup. Ma il suo vero ruolo è:

1. **Filtro qualità**: chi paga €500 upfront è serio, ha budget, e resta più a lungo
2. **Copertura onboarding**: 6-10h di lavoro a €50-80/h effettivi — ragionevole
3. **Cash flow iniziale**: i primi mesi hai pochi clienti e il setup copre i costi fissi immediatamente
4. **Percezione premium**: BarberOS non è "l'ennesimo gestionale da €30/mese" — è un investimento

Il ricorrente resta il cuore del business: **€500 setup è il 12% del revenue anno 1**, il restante 88% è abbonamento mensile.
