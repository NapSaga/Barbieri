# Barbeiros Design System

## Panoramica

Design system completo per **Barbeiros MVP** - piattaforma SaaS per la gestione di barberie.
Costruito su Next.js 16, React 19, Tailwind CSS v4, con approccio utility-first.

---

## Stack Design Raccomandato

| Layer | Libreria | Versione | Ruolo |
|-------|----------|----------|-------|
| **Primitivi UI** | Radix UI | latest | Componenti headless accessibili (Dialog, Dropdown, Tooltip, Popover) |
| **Componenti** | shadcn/ui | latest (Tailwind v4) | Componenti pre-stilizzati, copy-paste, personalizzabili |
| **Animazioni** | Motion (Framer Motion) | latest | Micro-interazioni, transizioni pagina, layout animations |
| **Charts** | Recharts | v3.3+ | Grafici analytics dashboard (Line, Bar, Area, Composed) |
| **Icone** | Lucide React | v0.563+ | gia' in uso, 1500+ icone coerenti |
| **Utility** | clsx + tailwind-merge | attuali | gia' in uso via `cn()` |

---

## Principi di Design

### 1. Professionale ma Accogliente
- Un barbiere deve sentirsi a casa nell'interfaccia
- Niente complessita' inutile, tutto deve essere raggiungibile in max 2 click
- Linguaggio visivo caldo ma professionale

### 2. Mobile-First
- Il 70%+ degli utenti barbieri usa il telefono
- Ogni componente deve funzionare perfettamente su 375px+
- Touch targets minimi 44x44px

### 3. Performance-First
- React Compiler gia' abilitato
- Lazy loading per componenti pesanti (charts, dialogs)
- Animazioni a 60fps con `will-change` e GPU acceleration

### 4. Accessibilita' (WCAG 2.1 AA)
- Radix UI garantisce keyboard navigation e screen reader support
- Contrasto colori minimo 4.5:1
- Focus rings visibili su tutti gli elementi interattivi

---

## Architettura Componenti

```
src/components/
├── ui/                    # shadcn/ui components (Radix-based)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   └── tooltip.tsx
├── shared/                # Componenti condivisi (layout)
│   ├── sidebar.tsx        # gia' esistente
│   ├── page-header.tsx
│   └── empty-state.tsx
├── calendar/              # Feature: calendario
├── booking/               # Feature: prenotazioni
├── clients/               # Feature: CRM
├── services/              # Feature: servizi
├── staff/                 # Feature: staff
├── analytics/             # Feature: grafici
│   ├── revenue-chart.tsx
│   ├── appointments-chart.tsx
│   └── stats-card.tsx
└── settings/              # Feature: impostazioni
```

---

## Spacing Scale

Basato su Tailwind CSS v4 defaults (4px base):

| Token | Valore | Uso |
|-------|--------|-----|
| `space-1` | 4px | Padding icone, micro-gap |
| `space-2` | 8px | Gap tra elementi inline |
| `space-3` | 12px | Padding input interni |
| `space-4` | 16px | Gap standard tra elementi |
| `space-6` | 24px | Padding card, sezioni |
| `space-8` | 32px | Margine tra sezioni |
| `space-12` | 48px | Spacing pagine principali |
| `space-16` | 64px | Header/hero spacing |

---

## Border Radius

| Token | Valore | Uso |
|-------|--------|-----|
| `rounded-md` | 6px | Input, piccoli elementi |
| `rounded-lg` | 8px | Card, bottoni principali |
| `rounded-xl` | 12px | Card grandi, dialog |
| `rounded-2xl` | 16px | Elementi hero, immagini profilo |
| `rounded-full` | 9999px | Avatar, badge, chip |

---

## Shadows

| Token | Uso |
|-------|-----|
| `shadow-sm` | Card in stato default |
| `shadow-md` | Card in hover, dropdown |
| `shadow-lg` | Dialog, sheet, popover |
| `shadow-xl` | Modal overlay |

---

## Breakpoints

| Nome | Valore | Dispositivo |
|------|--------|-------------|
| `sm` | 640px | Telefono landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / Desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop large |

**Dashboard layout:**
- Mobile (`< md`): Sidebar nascosta, navigazione bottom/hamburger
- Tablet (`md-lg`): Sidebar collassata (solo icone)
- Desktop (`lg+`): Sidebar espansa completa

---

## Riferimenti

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Motion (Framer Motion)](https://motion.dev)
- [Recharts](https://recharts.org)
- [Lucide Icons](https://lucide.dev)
