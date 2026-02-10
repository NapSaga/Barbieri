# Palette Colori - Barbeiros

## Filosofia Cromatica

Palette calda e professionale che evoca: **fiducia, cura, eleganza maschile**.
Basata su CSS variables con formato `oklch` (standard shadcn/ui + Tailwind v4).

---

## Palette Primaria

### Brand Colors

| Nome | Hex | oklch | Uso |
|------|-----|-------|-----|
| **Blue 600** | `#2563EB` | `oklch(0.546 0.245 262.881)` | CTA primarie, link, elementi attivi |
| **Blue 700** | `#1D4ED8` | `oklch(0.488 0.243 264.376)` | Hover su primario |
| **Blue 950** | `#172554` | `oklch(0.256 0.078 265.733)` | Testo heading, sidebar attivo |

### Semantic Colors

| Nome | Tailwind Class | Uso in Barbeiros |
|------|----------------|------------------|
| **Success / Emerald** | `emerald-500/600` | Appuntamento confermato, azione completata |
| **Warning / Amber** | `amber-500/600` | Rischio no-show, attenzione richiesta |
| **Error / Red** | `red-500/600` | Cancellato, errore, eliminazione |
| **Info / Blue** | `blue-500/600` | Nuovo cliente, informazione |
| **Neutral / Gray** | `gray-400/500` | Completato, inattivo, placeholder |

### Status Appuntamenti (gia' in uso)

| Status | Colore | Border | Background |
|--------|--------|--------|------------|
| `booked` | Blue | `border-l-blue-500` | `bg-blue-50` |
| `confirmed` | Emerald | `border-l-emerald-500` | `bg-emerald-50` |
| `completed` | Gray | `border-l-gray-400` | `bg-gray-50` |
| `cancelled` | Red | `border-l-red-500` | `bg-red-50` |
| `no_show` | Amber | `border-l-amber-500` | `bg-amber-50` |

### Tag Clienti (gia' in uso)

| Tag | Background | Text |
|-----|------------|------|
| VIP | `bg-yellow-100` | `text-yellow-800` |
| Nuovo | `bg-blue-100` | `text-blue-800` |
| Problematico | `bg-red-100` | `text-red-800` |
| Alto rischio no-show | `bg-orange-100` | `text-orange-800` |

---

## CSS Variables (shadcn/ui + Tailwind v4)

### Implementazione in `globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* Base */
  --background: oklch(1 0 0);                    /* #FFFFFF */
  --foreground: oklch(0.145 0 0);                /* #171717 */

  /* Card */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);

  /* Popover */
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  /* Primary - Blue Barbeiros */
  --primary: oklch(0.546 0.245 262.881);         /* Blue 600 */
  --primary-foreground: oklch(0.985 0 0);        /* White */

  /* Secondary */
  --secondary: oklch(0.97 0 0);                  /* Gray 50 */
  --secondary-foreground: oklch(0.205 0 0);      /* Gray 900 */

  /* Muted */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);

  /* Accent */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);

  /* Destructive */
  --destructive: oklch(0.577 0.245 27.325);      /* Red 500 */
  --destructive-foreground: oklch(0.577 0.245 27.325);

  /* Border & Input */
  --border: oklch(0.922 0 0);                    /* Gray 200 */
  --input: oklch(0.922 0 0);
  --ring: oklch(0.546 0.245 262.881);            /* Blue 600 (focus) */

  /* Charts - Barbeiros Analytics */
  --chart-1: oklch(0.546 0.245 262.881);         /* Blue - Revenue */
  --chart-2: oklch(0.600 0.178 163.211);         /* Emerald - Confermati */
  --chart-3: oklch(0.769 0.188 70.08);           /* Amber - No-show */
  --chart-4: oklch(0.577 0.245 27.325);          /* Red - Cancellati */
  --chart-5: oklch(0.556 0 0);                   /* Gray - Completati */

  /* Radius */
  --radius: 0.5rem;

  /* Sidebar */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.546 0.245 262.881);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.956 0.014 262.881);  /* Blue tint */
  --sidebar-accent-foreground: oklch(0.256 0.078 265.733);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.546 0.245 262.881);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.178 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.178 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.623 0.214 262.881);         /* Blue 500 lighter */
  --primary-foreground: oklch(0.145 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.623 0.214 262.881);
  --chart-1: oklch(0.623 0.214 262.881);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.637 0.237 25.331);
  --chart-5: oklch(0.708 0 0);
  --sidebar: oklch(0.178 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.623 0.214 262.881);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.623 0.214 262.881);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Palette Estesa - Contesti Specifici

### Prenotazione Online (booking page pubblica)

| Elemento | Light | Dark |
|----------|-------|------|
| Header barberia | `bg-blue-950 text-white` | `bg-blue-950 text-white` |
| Slot disponibile | `bg-white border-gray-200` | `bg-gray-800 border-gray-700` |
| Slot selezionato | `bg-blue-50 border-blue-500` | `bg-blue-950 border-blue-400` |
| Slot non disponibile | `bg-gray-100 text-gray-400` | `bg-gray-900 text-gray-600` |
| CTA Conferma | `bg-blue-600 text-white` | `bg-blue-500 text-white` |

### Dashboard Sidebar

| Stato | Stile |
|-------|-------|
| Default | `text-gray-600 hover:bg-gray-100` |
| Attivo | `bg-blue-50 text-blue-700 font-medium` |
| Hover | `bg-gray-100 text-gray-900` |
