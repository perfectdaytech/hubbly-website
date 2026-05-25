# Hubbly — marketing & legal website

The public website for **Hubbly**, a happy little home for your family's day.
Built as a fast, static, accessible site with [Astro](https://astro.build) +
[Tailwind CSS v4](https://tailwindcss.com). Deploys to **gethubbly.app**.

---

## Quick start

```bash
npm install      # install dependencies
npm run dev      # local dev server → http://localhost:4321
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build locally
```

Requires **Node 20+** (see `.nvmrc`).

---

## Project structure

```
hubbly/
├─ RECON.md                  ← recon of the Hubbly app; source of truth for all copy
├─ astro.config.mjs          ← site URL, integrations, Tailwind
├─ public/                   ← static assets served as-is
│  ├─ CNAME                  ← gethubbly.app (GitHub Pages custom domain)
│  ├─ favicon.svg, hubbly-icon.png, og-image.png, robots.txt, site.webmanifest
├─ scripts/generate-og.mjs   ← regenerates the Open Graph share image
└─ src/
   ├─ assets/                ← images optimised by Astro (the app icon)
   ├─ components/
   │  ├─ ui/                 ← primitives: Button, Card, Section, Icon, Logo, …
   │  ├─ layout/             ← Nav, Footer
   │  ├─ home/               ← one file per home-page section
   │  ├─ legal/Callout.astro ← callout boxes used inside legal pages
   │  └─ seo/                ← Seo + JsonLd meta components
   ├─ content/               ← CONTENT COLLECTIONS (edit these to change copy)
   │  ├─ features/*.md       ← one Markdown file per feature card
   │  └─ faqs/*.md           ← one Markdown file per FAQ
   ├─ content.config.ts      ← content-collection schemas
   ├─ data/                  ← typed TS data: site, nav, pricing, social, …
   ├─ layouts/               ← BaseLayout + LegalLayout
   ├─ lib/schema.ts          ← JSON-LD structured-data builders
   ├─ pages/                 ← routes: index, safety, 404, privacy/terms/cookies (MDX)
   └─ styles/global.css      ← Tailwind + brand design tokens
```

---

## Editing content (no code needed)

| To change… | Edit… |
|---|---|
| A feature card | a file in `src/content/features/` — add a file to add a feature |
| An FAQ | a file in `src/content/faqs/` |
| Nav / footer links | `src/data/nav.ts` |
| **Pricing tiers** | `src/data/pricing.ts` |
| "For families" cards | `src/data/audiences.ts` |
| Company / contact / store links | `src/data/site.ts` |
| Social links | `src/data/social.ts` |
| Legal pages | `src/pages/privacy.mdx`, `terms.mdx`, `cookies.mdx` |
| Brand colours / fonts | `src/styles/global.css` (`@theme` block) |

After changing the OG image inputs, regenerate it: `node scripts/generate-og.mjs`.

---

## Before launch — remaining items

Company details, pricing, socials and governing law are all confirmed and wired
in. Two store links remain, both pending the app listings going live:

1. **App Store link** — `STORES.ios` in `src/data/site.ts` is `#`. The App Store
   button shows a "Soon" ribbon; when iOS ships (~1 week after Android), set the
   real URL and `iosLive: true`.
2. **Play Store link** — `STORES.android` points at the expected listing URL
   (`com.perfectday.hubbly`); confirm once the Play listing is live.

### Confirmed details

- **Company** — PerfectDay Technologies Ltd, registered in England & Wales,
  company no. **16952922**, registered office 71–75 Shelton Street, Covent
  Garden, London WC2H 9JQ. Wired into `src/data/site.ts`; flows into the footer
  and legal pages.
- **Pricing** — one model: a **30-day free trial**, then **Hubbly Forever**, a
  one-time purchase. Founders price **£15** (first 100 households), **£39.99**
  after. No subscription. Cosmetic theme packs (£0.99) & family reskins (£4.99)
  are planned as separate optional add-ons. Edit in `src/data/pricing.ts`.
- **Socials** — `@gethubbly` on Instagram, Facebook and X.
- **Markets** — UK-based, launching across English-speaking markets. Legal pages
  cover UK GDPR, EU GDPR and CCPA; review local law before entering other
  markets (e.g. Australia, Canada).

### Decisions already taken
- The brief referenced `hubbly-icon.jpg`; the real asset is the app's
  `assets/icon.png`, copied here as `hubbly-icon.png`.
- The feature set is the **12 features actually in the app** (per `RECON.md` §4).
  The app README's older list (Contacts/Bills/School/Reading/House) is outdated
  and was not used.
- The website itself ships with **no analytics and no tracking cookies**. The
  *app's* Sentry + PostHog analytics are disclosed in the privacy/cookie pages.

---

## Deployment

### Option A — GitHub Pages (configured)

A workflow at `.github/workflows/deploy.yml` builds and deploys on every push to
`main`. To go live:

1. **Create the GitHub repo** and push this project to it.
2. **Enable Pages**: repo *Settings → Pages → Build and deployment →
   Source = GitHub Actions*.
3. **Point DNS at GitHub Pages** at your domain provider for `gethubbly.app`:
   - Apex domain — four `A` records to `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (and/or `AAAA` records for IPv6).
   - Or a `CNAME` for `www` → `<your-user>.github.io`.
   The `public/CNAME` file already tells Pages to serve `gethubbly.app`.
4. Push to `main` — the Action builds and publishes. Tick *Enforce HTTPS* in
   Pages settings once the certificate is issued.

### Option B — Vercel (one-click)

Astro is auto-detected by Vercel — no config required.

1. Go to **vercel.com/new** and import the repository (or use a deploy button:
   `https://vercel.com/new/clone?repository-url=<your-repo-url>`).
2. Framework preset: **Astro**. Build command `npm run build`, output `dist`.
3. Add `gethubbly.app` under *Project → Settings → Domains* and follow Vercel's
   DNS instructions.

If you deploy to Vercel instead of Pages, you can delete
`.github/workflows/deploy.yml` and `public/CNAME`.

---

## Tech notes

- **Astro static output** — zero JavaScript shipped except one small bundle
  (scroll-reveal, sticky nav, mobile menu, FAQ accordion, count-up).
- **Tailwind v4** via `@tailwindcss/vite`; design tokens live in `@theme` in
  `src/styles/global.css`, ported from the app's `theme/tokens.ts`.
- **Fonts** (Fredoka + Nunito) are self-hosted via `@fontsource-variable/*` — no
  Google Fonts CDN request, so the site makes zero third-party calls.
- **Animation** — scroll-reveal, parallax, pointer-tilt and CSS keyframes, all
  gated behind `prefers-reduced-motion`.
- **Page transitions** — native cross-document View Transitions (CSS only).
- **SEO** — per-page title/description, Open Graph + Twitter cards, JSON-LD
  (`Organization`, `SoftwareApplication`, `FAQPage`, `WebPage`), `sitemap-index.xml`
  and `robots.txt`.
- **Accessibility** — semantic landmarks, skip link, focus-visible styling,
  labelled controls, WCAG-AA-minded colour contrast.
