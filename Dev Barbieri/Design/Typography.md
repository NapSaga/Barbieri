# Tipografia - Barbeiros

## Font Stack

### Font Primario: Inter

Gia' configurato nel progetto via Google Fonts.

```tsx
// src/app/layout.tsx (attuale)
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })
```

**Perche' Inter:**
- Ottimizzato per UI/dashboard
- Eccellente leggibilita' a tutte le dimensioni
- Supporto completo caratteri italiani (accenti, etc.)
- Variable font = un solo file, tutti i pesi
- Standard de facto per SaaS moderni

### Font Monospace: Geist Mono

Per codici, orari, prezzi in formato tabellare.

```css
--font-mono: "Geist Mono", ui-monospace, monospace;
```

---

## Scala Tipografica

Basata su Tailwind CSS v4 defaults con personalizzazioni.

| Classe | Size | Line Height | Peso | Uso |
|--------|------|-------------|------|-----|
| `text-xs` | 12px | 16px | 400 | Caption, timestamp, meta |
| `text-sm` | 14px | 20px | 400-500 | Body secondario, label form |
| `text-base` | 16px | 24px | 400 | Body principale |
| `text-lg` | 18px | 28px | 500-600 | Sottotitolo sezione |
| `text-xl` | 20px | 28px | 600 | Titolo card |
| `text-2xl` | 24px | 32px | 700 | Titolo pagina |
| `text-3xl` | 30px | 36px | 700 | Hero heading |
| `text-4xl` | 36px | 40px | 800 | Landing page hero |

---

## Stili Tipografici per Contesto

### Dashboard

```tsx
// Titolo pagina
<h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

// Sottotitolo/descrizione
<p className="text-sm text-muted-foreground">
  Panoramica appuntamenti di oggi
</p>

// Titolo card
<h2 className="text-xl font-semibold">Appuntamenti Oggi</h2>

// Stat grande
<span className="text-3xl font-bold tabular-nums">24</span>

// Label form
<label className="text-sm font-medium">Nome cliente</label>

// Placeholder
<input className="placeholder:text-muted-foreground" placeholder="Cerca..." />

// Timestamp
<time className="text-xs text-muted-foreground">14:30</time>

// Prezzo
<span className="text-sm font-medium tabular-nums">€25,00</span>
```

### Booking Page (pubblica)

```tsx
// Nome barberia
<h1 className="text-3xl font-bold text-blue-950">La Barberia di Mario</h1>

// Step title
<h2 className="text-xl font-semibold">Scegli il servizio</h2>

// Prezzo servizio
<span className="text-lg font-semibold text-blue-700">€18,00</span>

// Durata
<span className="text-sm text-gray-500">30 min</span>

// Conferma
<p className="text-base font-medium">Riepilogo prenotazione</p>
```

### CRM Clienti

```tsx
// Nome cliente
<span className="text-base font-semibold">Mario Rossi</span>

// Info secondaria
<span className="text-sm text-muted-foreground">+39 333 1234567</span>

// Note
<p className="text-sm text-gray-600 italic">Cliente abituale, preferisce taglio corto</p>

// Tag
<span className="text-xs font-medium">VIP</span>
```

---

## Numeri e Dati

Usare sempre `tabular-nums` per allineamento numerico:

```tsx
// Orari allineati
<span className="tabular-nums">09:00</span>
<span className="tabular-nums">14:30</span>

// Prezzi allineati
<span className="tabular-nums">€18,00</span>
<span className="tabular-nums">€125,50</span>

// Statistiche
<span className="text-2xl font-bold tabular-nums">1.234</span>
```

---

## Responsive Typography

```tsx
// Heading che scala
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
  Dashboard
</h1>

// Body che scala
<p className="text-sm sm:text-base">
  Descrizione contenuto
</p>
```

---

## Anti-Pattern da Evitare

- **NO** font diversi da Inter per il body (coerenza)
- **NO** `text-justify` (leggibilita' scadente in italiano)
- **NO** ALL CAPS per testo lungo (solo badge, bottoni piccoli)
- **NO** pesi troppo leggeri (< 400) per testo piccolo
- **NO** line-height troppo stretta per paragrafi
- **NO** dimensioni < 12px (leggibilita', accessibilita')
