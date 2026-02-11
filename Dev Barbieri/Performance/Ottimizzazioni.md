BARBEROS MVP — PERFORMANCE OPTIMIZATION

Ultimo aggiornamento: 11 febbraio 2026

---

STATO: COMPLETATO ✅

Tutte le ottimizzazioni applicate. Build, typecheck e 139 test passano senza errori.

---

1. BUNDLE ANALYZER

Pacchetto: @next/bundle-analyzer ^16.1.6 (devDependency).
Configurazione: next.config.ts — attivo solo con ANALYZE=true.
Comando: ANALYZE=true pnpm build genera report HTML in .next/analyze/client.html e .next/analyze/edge.html.

Wrapper config:
  import withBundleAnalyzer from "@next/bundle-analyzer";
  const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
  export default analyzer(withSerwist({...})(nextConfig));

Moduli client più pesanti (stat size, non gzipped):
  - next/dist (framework + client components): ~708 KB
  - react-dom (production): ~543 KB
  - @supabase/ssr (+ 45 moduli concatenati): ~565 KB
  - zod v4 (+ 76 moduli concatenati): ~537 KB
  - framer-motion (motion): ~463 KB
  - next/dist/client/components: ~488 KB

Nota: sono tutti moduli framework-level. Non c'è fat da tagliare senza rimuovere dipendenze core. Il code-splitting via dynamic imports è la strategia principale.

Chunk client più pesanti (gzipped, su disco):
  - 55-*.js: 282 KB
  - 69-*.js: 200 KB
  - c2351ca4-*.js: 194 KB
  - 580-*.js: 188 KB
  - framework-*.js: 185 KB
  - main-*.js: 135 KB
  - 116-*.js: 123 KB
  - polyfills-*.js: 110 KB

---

2. LAZY LOADING (DYNAMIC IMPORTS)

Tre componenti pesanti caricati con next/dynamic nelle rispettive pagine dashboard. I componenti stessi NON sono stati modificati — solo le pagine che li importano.

a) AnalyticsDashboard (~494 righe, grafici KPI)
   Pagina: src/app/(dashboard)/dashboard/analytics/page.tsx
   Import: dynamic(() => import("@/components/analytics/analytics-dashboard").then(m => m.AnalyticsDashboard))
   Loading: skeleton con 4 card + 2 blocchi grafici.

b) SettingsManager (~1338 righe, 8 sezioni impostazioni)
   Pagina: src/app/(dashboard)/dashboard/settings/page.tsx
   Import: dynamic(() => import("@/components/settings/settings-manager").then(m => m.SettingsManager))
   Loading: skeleton con titolo + 5 blocchi sezione.

c) FormCustomizer (~395 righe, color picker + preview live)
   Pagina: src/app/(dashboard)/dashboard/customize/page.tsx
   Import: dynamic(() => import("@/components/customize/form-customizer").then(m => m.FormCustomizer))
   Loading: skeleton con sidebar + area preview.

Pattern: ogni dynamic import usa Skeleton di shadcn/ui come loading fallback, coerente con il design system.

---

3. OTTIMIZZAZIONE IMMAGINI

Sostituzione di tutti i tag <img> con next/image (Image) per:
  - Lazy loading automatico (fuori viewport)
  - Ottimizzazione formato (WebP/AVIF)
  - Responsive srcset generato automaticamente
  - Caching CDN Vercel

File modificati:

a) src/app/book/[slug]/page.tsx (pagina booking pubblica)
   - Cover image: <Image fill priority sizes="100vw" /> dentro div relative h-48
   - Logo: <Image width={64} height={64} /> con rounded-xl object-contain
   - priority su cover perché è above-the-fold

b) src/components/customize/form-customizer.tsx (editor branding)
   - Cover preview (sidebar): <Image fill sizes="320px" /> dentro div relative h-24
   - Logo preview (sidebar): <Image width={40} height={40} />
   - Cover preview (live): <Image fill sizes="(max-width: 1024px) 100vw, 50vw" />
   - Logo preview (live): <Image width={64} height={64} />
   - Tutti mantengono onError handler per nascondere immagini rotte (URL inseriti dall'utente)

Configurazione next.config.ts:
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] }
  → Permette qualsiasi dominio HTTPS (i barbieri possono usare qualsiasi URL per logo/cover).

CSP img-src: "img-src 'self' data: blob: https://*.supabase.co https:" — già include https: per coprire qualsiasi dominio esterno.

---

4. CONFIGURAZIONE NEXT.CONFIG.TS (STATO ATTUALE)

File: next.config.ts (58 righe)

Wrapper chain: analyzer → withSerwist → nextConfig
  - analyzer: @next/bundle-analyzer, attivo solo con ANALYZE=true
  - withSerwist: service worker per PWA (sw.ts → public/sw.js, disabilitato in dev)
  - nextConfig: reactCompiler, images.remotePatterns, security headers

---

5. VERIFICA FINALE

pnpm typecheck: ✅ (tsc --noEmit, zero errori)
pnpm test: ✅ (139 test in 7 file, 623ms)
pnpm build: ✅ (next build --webpack, 18 route, ~8.5s)

Nessuna modifica a:
  - Schema database
  - Logica di business
  - Componenti interni (solo le pagine che li importano)
  - Test esistenti
