"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/shared/barberos-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Barberos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea il tuo account barberia
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Registrati</CardTitle>
            <CardDescription>
              Inizia a gestire la tua barberia in pochi minuti
            </CardDescription>
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
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary/80"
                >
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
