import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/lib/whatsapp";

describe("renderTemplate", () => {
  it("replaces a single variable", () => {
    expect(renderTemplate("Ciao {{name}}!", { name: "Mario" })).toBe("Ciao Mario!");
  });

  it("replaces multiple variables", () => {
    const result = renderTemplate("{{greeting}} {{name}}, il tuo appuntamento è il {{date}}.", {
      greeting: "Ciao",
      name: "Luigi",
      date: "2025-01-15",
    });
    expect(result).toBe("Ciao Luigi, il tuo appuntamento è il 2025-01-15.");
  });

  it("leaves unmatched placeholders intact", () => {
    expect(renderTemplate("Ciao {{name}}, {{unknown}} testo", { name: "Mario" })).toBe(
      "Ciao Mario, {{unknown}} testo",
    );
  });

  it("returns empty string for empty template", () => {
    expect(renderTemplate("", { name: "Mario" })).toBe("");
  });

  it("handles template with no variables", () => {
    expect(renderTemplate("Nessuna variabile qui", { name: "Mario" })).toBe(
      "Nessuna variabile qui",
    );
  });

  it("handles empty variables object", () => {
    expect(renderTemplate("Ciao {{name}}!", {})).toBe("Ciao {{name}}!");
  });

  it("prevents injection via variable values containing {{...}}", () => {
    const result = renderTemplate("Ciao {{name}}!", { name: "{{evil}}" });
    // Single-pass replacement: the injected {{evil}} is NOT expanded
    expect(result).toBe("Ciao {{evil}}!");
  });

  it("replaces same variable multiple times", () => {
    expect(renderTemplate("{{x}} e {{x}}", { x: "A" })).toBe("A e A");
  });
});
