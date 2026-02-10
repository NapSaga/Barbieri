# Strategia Animazioni - Barbeiros

## Libreria: Motion (ex Framer Motion)

**Benchmark Score: 89.1/100** - La migliore libreria di animazioni per React.

### Installazione

```bash d
pnpm add motion
```

### Import (Next.js App Router)

```tsx
"use client"
import { motion, AnimatePresence } from "motion/react"
```

> **Nota:** Con Next.js App Router, ogni componente che usa Motion deve avere `"use client"`.
> Per ridurre il JS client, si puo' usare `import * as motion from "motion/react-client"`.

---

## Pattern di Animazione per Barbeiros

### 1. Page Transitions (Dashboard)

```tsx
// src/components/shared/page-transition.tsx
"use client"
import { motion } from "motion/react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

// Uso nel layout dashboard
<PageTransition key={pathname}>
  {children}
</PageTransition>
```

### 2. List Stagger (Clienti, Appuntamenti)

```tsx
// Animazione sequenziale per liste
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {clients.map((client) => (
    <motion.li key={client.id} variants={item}>
      <ClientRow client={client} />
    </motion.li>
  ))}
</motion.ul>
```

### 3. Appointment Card Enter/Exit

```tsx
// Animazione per aggiunta/rimozione appuntamenti
<AnimatePresence mode="popLayout">
  {appointments.map((apt) => (
    <motion.div
      key={apt.id}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <AppointmentCard appointment={apt} />
    </motion.div>
  ))}
</AnimatePresence>
```

### 4. Tab Indicator (Active Tab Underline)

```tsx
// Shared element animation per tab attivo
<TabsList>
  {tabs.map((tab) => (
    <TabsTrigger key={tab.id} value={tab.id} className="relative">
      {tab.label}
      {activeTab === tab.id && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </TabsTrigger>
  ))}
</TabsList>
```

### 5. Sidebar Expand/Collapse

```tsx
// Animazione sidebar responsive
<motion.aside
  layout
  animate={{ width: isCollapsed ? 64 : 256 }}
  transition={{ duration: 0.2, ease: "easeInOut" }}
  className="border-r bg-sidebar"
>
  <AnimatePresence mode="wait">
    {!isCollapsed && (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
      >
        {label}
      </motion.span>
    )}
  </AnimatePresence>
</motion.aside>
```

### 6. Dialog/Sheet Transitions

```tsx
// Motion gia' gestito da Radix + shadcn/ui via tw-animate-css
// Ma per transizioni custom:
<DialogContent asChild>
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 10 }}
    transition={{ duration: 0.2 }}
  >
    {/* contenuto dialog */}
  </motion.div>
</DialogContent>
```

### 7. Stats Counter (Analytics)

```tsx
// Animazione numerica per stats card
"use client"
import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { useEffect } from "react"

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8 })
    return controls.stop
  }, [count, value])

  return <motion.span>{rounded}</motion.span>
}

// Uso
<AnimatedCounter value={todayAppointments} />
```

### 8. Booking Wizard Steps

```tsx
// Transizione tra step del wizard
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {renderStep(currentStep)}
  </motion.div>
</AnimatePresence>
```

---

## Regole di Animazione

### DO (Fare)

- **Durate brevi**: 150-300ms per micro-interazioni
- **Ease naturali**: `easeOut` per entrate, `easeIn` per uscite
- **Spring per layout**: `type: "spring"` per transizioni layout
- **Stagger leggero**: 30-50ms tra elementi in lista
- `layout` prop per cambiamenti di posizione/dimensione
- `AnimatePresence` per mount/unmount
- `will-change` solo quando necessario

### DON'T (Non fare)

- Animazioni > 500ms (troppo lente per SaaS)
- Bounce eccessivo (`bounce: 0` o stiffness alta)
- Animare tutto: solo elementi che comunicano stato
- Transform + opacity insieme su mobile (performance)
- Animazioni bloccanti (l'utente deve poter interagire)

### Performance

```tsx
// Preferire transform e opacity (GPU accelerated)
animate={{ opacity: 1, x: 0, scale: 1 }}

// Evitare animazioni su proprietà layout-triggering
// NO: animate={{ width: 200, height: 100 }}
// SI: usare layout prop oppure transform: scale()

// Lazy loading per componenti con animazioni pesanti
const AnalyticsCharts = dynamic(() => import("./analytics-charts"), {
  loading: () => <Skeleton className="h-[300px]" />
})
```

---

## Accessibilita'

```tsx
// Rispettare prefers-reduced-motion
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

<motion.div
  animate={{ opacity: 1, y: prefersReduced ? 0 : animatedY }}
  transition={{ duration: prefersReduced ? 0 : 0.2 }}
/>

// Motion supporta automaticamente:
// - `layout` rispetta reduced-motion
// - `transition` puo' essere condizionato
```
