import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barberos — Gestione Appuntamenti per Barbieri",
  description:
    "La piattaforma completa per gestire prenotazioni, clienti e comunicazioni della tua barberia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
