import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "BarberOS — Il Sistema Operativo per la Tua Barberia",
  description:
    "L'unico gestionale con automazione WhatsApp completa. Elimina i no-show, riempi i buchi in agenda e fai crescere il fatturato. Automaticamente.",
  openGraph: {
    title: "BarberOS — Il Sistema Operativo per la Tua Barberia",
    description:
      "L'unico gestionale con automazione WhatsApp completa. Elimina i no-show, riempi i buchi in agenda e fai crescere il fatturato.",
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isLoggedIn={!!user} />;
}
