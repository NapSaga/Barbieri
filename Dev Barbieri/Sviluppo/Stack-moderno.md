STACK TECNOLOGICO (aggiornato 11 febbraio 2026)

Runtime: Node.js 22 LTS.

Frontend: Next.js 16.1.6 con App Router, React 19.2.3 con React Compiler e Server Components/Actions. Tailwind CSS v4 + tw-animate-css. shadcn/ui (17 componenti Radix-based) + Lucide React per icone. Dark mode con next-themes ^0.4.6 (ThemeProvider, defaultTheme="dark"). Motion ^12.34.0 (Framer Motion) per animazioni. Sonner ^2.0.7 per toast notifications. Turbopack come bundler di sviluppo. TypeScript 5.x in strict mode. Biome 2.3.14 per linting e formatting (sostituto moderno di ESLint + Prettier).

Backend: Supabase (PostgreSQL 17.6, Auth, Row Level Security, Edge Functions Deno per logica serverless). Server Actions di Next.js 16 per mutazioni dirette dal client. Supabase JS client per query runtime con RLS automatico.

ORM e database: Drizzle ORM 0.45.x per query type-safe, migrazioni e schema-as-code. Supabase come provider PostgreSQL managed. Migrazioni versionate con drizzle-kit push e generate. Nessun Prisma: Drizzle è più leggero, più veloce, zero overhead a runtime.

Notifiche WhatsApp: Twilio (^5.12.1) tramite WhatsApp Business API. Webhook /api/whatsapp/webhook per risposte in ingresso (CONFERMA, CANCELLA, CAMBIA ORARIO, SI). Comandi gestiti con risposta automatica. Dual-mode: Twilio live o mock console.log. pg_cron + pg_net nativi per scheduling (6 cron jobs: conferma intelligente, review, riattivazione).

Autenticazione: Supabase Auth con email + password e magic link. JWT con refresh token automatico. RLS policies su ogni tabella per isolamento dati completo tra barberie. proxy.ts (Next.js 16) per protezione route lato server + subscription gating.

Pagamenti abbonamento barbiere: Stripe Billing (stripe@20.3.1, API 2026-01-28.clover). 3 piani: Essential €300/mese (prod_TwyoUI0JLvWcj3), Professional €500/mese (prod_TwypWo5jLd3doz), Enterprise custom (prod_TwyphvT1F82GrB). Trial 7gg. Stripe Checkout con selezione piano e codici promozionali/coupon (allow_promotion_codes). Stripe Webhook /api/stripe/webhook per sync stato su DB (da configurare con dominio). Stripe Customer Portal per self-service. Setup €1.000 una tantum fatturato separatamente. Nessun pagamento del cliente finale nell'MVP.

Cron e job scheduling: pg_cron v1.6.4 nativo di Supabase per job ricorrenti (conferma intelligente, review, riattivazione, analytics). pg_net v0.19.5 per chiamate HTTP async alle Edge Functions. 7 cron schedules attivi.

PWA (Progressive Web App): @serwist/next 9.5.5 + serwist 9.5.5 (devDep) per service worker con precache e runtime caching (defaultCache). next.config.ts wrappato con withSerwist({ swSrc: "src/sw.ts", swDest: "public/sw.js", disable in dev }). Build usa webpack (next build --webpack) perché Serwist non supporta Turbopack; dev resta Turbopack con Serwist disabilitato. Web App Manifest in public/manifest.json: name "BarberOS", start_url "/dashboard", display "standalone", theme_color "#09090b", lang "it". Icone PWA 192x192 e 512x512 in public/. layout.tsx: metadata.manifest, appleWebApp (capable, statusBarStyle, title), viewport.themeColor via Next.js Metadata/Viewport exports. tsconfig.json: lib "webworker", types "@serwist/next/typings", exclude "public/sw.js". Installabile su mobile (Android + iOS) come app standalone con icona home screen.

Performance optimization: @next/bundle-analyzer ^16.1.6 (devDependency, attivo con ANALYZE=true). Lazy loading con next/dynamic per 3 componenti pesanti (AnalyticsDashboard, SettingsManager, FormCustomizer) con skeleton loading. next/image per tutte le immagini esterne (logo, cover) con ottimizzazione automatica WebP/AVIF, lazy loading e CDN caching. images.remotePatterns configurato per qualsiasi dominio HTTPS. CSP img-src include https: per domini esterni. Dettagli in Dev Barbieri/Performance/Ottimizzazioni.md.

Monitoring e observability: @vercel/analytics ^1.6.1 e @vercel/speed-insights ^1.3.1 integrati in layout.tsx (page views, visitors, Core Web Vitals automatici su piano Hobby). Sentry per error tracking (previsto). Supabase Dashboard per query performance e database health.

AI (fase 2 post-MVP): Anthropic Claude API per suggerimenti automatici, previsione no-show, generazione testi marketing.

Hosting: Vercel per frontend, Server Actions e API routes (collegato, deploy attivo). Supabase Cloud per database, auth, edge functions, pg_cron (già attivo). Dominio custom con Cloudflare per DNS e CDN (da configurare).

CI/CD (attivo): GitHub Actions (.github/workflows/ci.yml) per typecheck → lint → test → build su ogni push/PR a main. pnpm 10 + Node.js 22 + caching dipendenze + concurrency cancel-in-progress. Vercel Preview Deployments. Lint con Biome 2.3.14 (0 errori, 0 warning). 139 unit test Vitest in 7 file (pnpm test). Type check con tsc --noEmit.

Subscription gating: proxy.ts verifica subscription_status su ogni richiesta dashboard. Se non active/trialing/past_due → redirect a /dashboard/expired. Settings e expired page esenti (per permettere riattivazione). ExpiredView component per UI abbonamento scaduto.

Package manager: pnpm 10.29.2 (più veloce di npm, gestione dipendenze strict, disk-efficient).

Validazione input: Zod 4.3.6 (import da "zod/v4") per validazione runtime su tutte le Server Actions. Schema safeParse() prima di qualsiasi query DB, errori restituiti come { error: "messaggio italiano" } senza eccezioni. Tipi validati: UUID, date, orari, enum, stringhe, numeri, record, array.

Rate limiting: src/lib/rate-limit.ts con sliding window in-memory per protezione webhook API routes. checkRateLimit(ip, maxRequests, windowMs) + getClientIp(headers).

Security hardening: next.config.ts applica security headers su tutte le route: Content-Security-Policy (self + Supabase + Stripe.js + Vercel Analytics, frame-ancestors 'none', object-src 'none'), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/microphone/geolocation disabilitati), Strict-Transport-Security (HSTS 1 anno). Webhook API routes (/api/stripe/webhook, /api/whatsapp/webhook) protette con verifica firma crittografica e rate limiting, nessun CORS aperto. RLS policies ottimizzate: auth.uid() wrappato in (select auth.uid()) per evitare re-evaluation per riga, policy duplicate consolidate. Supabase Auth: Leaked Password Protection abilitata (HaveIBeenPwned), password minima 8 caratteri.

Dipendenze principali: next 16.1.6, react 19.2.3, @supabase/ssr ^0.8.0, drizzle-orm ^0.45.1, stripe 20.3.1, twilio ^5.12.1, @serwist/next 9.5.5, lucide-react ^0.563.0, tailwindcss ^4, radix-ui ^1.4.3, next-themes ^0.4.6, motion ^12.34.0, sonner ^2.0.7, tw-animate-css ^1.4.0, date-fns ^4.1.0, zod ^4.3.6, @vercel/analytics ^1.6.1, @vercel/speed-insights ^1.3.1. Dev: serwist 9.5.5, @next/bundle-analyzer ^16.1.6.