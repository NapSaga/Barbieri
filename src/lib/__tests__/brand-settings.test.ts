import { describe, expect, it } from "vitest";
import {
  brandColorsSchema,
  DEFAULT_BRAND_COLORS,
  FONT_PRESETS,
  generateBrandCSSVariables,
  generateFontCSSVariables,
  getFontPreset,
  hexToOklch,
  MAX_WELCOME_TEXT_LENGTH,
  updateBrandSettingsSchema,
} from "@/lib/brand-settings";

// ─── brandColorsSchema ──────────────────────────────────────────────

describe("brandColorsSchema", () => {
  it("accepts valid hex colors", () => {
    const result = brandColorsSchema.safeParse({ primary: "#FF5500", secondary: "#00AA33" });
    expect(result.success).toBe(true);
  });

  it("accepts lowercase hex colors", () => {
    const result = brandColorsSchema.safeParse({ primary: "#ff5500", secondary: "#00aa33" });
    expect(result.success).toBe(true);
  });

  it("rejects 3-digit hex", () => {
    const result = brandColorsSchema.safeParse({ primary: "#F50", secondary: "#0A3" });
    expect(result.success).toBe(false);
  });

  it("rejects missing hash", () => {
    const result = brandColorsSchema.safeParse({ primary: "FF5500", secondary: "00AA33" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex characters", () => {
    const result = brandColorsSchema.safeParse({ primary: "#GGHHII", secondary: "#00AA33" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = brandColorsSchema.safeParse({ primary: "#FF5500" });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = brandColorsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── updateBrandSettingsSchema ──────────────────────────────────────

describe("updateBrandSettingsSchema", () => {
  it("accepts full valid data", () => {
    const result = updateBrandSettingsSchema.safeParse({
      brandColors: { primary: "#171717", secondary: "#737373" },
      logoUrl: "https://example.com/logo.png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty logoUrl string", () => {
    const result = updateBrandSettingsSchema.safeParse({
      brandColors: { primary: "#171717", secondary: "#737373" },
      logoUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing optional fields", () => {
    const result = updateBrandSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts only brandColors", () => {
    const result = updateBrandSettingsSchema.safeParse({
      brandColors: { primary: "#FF0000", secondary: "#0000FF" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid logoUrl", () => {
    const result = updateBrandSettingsSchema.safeParse({
      logoUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid brandColors inside", () => {
    const result = updateBrandSettingsSchema.safeParse({
      brandColors: { primary: "red", secondary: "blue" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid welcomeText", () => {
    const result = updateBrandSettingsSchema.safeParse({
      welcomeText: "Benvenuto da Mario's Barber!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty welcomeText", () => {
    const result = updateBrandSettingsSchema.safeParse({
      welcomeText: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing welcomeText", () => {
    const result = updateBrandSettingsSchema.safeParse({
      brandColors: { primary: "#171717", secondary: "#737373" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects welcomeText exceeding max length", () => {
    const result = updateBrandSettingsSchema.safeParse({
      welcomeText: "a".repeat(MAX_WELCOME_TEXT_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it("accepts welcomeText at exact max length", () => {
    const result = updateBrandSettingsSchema.safeParse({
      welcomeText: "a".repeat(MAX_WELCOME_TEXT_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid coverImageUrl", () => {
    const result = updateBrandSettingsSchema.safeParse({
      coverImageUrl: "https://example.com/shop.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty coverImageUrl", () => {
    const result = updateBrandSettingsSchema.safeParse({
      coverImageUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid coverImageUrl", () => {
    const result = updateBrandSettingsSchema.safeParse({
      coverImageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid fontPreset", () => {
    const result = updateBrandSettingsSchema.safeParse({ fontPreset: "classico" });
    expect(result.success).toBe(true);
  });

  it("accepts empty fontPreset", () => {
    const result = updateBrandSettingsSchema.safeParse({ fontPreset: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid fontPreset", () => {
    const result = updateBrandSettingsSchema.safeParse({ fontPreset: "comic-sans" });
    expect(result.success).toBe(false);
  });

  it("accepts all fields together", () => {
    const result = updateBrandSettingsSchema.safeParse({
      brandColors: { primary: "#FF0000", secondary: "#0000FF" },
      logoUrl: "https://example.com/logo.png",
      welcomeText: "Prenota il tuo taglio!",
      coverImageUrl: "https://example.com/shop.jpg",
      fontPreset: "bold",
    });
    expect(result.success).toBe(true);
  });
});

// ─── getFontPreset ──────────────────────────────────────────────────

describe("getFontPreset", () => {
  it("returns moderno for null", () => {
    expect(getFontPreset(null).id).toBe("moderno");
  });

  it("returns moderno for undefined", () => {
    expect(getFontPreset(undefined).id).toBe("moderno");
  });

  it("returns moderno for unknown string", () => {
    expect(getFontPreset("unknown").id).toBe("moderno");
  });

  it("returns correct preset for each valid id", () => {
    for (const preset of FONT_PRESETS) {
      expect(getFontPreset(preset.id).id).toBe(preset.id);
    }
  });
});

// ─── generateFontCSSVariables ───────────────────────────────────────

describe("generateFontCSSVariables", () => {
  it("returns font variables for null (defaults to moderno)", () => {
    const vars = generateFontCSSVariables(null);
    expect(vars).toHaveProperty("--font-heading");
    expect(vars).toHaveProperty("--font-body");
  });

  it("returns serif fonts for classico", () => {
    const vars = generateFontCSSVariables("classico");
    expect(vars["--font-heading"]).toContain("Georgia");
  });

  it("returns monospace fonts for minimal", () => {
    const vars = generateFontCSSVariables("minimal");
    expect(vars["--font-heading"]).toContain("monospace");
  });

  it("returns different heading for bold preset", () => {
    const vars = generateFontCSSVariables("bold");
    expect(vars["--font-heading"]).toContain("Impact");
    expect(vars["--font-body"]).toContain("system-ui");
  });
});

// ─── hexToOklch ─────────────────────────────────────────────────────

describe("hexToOklch", () => {
  it("converts black to near-zero lightness", () => {
    const result = hexToOklch("#000000");
    expect(result).toBe("oklch(0.000 0 0)");
  });

  it("converts white to near-one lightness", () => {
    const result = hexToOklch("#FFFFFF");
    expect(result).toMatch(/^oklch\(1\.000 0 0\)$/);
  });

  it("returns a valid oklch string for a color", () => {
    const result = hexToOklch("#2563EB");
    expect(result).toMatch(/^oklch\(\d+\.\d+ \d+\.\d+ \d+\.\d+\)$/);
  });

  it("handles gray (achromatic) colors", () => {
    const result = hexToOklch("#808080");
    // Gray should have very low chroma
    expect(result).toMatch(/^oklch\(\d+\.\d+ /);
  });

  it("handles the default primary color", () => {
    const result = hexToOklch(DEFAULT_BRAND_COLORS.primary);
    expect(result).toMatch(/^oklch\(/);
  });
});

// ─── generateBrandCSSVariables ──────────────────────────────────────

describe("generateBrandCSSVariables", () => {
  it("returns empty object for null", () => {
    expect(generateBrandCSSVariables(null)).toEqual({});
  });

  it("returns empty object for undefined", () => {
    expect(generateBrandCSSVariables(undefined)).toEqual({});
  });

  it("returns CSS variables for valid brand colors", () => {
    const vars = generateBrandCSSVariables({ primary: "#FF0000", secondary: "#0000FF" });
    expect(vars).toHaveProperty("--primary");
    expect(vars).toHaveProperty("--primary-foreground");
    expect(vars).toHaveProperty("--ring");
    expect(vars).toHaveProperty("--accent");
  });

  it("primary and ring use the same oklch value", () => {
    const vars = generateBrandCSSVariables({ primary: "#2563EB", secondary: "#737373" });
    expect(vars["--primary"]).toBe(vars["--ring"]);
  });

  it("accent uses secondary color", () => {
    const vars = generateBrandCSSVariables({ primary: "#2563EB", secondary: "#10B981" });
    expect(vars["--accent"]).toMatch(/^oklch\(/);
    expect(vars["--accent"]).not.toBe(vars["--primary"]);
  });

  it("primary-foreground is always white", () => {
    const vars = generateBrandCSSVariables(DEFAULT_BRAND_COLORS);
    expect(vars["--primary-foreground"]).toBe("oklch(0.985 0 0)");
  });
});
