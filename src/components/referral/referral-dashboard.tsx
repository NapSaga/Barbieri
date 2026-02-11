"use client";

import { ArrowRight, Check, Copy, Gift, MessageCircle, Share2, Users } from "lucide-react";
import { useState } from "react";
import type { ReferralEntry, ReferralInfo } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/time-utils";

// ─── Status helpers ─────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
          In attesa
        </Badge>
      );
    case "converted":
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600">
          Convertito
        </Badge>
      );
    case "rewarded":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
        >
          Premiato
        </Badge>
      );
    case "expired":
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/30 bg-muted text-muted-foreground"
        >
          Scaduto
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function statusDescription(status: string) {
  switch (status) {
    case "pending":
      return "Registrato, in attesa di abbonamento";
    case "converted":
      return "Abbonamento attivato";
    case "rewarded":
      return "Credito applicato alla tua fattura";
    case "expired":
      return "Non si è abbonato entro 90 giorni";
    default:
      return "";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ──────────────────────────────────────────────────────

export function ReferralDashboard({
  info,
  referrals,
}: {
  info: ReferralInfo;
  referrals: ReferralEntry[];
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copyToClipboard(text: string, type: "code" | "link") {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function shareWhatsApp() {
    const message = encodeURIComponent(
      `Ciao! Uso BarberOS per gestire la mia barberia ed è fantastico. Registrati con il mio link e ricevi il 20% di sconto sul primo mese:\n${info.referralLink}`,
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral</h1>
        <p className="text-sm text-muted-foreground">
          Invita altri barbieri e guadagna crediti sulla tua fattura
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invitati totali</CardDescription>
            <CardTitle className="text-3xl">{info.totalReferrals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Convertiti</CardDescription>
            <CardTitle className="text-3xl">{info.convertedReferrals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Crediti guadagnati</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {formatPrice(info.totalCreditsEarned)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Referral Code + Share */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Il tuo codice referral
          </CardTitle>
          <CardDescription>Condividi il tuo link o codice con altri barbieri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-lg font-bold tracking-wider">
              {info.referralCode}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(info.referralCode, "code")}
            >
              {copied === "code" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Link */}
          <div className="flex items-center gap-3">
            <div className="flex-1 truncate rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {info.referralLink}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(info.referralLink, "link")}
            >
              {copied === "link" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => copyToClipboard(info.referralLink, "link")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copia link
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={shareWhatsApp}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Condividi su WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Come funziona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                1
              </div>
              <p className="text-sm font-medium">Condividi il link</p>
              <p className="text-xs text-muted-foreground">
                Invia il tuo link referral a un collega barbiere via WhatsApp o copia il link
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                2
              </div>
              <p className="text-sm font-medium">Si registra con il link</p>
              <p className="text-xs text-muted-foreground">
                Apre il link, si registra e il codice referral viene associato automaticamente
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                3
              </div>
              <p className="text-sm font-medium">Si abbona a un piano</p>
              <p className="text-xs text-muted-foreground">
                Dopo i 7 giorni di prova, sceglie un piano e lo sconto del 20% si applica in automatico
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-lg font-bold text-emerald-600">
                4
              </div>
              <p className="text-sm font-medium">Entrambi guadagnate</p>
              <p className="text-xs text-muted-foreground">
                Lui paga il 20% in meno sul primo mese, tu ricevi €50 di credito in fattura
              </p>
            </div>
          </div>

          {/* Explicit reward breakdown */}
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <ArrowRight className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Per te (chi invita)</p>
                <p className="text-xs text-muted-foreground">
                  €50 di credito scalato automaticamente dalla tua prossima fattura Stripe, per ogni barbiere invitato che attiva un abbonamento
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <ArrowRight className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Per chi viene invitato</p>
                <p className="text-xs text-muted-foreground">
                  20% di sconto applicato automaticamente al checkout sul primo mese dopo il trial gratuito di 7 giorni. Non serve inserire nessun codice.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />I tuoi referral
          </CardTitle>
          {info.pendingCredits > 0 && (
            <CardDescription>Crediti in attesa: {formatPrice(info.pendingCredits)}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-muted-foreground">Non hai ancora invitato nessuno</p>
                <p className="text-sm text-muted-foreground/70">
                  Condividi il tuo link per iniziare a guadagnare!
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barberia</TableHead>
                  <TableHead>Registrazione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Aggiornamento</TableHead>
                  <TableHead className="text-right">Credito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.referredBusinessName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {statusBadge(r.status)}
                        <span className="text-[11px] text-muted-foreground/70">
                          {statusDescription(r.status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.rewardedAt
                        ? formatDate(r.rewardedAt)
                        : r.convertedAt
                          ? formatDate(r.convertedAt)
                          : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "rewarded" ? (
                        <span className="font-medium text-emerald-600">
                          {formatPrice(r.rewardAmountCents)}
                        </span>
                      ) : r.status === "expired" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {formatPrice(r.rewardAmountCents)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Fine print */}
      <p className="text-center text-xs text-muted-foreground">
        Il credito di €50 viene applicato automaticamente alla tua prossima fattura Stripe quando il
        barbiere invitato attiva un abbonamento a pagamento. Il trial resta di 7 giorni.
      </p>
    </div>
  );
}
