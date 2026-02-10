# Librerie UI - Analisi e Raccomandazioni

## Analisi effettuata con Context7 (Feb 2026)

Librerie valutate in base a: compatibilita' stack, benchmark score, reputazione, snippet disponibili, e adeguatezza al progetto Barbeiros.

---

## 1. shadcn/ui - COMPONENTI UI PRINCIPALI

**Verdetto: ADOTTARE**

| Metrica | Valore |
|---------|--------|
| Benchmark Score | 77.8/100 |
| Source Reputation | High |
| Code Snippets | 1439+ |
| Compatibilita' | Next.js 16, React 19, Tailwind v4 |

### Perche' shadcn/ui

- **Copy-paste, non dipendenza**: i componenti vivono nel tuo codebase, pieno controllo
- **Basato su Radix UI**: accessibilita' WCAG 2.1 AA built-in
- **Tailwind v4 nativo**: supporto CSS variables con `oklch` color format
- **Lucide icons**: gia' in uso nel progetto
- **Theming avanzato**: variabili CSS per light/dark mode

### Installazione

```bash
# Inizializza shadcn/ui nel progetto
pnpm dlx shadcn@latest init

# Componenti raccomandati per Barbeiros (installare uno alla volta)
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add calendar
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add separator
```

### Configurazione components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Nota Tailwind v4

shadcn/ui supporta Tailwind v4 con il nuovo formato CSS variables in `oklch`. Non serve `tailwind.config.ts` - tutto e' gestito in `globals.css` con `@theme inline`.

---

## 2. Motion (ex Framer Motion) - ANIMAZIONI

**Verdetto: ADOTTARE**

| Metrica | Valore |
|---------|--------|
| Benchmark Score | 89.1/100 |
| Source Reputation | High |
| Code Snippets | 1474 |
| Compatibilita' | React 19, Next.js App Router |

### Perche' Motion

- Benchmark score piu' alto tra tutte le librerie analizzate
- Layout animations per transizioni fluide tra stati
- `AnimatePresence` per animazioni di uscita
- `layoutId` per shared element transitions (es. navigazione tab)
- Supporto Next.js App Router con `"use client"`

### Installazione

```bash
pnpm add motion
```

### Pattern Chiave per Barbeiros

```tsx
"use client"
import { motion, AnimatePresence } from "motion/react"

// Page transitions
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>

// Layout animations (es. sidebar expand/collapse)
<motion.aside layout transition={{ duration: 0.2 }}>

// Shared element (es. tab indicator)
<motion.div layoutId="activeTab" className="..." />

// List stagger (es. lista clienti)
<motion.li
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: index * 0.05 }}
/>
```

---

## 3. Recharts - GRAFICI ANALYTICS

**Verdetto: ADOTTARE**

| Metrica | Valore |
|---------|--------|
| Benchmark Score | 92.8/100 (piu' alto!) |
| Source Reputation | High |
| Code Snippets | 215 |
| Compatibilita' | React 19, SSR-safe |

### Perche' Recharts

- Score piu' alto in assoluto (92.8/100)
- API dichiarativa React-native
- ResponsiveContainer per layout adattivo
- ComposedChart per combinare Line + Bar + Area
- Perfetto per dashboard analytics di Barbeiros

### Installazione

```bash
pnpm add recharts
```

### Grafici Necessari per Barbeiros

1. **Revenue Chart** - LineChart/AreaChart per andamento fatturato giornaliero/settimanale
2. **Appointments Chart** - BarChart per volume appuntamenti per giorno
3. **No-Show Rate** - LineChart per tasso di no-show nel tempo
4. **Services Breakdown** - BarChart orizzontale per servizi piu' richiesti
5. **Client Growth** - AreaChart per crescita clienti nel tempo

---

## 4. Radix UI Primitives - ACCESSIBILITA'

**Verdetto: GIA' INCLUSO (via shadcn/ui)**

| Metrica | Valore |
|---------|--------|
| Benchmark Score | 79.1/100 |
| Source Reputation | High |
| Code Snippets | 1087 |

shadcn/ui e' costruito sopra Radix. Non serve installazione separata - viene incluso automaticamente con ogni componente shadcn/ui.

**Primitivi Radix usati internamente:**
- `@radix-ui/react-dialog` - Dialog, Sheet
- `@radix-ui/react-dropdown-menu` - Menu contestuali
- `@radix-ui/react-popover` - Popover
- `@radix-ui/react-select` - Select custom
- `@radix-ui/react-tooltip` - Tooltip accessibili
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-toast` - Notifiche toast

---

## 5. Librerie Complementari Valutate

### tw-animate-css
**Verdetto: ADOTTARE** (incluso con shadcn/ui)
- Animazioni CSS per Tailwind v4
- Usato da shadcn/ui per animazioni base (fade, slide, scale)

### Sonner
**Verdetto: CONSIDERARE**
- Toast notifications eleganti
- Alternativa piu' moderna al toast di shadcn/ui
- `pnpm add sonner`

### cmdk
**Verdetto: FASE FUTURA**
- Command palette (CMD+K)
- Utile per navigazione rapida quando l'app cresce
- `pnpm add cmdk`

### Vaul
**Verdetto: CONSIDERARE**
- Drawer component per mobile
- Perfetto per la navigazione mobile di Barbeiros
- `pnpm add vaul`

---

## Librerie SCARTATE

| Libreria | Motivo |
|----------|--------|
| Material UI (MUI) | Troppo pesante, stile Google non adatto a barberie |
| Chakra UI | Non compatibile Tailwind v4, approccio diverso |
| Ant Design | Stile enterprise, troppo rigido |
| Mantine | Buono ma ridondante con shadcn/ui |
| Headless UI | Radix UI e' superiore per ecosistema |
| Chart.js | Recharts ha API React-native migliore |
| D3.js | Troppo low-level, Recharts lo wrappa gia' |

---

## Ordine di Implementazione

```
Fase 1 (Immediata):   shadcn/ui + Lucide (base componenti)
Fase 2 (Sprint 2):    Motion (animazioni, transizioni)
Fase 3 (Analytics):   Recharts (dashboard grafici)
Fase 4 (Polish):      Sonner + Vaul (toast + drawer mobile)
Fase 5 (Scale):       cmdk (command palette)
```

---

## Budget Bundle Size Stimato

| Libreria | Dimensione (gzip) |
|----------|--------------------|
| shadcn/ui (tree-shaked) | ~5-15KB per componente |
| Motion | ~18KB |
| Recharts | ~45KB (lazy-loadable) |
| Lucide (per-icon) | ~1KB per icona |
| **Totale aggiuntivo** | **~80-100KB gzip** |

Con React Compiler e tree-shaking di Next.js 16, l'impatto reale sara' minimo.
