import Link from "next/link";
import { LogoFull } from "@/components/shared/barberos-logo";

const links = [
  {
    title: "Prodotto",
    items: [
      { label: "Funzionalita", href: "#soluzione" },
      { label: "WhatsApp", href: "#whatsapp" },
      { label: "Prezzi", href: "#prezzi" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Azienda",
    items: [
      { label: "Accedi", href: "/login" },
      { label: "Registrati", href: "/register" },
      {
        label: "Contatti",
        href: "mailto:giovannidifonzobusiness@gmail.com",
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <LogoFull iconSize={32} />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Il sistema operativo per la tua barberia. Automazione WhatsApp, booking online, CRM e
              analytics in un'unica piattaforma.
            </p>
          </div>

          {/* Link columns */}
          {links.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.label}>
                    {item.href.startsWith("/") ? (
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              2024-{new Date().getFullYear()} BarberOS. Tutti i diritti riservati.
            </p>
            <p className="text-xs text-muted-foreground">
              P.IVA: in fase di registrazione | Made in Italy
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
