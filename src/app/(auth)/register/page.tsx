"use client";

import { Gift } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { validateReferralCode } from "@/actions/referral";
import { LogoIcon } from "@/components/shared/barberos-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralInfo, setReferralInfo] = useState<{
    code: string;
    businessName: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      validateReferralCode(refCode).then((result) => {
        if (result.valid && result.businessName) {
          setReferralInfo({ code: refCode, businessName: result.businessName });
        }
      });
    }
  }, [searchParams]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
          ...(referralInfo ? { referral_code: referralInfo.code } : {}),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <LogoIcon size={48} />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Barberos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Crea il tuo account barberia</p>
          </div>
        </div>

        {referralInfo && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <Gift className="h-4 w-4 text-emerald-600" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Invitato da <span className="font-semibold">{referralInfo.businessName}</span> — 20%
              di sconto sul primo mese!
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Registrati</CardTitle>
            <CardDescription>Inizia a gestire la tua barberia in pochi minuti</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="businessName">Nome Barberia</Label>
                <Input
                  id="businessName"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="La Barberia di Mario"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@esempio.it"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Registrazione in corso..." : "Crea Account"}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Hai già un account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
                  Accedi
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
