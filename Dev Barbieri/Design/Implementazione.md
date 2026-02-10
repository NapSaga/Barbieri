# Guida Implementazione Design - Barbeiros

## Quick Start

### Step 1: Installa shadcn/ui

```bash
cd barberos-mvp
pnpm dlx shadcn@latest init
```

Rispondi al wizard:
- Style: **New York**
- Base color: **Neutral**
- CSS variables: **Yes**
- CSS file: `src/app/globals.css`
- Tailwind config: (lascia vuoto per v4)
- Components: `@/components`
- Utils: `@/lib/utils` (gia' esistente!)
- React Server Components: **Yes**
- Icon library: **Lucide** (gia' in uso)

### Step 2: Installa Componenti Core

```bash
# Batch install dei componenti prioritari
pnpm dlx shadcn@latest add button card dialog input label select sheet table tabs toast tooltip badge avatar skeleton dropdown-menu popover separator
```

### Step 3: Installa Motion

```bash
pnpm add motion
```

### Step 4: Installa Recharts (quando serve analytics)

```bash
pnpm add recharts
```

### Step 5: Aggiorna globals.css

Sostituire il contenuto di `src/app/globals.css` con la palette definita in `Palette-Colori.md`.

---

## Migrazione Componenti Esistenti

### Priorita' 1: Form Elements

**Prima (attuale):**
```tsx
<input
  type="text"
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  placeholder="Cerca..."
/>
```

**Dopo (shadcn/ui):**
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="grid gap-2">
  <Label htmlFor="search">Cerca</Label>
  <Input id="search" placeholder="Cerca..." />
</div>
```

### Priorita' 2: Bottoni

**Prima:**
```tsx
<button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
  Salva
</button>
```

**Dopo:**
```tsx
import { Button } from "@/components/ui/button"

<Button>Salva</Button>
<Button variant="outline">Annulla</Button>
<Button variant="destructive" size="sm">Elimina</Button>
```

### Priorita' 3: Card Layout

**Prima:**
```tsx
<div className="rounded-xl border bg-white p-6 shadow-sm">
  <h2 className="text-lg font-semibold">Titolo</h2>
  <p className="text-sm text-gray-500">Descrizione</p>
</div>
```

**Dopo:**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Titolo</CardTitle>
    <CardDescription>Descrizione</CardDescription>
  </CardHeader>
  <CardContent>
    {/* contenuto */}
  </CardContent>
</Card>
```

### Priorita' 4: Dialog

Il `walk-in-dialog.tsx` e `appointment-sheet.tsx` esistenti vanno migrati a `Dialog` e `Sheet` di shadcn/ui per avere accessibilita' Radix built-in.

---

## Checklist di Migrazione

### Componenti da migrare

- [ ] `src/components/calendar/walk-in-dialog.tsx` -> usa `Dialog` shadcn
- [ ] `src/components/calendar/appointment-sheet.tsx` -> usa `Sheet` shadcn
- [ ] `src/components/calendar/calendar-view.tsx` -> usa `Tabs` shadcn per day/week
- [ ] `src/components/clients/clients-manager.tsx` -> usa `Table`, `Badge`, `Input`, `Dialog`
- [ ] `src/components/services/services-manager.tsx` -> usa `Table`, `Button`, `Dialog`
- [ ] `src/components/staff/staff-manager.tsx` -> usa `Table`, `Avatar`, `Dialog`
- [ ] `src/components/booking/booking-wizard.tsx` -> usa `Button`, `Card`, animazioni Motion
- [ ] `src/components/shared/sidebar.tsx` -> usa `Tooltip`, animazioni Motion
- [ ] `src/components/settings/settings-manager.tsx` -> usa `Input`, `Label`, `Card`, `Tabs`

### Nuovi componenti da creare

- [ ] `src/components/ui/` (cartella shadcn - creata automaticamente)
- [ ] `src/components/shared/page-transition.tsx` (Motion wrapper)
- [ ] `src/components/shared/empty-state.tsx`
- [ ] `src/components/analytics/stats-card.tsx` (Recharts + Card)
- [ ] `src/components/analytics/revenue-chart.tsx` (Recharts AreaChart)
- [ ] `src/components/analytics/appointments-chart.tsx` (Recharts BarChart)

---

## Struttura File Finale

```
src/
├── app/
│   ├── globals.css          # AGGIORNATO con palette oklch
│   └── ...
├── components/
│   ├── ui/                  # NUOVO - shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── ... (15+ componenti)
│   │   └── tooltip.tsx
│   ├── shared/
│   │   ├── sidebar.tsx      # MIGRATO con Tooltip + Motion
│   │   ├── page-header.tsx  # NUOVO
│   │   ├── page-transition.tsx # NUOVO
│   │   └── empty-state.tsx  # NUOVO
│   ├── calendar/            # MIGRATO con shadcn + Motion
│   ├── booking/             # MIGRATO con Motion steps
│   ├── clients/             # MIGRATO con Table + Badge
│   ├── analytics/           # NUOVO con Recharts
│   └── ...
├── lib/
│   └── utils.ts             # AGGIORNATO (cn gia' compatibile)
└── hooks/                   # NUOVO se necessario
    └── use-mobile.tsx       # Hook per responsive
```

---

## Timeline Stimata

| Fase | Scope | File |
|------|-------|------|
| **1. Setup** | shadcn init + globals.css | 2 file |
| **2. Core UI** | Button, Card, Input, Dialog | 4-6 componenti |
| **3. Dashboard** | Tabs, Badge, Avatar, Table | 4-5 componenti |
| **4. Motion** | Page transition, list stagger | 2-3 wrapper |
| **5. Migration** | Sidebar, Calendar, Clients | 5-6 file esistenti |
| **6. Analytics** | Recharts charts + stats | 3-4 componenti nuovi |
| **7. Polish** | Skeleton, Toast, Empty states | 3-4 componenti |

---

## Compatibilita' Verificata

| Requisito | Status |
|-----------|--------|
| Next.js 16 + App Router | Compatibile |
| React 19 | Compatibile |
| Tailwind CSS v4 | Compatibile (oklch) |
| React Compiler | Compatibile |
| TypeScript strict | Compatibile |
| pnpm | Compatibile |
| Biome linting | Compatibile |
| `cn()` utility esistente | Compatibile (stesso pattern) |
| Lucide icons | Gia' integrato |
| Supabase SSR | Nessun conflitto |
