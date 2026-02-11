import { z } from "zod/v4";

// ─── Types ───────────────────────────────────────────────────────────

export interface BrandColors {
  primary: string;
  secondary: string;
}

// ─── Zod Schemas ─────────────────────────────────────────────────────

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const brandColorsSchema = z.object({
  primary: z.string().regex(hexColorRegex, "Colore primario non valido (formato: #RRGGBB)"),
  secondary: z.string().regex(hexColorRegex, "Colore secondario non valido (formato: #RRGGBB)"),
});

export const MAX_WELCOME_TEXT_LENGTH = 200;

export const FONT_PRESET_IDS = ["moderno", "classico", "bold", "minimal"] as const;
export type FontPresetId = (typeof FONT_PRESET_IDS)[number];

export const updateBrandSettingsSchema = z.object({
  brandColors: brandColorsSchema.optional(),
  logoUrl: z.string().url("URL logo non valido").or(z.literal("")).optional(),
  welcomeText: z
    .string()
    .max(MAX_WELCOME_TEXT_LENGTH, `Massimo ${MAX_WELCOME_TEXT_LENGTH} caratteri`)
    .optional(),
  coverImageUrl: z
    .string()
    .url("URL immagine di copertina non valido")
    .or(z.literal(""))
    .optional(),
  fontPreset: z.enum(FONT_PRESET_IDS).or(z.literal("")).optional(),
});

// ─── Font Presets ─────────────────────────────────────────────────────

export interface FontPreset {
  id: FontPresetId;
  label: string;
  heading: string;
  body: string;
  sample: string;
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: "moderno",
    label: "Moderno",
    heading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    sample: "Aa Bb Cc",
  },
  {
    id: "classico",
    label: "Classico",
    heading: "Georgia, 'Times New Roman', Times, serif",
    body: "Georgia, 'Times New Roman', Times, serif",
    sample: "Aa Bb Cc",
  },
  {
    id: "bold",
    label: "Bold",
    heading: "Impact, 'Arial Black', Haettenschweiler, sans-serif",
    body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    sample: "Aa Bb Cc",
  },
  {
    id: "minimal",
    label: "Minimal",
    heading: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    body: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    sample: "Aa Bb Cc",
  },
];

export function getFontPreset(id: string | null | undefined): FontPreset {
  return FONT_PRESETS.find((p) => p.id === id) ?? FONT_PRESETS[0];
}

export function generateFontCSSVariables(
  fontPresetId: string | null | undefined,
): Record<string, string> {
  const preset = getFontPreset(fontPresetId);
  return {
    "--font-heading": preset.heading,
    "--font-body": preset.body,
  };
}

// ─── Defaults ────────────────────────────────────────────────────────

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: "#171717",
  secondary: "#737373",
};

// ─── CSS Variable Helpers ────────────────────────────────────────────

/**
 * Convert a hex color (#RRGGBB) to an oklch() CSS string.
 * Uses a simplified sRGB→oklch conversion suitable for CSS variables.
 */
export function hexToOklch(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  // Linearize sRGB
  const lr = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
  const lg = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
  const lb = b <= 0.04045 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4;

  // sRGB → XYZ (D65)
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const zVal = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb;

  // XYZ → LMS
  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * zVal;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * zVal;
  const s = 0.0482003018 * x + 0.0264977045 * y + 0.633851707 * zVal;

  // Cube root
  const lc = Math.cbrt(l);
  const mc = Math.cbrt(m);
  const sc = Math.cbrt(s);

  // LMS → Oklab
  const L = 0.2104542553 * lc + 0.793617785 * mc - 0.0040720468 * sc;
  const A = 1.9779984951 * lc - 2.428592205 * mc + 0.4505937099 * sc;
  const B = 0.0259040371 * lc + 0.7827717662 * mc - 0.808675766 * sc;

  // Oklab → Oklch
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  // If chroma is near zero, omit hue for achromatic colors
  if (C < 0.1) {
    return `oklch(${L.toFixed(3)} 0 0)`;
  }

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)})`;
}

/**
 * Generate CSS custom property overrides from brand colors.
 * Returns a CSSProperties-compatible object for use with style={}.
 */
export function generateBrandCSSVariables(
  brandColors: BrandColors | null | undefined,
): Record<string, string> {
  if (!brandColors) return {};

  const primary = hexToOklch(brandColors.primary);
  const secondary = hexToOklch(brandColors.secondary);

  return {
    "--primary": primary,
    "--primary-foreground": "oklch(0.985 0 0)",
    "--ring": primary,
    "--accent": secondary,
  };
}
