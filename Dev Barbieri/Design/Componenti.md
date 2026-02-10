# Componenti UI - Specifiche per Barbeiros

## Componenti shadcn/ui Prioritari

Lista dei componenti da installare, ordinati per priorita' di implementazione.

---

## Fase 1 - Core (Immediato)

### Button
Gia' usato ovunque nel progetto. Standardizzare con shadcn/ui.

```tsx
import { Button } from "@/components/ui/button"

// Varianti necessarie per Barbeiros
<Button variant="default">Salva</Button>           // Blue primary
<Button variant="secondary">Annulla</Button>        // Gray
<Button variant="destructive">Elimina</Button>      // Red
<Button variant="outline">Modifica</Button>         // Border only
<Button variant="ghost">Chiudi</Button>             // No background
<Button size="sm">Azione rapida</Button>            // Compact
<Button size="lg">Prenota Ora</Button>              // CTA grande
<Button disabled>Caricamento...</Button>            // Loading state
```

### Card
Per ogni sezione del dashboard.

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Appuntamenti Oggi</CardTitle>
    <CardDescription>12 prenotazioni, 3 walk-in</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenuto */}
  </CardContent>
</Card>
```

### Dialog
Per conferme, creazione rapida, dettagli.

```tsx
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"

// Uso: Walk-in dialog, Conferma eliminazione, Dettagli appuntamento
```

### Input + Label
Standardizzare tutti i form input.

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="grid gap-2">
  <Label htmlFor="name">Nome cliente</Label>
  <Input id="name" placeholder="Mario Rossi" />
</div>
```

### Select
Per selezione barbiere, servizio, stato.

### Sheet
Per il pannello dettagli appuntamento (gia' concettualmente in uso).

### Table
Per lista clienti, servizi, staff.

### Toast
Per feedback azioni (salvato, eliminato, errore).

---

## Fase 2 - Dashboard Enhanced

### Tabs
Per vista Giorno/Settimana nel calendario.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="day">
  <TabsList>
    <TabsTrigger value="day">Giorno</TabsTrigger>
    <TabsTrigger value="week">Settimana</TabsTrigger>
  </TabsList>
  <TabsContent value="day"><DayView /></TabsContent>
  <TabsContent value="week"><WeekView /></TabsContent>
</Tabs>
```

### Badge
Per tag clienti e status appuntamenti.

```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">Confermato</Badge>
<Badge variant="secondary">Completato</Badge>
<Badge variant="destructive">Cancellato</Badge>
<Badge variant="outline">Prenotato</Badge>

// Custom per tag clienti
<Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>
```

### Avatar
Per foto barbiere e cliente.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src={staff.photo_url} alt={staff.name} />
  <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
</Avatar>
```

### Skeleton
Per loading states professionali.

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton appointment card
<div className="flex gap-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
</div>
```

### Tooltip
Per azioni iconiche nella toolbar.

### Dropdown Menu
Per azioni contestuali (modifica, cancella, sposta).

### Popover
Per date picker e filtri rapidi.

---

## Fase 3 - Analytics

### Charts (Recharts)

#### Stats Card Component

```tsx
"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
}

function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {change >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
          {" "}{Math.abs(change)}% rispetto a ieri
        </p>
      </CardContent>
    </Card>
  )
}
```

#### Revenue Chart

```tsx
"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

---

## Componenti Custom Barbeiros

Componenti specifici del dominio che non esistono in shadcn/ui.

### AppointmentCard (evoluzione)

Mantenere il componente esistente ma integrare:
- `Badge` shadcn per status
- `Avatar` per foto barbiere
- `motion.div` per animazioni enter/exit

### TimeSlotPicker

```tsx
// Griglia orari per booking wizard
// Basato su Button shadcn/ui con varianti custom
<div className="grid grid-cols-4 gap-2">
  {slots.map((slot) => (
    <Button
      key={slot.time}
      variant={selected === slot.time ? "default" : "outline"}
      size="sm"
      disabled={!slot.available}
      onClick={() => onSelect(slot.time)}
    >
      {slot.time}
    </Button>
  ))}
</div>
```

### EmptyState

```tsx
// Stato vuoto riutilizzabile
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```
