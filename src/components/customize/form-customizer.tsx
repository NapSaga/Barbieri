"use client";

import { ExternalLink, Loader2, Palette, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateBrandSettings } from "@/actions/business";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type BrandColors,
  DEFAULT_BRAND_COLORS,
  FONT_PRESETS,
  type FontPresetId,
  generateBrandCSSVariables,
  generateFontCSSVariables,
  MAX_WELCOME_TEXT_LENGTH,
} from "@/lib/brand-settings";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_combo: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  photo_url: string | null;
  working_hours: Record<
    string,
    { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
  > | null;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  brand_colors: { primary: string; secondary: string } | null;
  logo_url: string | null;
  welcome_text: string | null;
  cover_image_url: string | null;
  font_preset: string | null;
}

interface StaffServiceLink {
  staffId: string;
  serviceId: string;
}

interface FormCustomizerProps {
  business: Business;
  services: Service[];
  staffMembers: StaffMember[];
  staffServiceLinks: StaffServiceLink[];
  closureDates: string[];
}

export function FormCustomizer({
  business,
  services,
  staffMembers,
  staffServiceLinks,
  closureDates,
}: FormCustomizerProps) {
  const [brandColors, setBrandColors] = useState<BrandColors>(
    business.brand_colors ?? DEFAULT_BRAND_COLORS,
  );
  const [logoUrl, setLogoUrl] = useState(business.logo_url ?? "");
  const [welcomeText, setWelcomeText] = useState(business.welcome_text ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(business.cover_image_url ?? "");
  const [fontPreset, setFontPreset] = useState<FontPresetId>(
    (business.font_preset as FontPresetId) || "moderno",
  );
  const [isPending, startTransition] = useTransition();

  const cssVars = {
    ...generateBrandCSSVariables(brandColors),
    ...generateFontCSSVariables(fontPreset),
  };
  const bookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/book/${business.slug}`
      : `/book/${business.slug}`;

  const hasChanges =
    brandColors.primary !== (business.brand_colors?.primary ?? DEFAULT_BRAND_COLORS.primary) ||
    brandColors.secondary !==
      (business.brand_colors?.secondary ?? DEFAULT_BRAND_COLORS.secondary) ||
    logoUrl !== (business.logo_url ?? "") ||
    welcomeText !== (business.welcome_text ?? "") ||
    coverImageUrl !== (business.cover_image_url ?? "") ||
    fontPreset !== ((business.font_preset as FontPresetId) || "moderno");

  function handleReset() {
    setBrandColors(DEFAULT_BRAND_COLORS);
    setLogoUrl("");
    setWelcomeText("");
    setCoverImageUrl("");
    setFontPreset("moderno");
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateBrandSettings({
        brandColors,
        logoUrl: logoUrl || "",
        welcomeText: welcomeText || "",
        coverImageUrl: coverImageUrl || "",
        fontPreset: fontPreset || "",
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Personalizzazione salvata!");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Left column — Controls */}
      <div className="w-full space-y-6 lg:w-80 lg:shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Personalizza il tuo form</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifica colori e logo della pagina di prenotazione
          </p>
        </div>

        {/* Primary color */}
        <div className="space-y-2">
          <Label htmlFor="color-primary">Colore primario</Label>
          <div className="flex items-center gap-3">
            <input
              id="color-primary"
              type="color"
              value={brandColors.primary}
              onChange={(e) => setBrandColors((prev) => ({ ...prev, primary: e.target.value }))}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
            />
            <Input
              type="text"
              value={brandColors.primary}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  setBrandColors((prev) => ({ ...prev, primary: v }));
                }
              }}
              className="font-mono text-sm"
              maxLength={7}
            />
          </div>
          <p className="text-xs text-muted-foreground">Bottoni, slot selezionato, progress bar</p>
        </div>

        {/* Secondary color */}
        <div className="space-y-2">
          <Label htmlFor="color-secondary">Colore secondario</Label>
          <div className="flex items-center gap-3">
            <input
              id="color-secondary"
              type="color"
              value={brandColors.secondary}
              onChange={(e) => setBrandColors((prev) => ({ ...prev, secondary: e.target.value }))}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
            />
            <Input
              type="text"
              value={brandColors.secondary}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  setBrandColors((prev) => ({ ...prev, secondary: v }));
                }
              }}
              className="font-mono text-sm"
              maxLength={7}
            />
          </div>
          <p className="text-xs text-muted-foreground">Accenti, elementi secondari</p>
        </div>

        {/* Welcome text */}
        <div className="space-y-2">
          <Label htmlFor="welcome-text">Messaggio di benvenuto</Label>
          <textarea
            id="welcome-text"
            value={welcomeText}
            onChange={(e) => setWelcomeText(e.target.value.slice(0, MAX_WELCOME_TEXT_LENGTH))}
            placeholder="Es: Benvenuto da Mario's Barber! Prenota il tuo taglio in pochi click"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {welcomeText.length}/{MAX_WELCOME_TEXT_LENGTH}
          </p>
        </div>

        {/* Font preset */}
        <div className="space-y-2">
          <Label>Stile tipografico</Label>
          <div className="grid grid-cols-2 gap-2">
            {FONT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setFontPreset(preset.id)}
                className={cn(
                  "rounded-lg border-2 px-3 py-2.5 text-left transition-colors",
                  fontPreset === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <span
                  className="block text-base font-semibold leading-tight"
                  style={{ fontFamily: preset.heading }}
                >
                  {preset.sample}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cover image URL */}
        <div className="space-y-2">
          <Label htmlFor="cover-image-url">Immagine di copertina</Label>
          <Input
            id="cover-image-url"
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://esempio.com/negozio.jpg"
            className="text-sm"
          />
          {coverImageUrl && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border">
              {/* biome-ignore lint/performance/noImgElement: external user-provided URL */}
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="h-24 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Foto del negozio, aspect ratio 16:9 consigliato
          </p>
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <Label htmlFor="logo-url">URL Logo</Label>
          <Input
            id="logo-url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://esempio.com/logo.png"
            className="text-sm"
          />
          {logoUrl && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card p-2">
              {/* biome-ignore lint/performance/noImgElement: external user-provided URL */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-10 w-10 rounded object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="truncate text-xs text-muted-foreground">{logoUrl}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isPending || !hasChanges} className="flex-1">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Palette className="h-4 w-4" />
                Salva
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={isPending}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Direct link */}
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Link prenotazione</p>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {bookingUrl}
          </a>
        </div>
      </div>

      {/* Right column — Live Preview */}
      <div className="flex-1 min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Preview live
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl border-2 border-dashed border-border bg-background overflow-hidden",
            "p-4 sm:p-6",
          )}
          style={cssVars as React.CSSProperties}
        >
          {/* Cover image */}
          {coverImageUrl && (
            <div className="-mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6">
              {/* biome-ignore lint/performance/noImgElement: external user-provided URL */}
              <img
                src={coverImageUrl}
                alt="Cover"
                className="h-36 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Preview header */}
          <div className="mb-6 text-center">
            {logoUrl && (
              // biome-ignore lint/performance/noImgElement: external user-provided URL
              <img
                src={logoUrl}
                alt={business.name}
                className="mx-auto mb-3 h-16 w-16 rounded-xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <h1
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {business.name}
            </h1>
            {business.address && (
              <p className="mt-1 text-sm text-muted-foreground">{business.address}</p>
            )}
            {welcomeText && <p className="mt-2 text-sm text-muted-foreground">{welcomeText}</p>}
          </div>

          <BookingWizard
            business={business}
            services={services}
            staffMembers={staffMembers}
            staffServiceLinks={staffServiceLinks}
            closureDates={closureDates}
            previewMode
          />
        </div>
      </div>
    </div>
  );
}
