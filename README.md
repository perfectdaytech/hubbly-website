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
- **Pricing** — a **30-day free trial** inside the app. No card is needed to
  start. After that, keeping Hubbly needs a subscription. The price is shown
  in the app before someone chooses, and they are never charged unless they
  subscribe. No price is published on the site. Joining the waitlist does not
  reserve a founders' place. See `/founders-terms`.
- **Socials** — `@gethubbly` on Instagram, Facebook and X.
- **Markets** — UK-based, launching across English-speaking markets. Legal pages
  cover UK GDPR, EU GDPR and CCPA; review local law before entering other
  markets (e.g. Australia, Canada).

### Decisions already taken
- The brief referenced `hubbly-icon.jpg`; the real asset is the app's
  `assets/icon.png`, copied here as `hubbly-icon.png`.
- The feature list is **13 cards**: the 12 features actually in the app
  (per `RECON.md` §4) plus a Reading time card flagged for a near-term
  release. The home page adds a 14th "And more coming…" tile to keep the
  two-column layout even and signal that the roadmap keeps going.
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

---

## Waitlist, referrals and printables

This is a draft. It does not email anyone, it does not call MailerLite, and it
does not change DNS or the live site until this branch is reviewed and merged
by a person. With no environment variables set, the form is in preview mode:
submitting it opens `/nearly` and stores nothing.

### What the owner needs to create

Do not buy a paid plan. Stay on **MailerLite Free** and flag the list at about
**200 subscribers**, counting unconfirmed contacts too. The upgrade discussed
in the spec (Comfort 1,000, monthly) needs the owner's OK. This repo will not
start that plan.

1. **MailerLite Free account** (UAB MailerLite, Lithuania). Before the first
   real sign-up: accept the data-processing agreement, save a dated PDF, read
   the sub-processor list, and confirm UK GDPR cover (UK Addendum or the UK
   Extension). Record the date. If the DPA is EU GDPR only, ask MailerLite for
   the UK Addendum.
2. **Double opt-in on.** Confirmation email subject: "Please confirm you want
   Hubbly emails". Body: "Tap to confirm. If you didn't sign up, ignore this
   and we'll delete your address within 21 days." Drafts for every email are
   in `src/emails/`. Emails 1 and 6 need Sentinel's review before they are sent.
   Nothing in this repo sends mail.
   MailerLite's help documents `{$url}` as the web version of a campaign, not
   as a confirmation link. No confirm-link merge tag is published. The double
   opt-in button is added by MailerLite, and editing that confirmation email
   is only available on a paid plan. Stay on Free. Before go-live, run a live
   test and confirm the button people receive is MailerLite's own confirmation
   link. The draft in `src/emails/00-confirm.html` keeps `{$url}` in the button
   until that test.
3. **Custom fields**, created in the MailerLite UI (the tally script will not
   create them): `ref_code`, `referred_by`, `referral_count` (number),
   `store_pref`, `beta_optin`, `tips_optin`, `age_18`, `form_version`.
   Groups, if you want them for the beta and the tips box, are also created by
   hand. The tally script never creates or edits groups.
4. **Form.** Build a form whose public action URL is pasted into
   `PUBLIC_MAILERLITE_FORM_ACTION`. Success redirect: `https://gethubbly.app/nearly`.
   Confirmation redirect: `https://gethubbly.app/confirmed?code=` plus the
   subscriber's `ref_code`, if MailerLite can append it. If it cannot, the
   confirmed page tells people their link is in the welcome email. Turn
   reCAPTCHA and MailerLite's anti-bot JavaScript **off**. The form has a
   honeypot instead.
5. **Sender mailbox.** Drafts send from Hubbly at hello@gethubbly.app, with
   replies to the same address. Privacy and beta requests use
   privacy@gethubbly.app. A monitored mailbox still has to exist before
   MailerLite verifies the sender. Do not verify a sender before that mailbox
   exists.
6. **DNS.** Do not change GoDaddy records from this branch. When you are ready:
   add MailerLite's DKIM on its own selector, merge MailerLite into the
   existing SPF record (never a second SPF record), leave `google._domainkey`,
   DMARC, MX and the site A/CNAME alone. Then check SPF, DKIM and DMARC.
7. **Environment variables.** Copy `.env.example`.
   - `PUBLIC_MAILERLITE_FORM_ACTION` — public form URL. Blank means preview mode.
   - `MAILERLITE_API_KEY` — server only. Never a `PUBLIC_` variable.
   - `MAILERLITE_MODE=mock` until the account exists. `live` reads subscribers
     and writes `referral_count` only.
   - `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` — already used for cookieless
     EU analytics. Memory persistence, Do Not Track on, no session recording.
8. **ICO registration number.** ZC144477, on `/privacy` section 16, from
   `REGULATOR.registrationNumber` in `src/data/site.ts`.
9. **Weekly tally.** Export, or point `MAILERLITE_MODE=live` at the API, then:
   `node scripts/referral-count.mjs` (dry run) and
   `node scripts/referral-count.mjs --commit` to write counts.
   Counts of 5 or more stay at 4 until you pass `--approve-rewards` after a
   hand check. The script never sends email.
10. **Weekly clean.** `node scripts/purge-unconfirmed.mjs` lists unconfirmed
   contacts older than 14 days, and any stored IPv4 /24 or IPv6 /64 prefix
   that the retention schedule says to delete.
   `node scripts/purge-unconfirmed.mjs --confirm` deletes them. Run it weekly.
   The prefix is used only for the referral fraud hand check. Unconfirmed
   prefixes go with that 14-day purge. Every remaining prefix is deleted by
   31 July 2027, the hard stop in the privacy notice.
    A weekly run means an address older than 14 days is gone within 21 days,
    which is the public promise.
11. **Reward PDFs** are `calm-down-cards.pdf` (3 confirmed referrals) and
    `family-adventure-bingo.pdf` (5). Ava supplies the final files before
    go-live. Do not put them in `public/`. They go out only in the reward
    emails (`src/emails/09-reward-3.html` and `src/emails/10-reward-5.html`).
    Chore Cards and the colour-in mascot sheets stay in the public library
    (`public/printables/`). The Calmer Mornings Starter is the gift for every
    confirmed sign-up, and it is in the library.
12. **Before go-live.** Turn double opt-in on. In a clean browser, confirm
    `/waitlist`, `/nearly` and `/confirmed` set no cookies and no local
    storage. On a live test sign-up, confirm `ref_code`, `referred_by` and
    `form_version` arrive in MailerLite.

`npm test` type-checks, builds, and runs the unit tests plus the pre-publish
scan. It expects the scan to still find `PLAY_URL` and `APP_STORE_URL`.
`[REWARD CHOICE]` is closed. The scan also fails on a pound sign. `npm run build` fails while those remain, because `postbuild`
runs the same scan. `npm run test:unit` runs the logic tests without a build.

### Spec section 5.2

| Condition | Where it is met |
|---|---|
| 1. No cookies or local storage for referrals. `?ref=` only fills the hidden field. | `src/scripts/waitlist-inline.js` reads `ref`, writes the hidden field, then removes it from the address bar. It does not touch cookies or local storage. PostHog stays on memory persistence in `src/scripts/analytics.ts`, and `scrubAnalyticsUrl` strips `ref` and `code` from event URLs. |
| 2. Random 8-character codes from `crypto.getRandomValues`, no look-alikes, never an id or an email. | `src/lib/waitlist/codes.mjs`, called from the inline script for each page view. |
| 3. Self-referrals, duplicates and disposable addresses do not count. | `src/lib/waitlist/count.mjs` plus `email.mjs` and `disposable.mjs`. Plus-tags and Gmail dots are treated as the same address. Three or more sign-ups from one IP in an hour are held for a hand check (`burstHeld`) and count only with `--approve-burst`. A later unsubscribe drops that referral on the next tally, because only `confirmed` status counts. |
| 4. Only double opt-in confirmed referrals count. Unconfirmed sign-ups are deleted after 14 days. | The tally ignores every status except `confirmed`, and ignores confirmations after 23:59 UK time on 31 Dec 2026. `scripts/purge-unconfirmed.mjs` deletes unconfirmed records older than 14 days. Run it weekly, so an address is gone within 21 days. Privacy, the FAQ, the emails and `/nearly` say "within 21 days". That public line is not "after 14 days". The purge script is separate from the tally. |
| 5. The tally is read-only apart from `referral_count`. | `buildReferralCountBody` in `src/lib/waitlist/mailerlite.mjs`. The live client PUT sends that body only. The tally never creates subscribers, groups or other fields, and never sends email. |
| 6. `waitlist_share_click` sends `{channel}` only. | `shareClickProps` allows `copy` or `share` and nothing else. Submit events allow store choice, the beta yes/no, a referrer yes/no, and utm tags. No email, name or code. |
| 7. Draft branch, reviewed before merge. | This work is on a draft branch and a draft pull request. It does not target `main` and does not change the deploy workflow. |
| 8. Stay on MailerLite Free and flag at about 200. | `tally()` warns at 200 subscribers, including unconfirmed contacts. The warning tells you not to start a paid plan. |

### Spec section 13

| Checklist item | Status on this branch |
|---|---|
| Legal entity confirmed | Met. `CONTROLLER_STATEMENT` in `src/lib/waitlist/copy.mjs`, used in the footer, privacy page, terms, founders' terms, referral terms and email drafts. |
| ICO fee and registration number | Met. Registration number ZC144477 is on `/privacy` section 16. |
| Founders' Option B chosen, and Hubbly confirmed as the subscription app | Copy is Option B, on `/founders-terms` and the pricing section. The owner's confirmation, and Brick/Elon's confirmation that Hubbly is the subscription app, are still open. MailerLite stays on Free, flag at about 200. |
| Apple promo offer or offer code, and Play multi-phase offer, confirmed buildable | Open. The founders' page says the offer is made only if the store listing has it on launch day. |
| Automated scan for `{`, `PENDING`, `[TO CONFIRM`, `[HOLD`, `[UNVERIFIED`, `households`, `forever`, and the retired trial line | Met for public pages and email drafts. `scripts/prepublish-check.mjs`, run by `npm test`. |
| MailerLite DPA, dated PDF, sub-processors, UK transfer cover | Open. Owner step. Not accepted from this repo. |
| Form wording matches section 3, boxes unticked, dated HTML saved | Met. `src/components/waitlist/WaitlistForm.astro` and `src/content/consent/waitlist-form-2026-10-12.html`. |
| Clean-browser cookie test, reCAPTCHA off, our own redirect pages | reCAPTCHA is not loaded. Redirect targets are `/nearly` and `/confirmed`. The clean-browser test still has to be run by a person before go-live. |
| Privacy paragraph and the real retention rule | Met. Section 18 of `/privacy`: delete 6 months after the Google Play launch, and by 31 July 2027, with the post-launch exception. Unconfirmed sign-ups are deleted within 21 days. |
| Referral terms, rewards, dates, promoter, both PDFs, no "small extras" | Met. `/referral-terms`. Rewards are Calm-down cards (`calm-down-cards.pdf`) at 3 and Family adventure bingo (`family-adventure-bingo.pdf`) at 5, sent only in the reward emails. The final PDFs are not in the repo yet. Chore Cards and the colour-in sheets are public library files. |
| Section 5.2 conditions checked on the draft branch | Met in code and tests. A human review of this pull request is the remaining check. |
| Trial lines use Sentinel's wording, price and renewal as prominent as "free" | The no-card 30-day in-app trial is on `/terms` section 5, the home page, the waitlist, the founders' terms, the FAQs and emails 1, 2, 6, 7 and 8. No copy says a card is required to start, or that the trial charges automatically. The annual price and the founders' prices are not published. |
| Sender mailbox, postal address in the footer, DNS authentication | Postal address is in the footer and in every email draft. The mailbox and the DNS changes are open. This branch does not change DNS. |
| Emails 1 and 6 reviewed by Sentinel before sending | Open. Drafts are `src/emails/01-welcome.html` and `src/emails/06-launch.html`. They have not been sent. |
| Standard price confirmed, so a decision on an "instead of" comparison | No price is published. The scan fails if `4.99`, `44.99` or a pound sign appears. A missing price does not fail the scan. |
| Cooling-off wording, and a Play manual-refund route | Wording is on `/terms`, `/founders-terms` and the refunds FAQ. The Play Console refund route is an owner step. |
| Sentinel sign-off on v3, Lauren approves the copy | The spec records Sentinel's sign-off with conditions. Lauren's approval of the pages and emails is still open. |
| December DMCC re-check booked for Tue 1 Dec 2026 | Open. Calendar item for Sentinel, with Ava tracking. Not booked from this repo. |

### Freebie library

`/freebies` is one page for the whole series (option B). Comment keywords are
labels on the cards. Chore Cards and the colour-in sheets are in the library. The referral rewards are not. Downloading a
file does not join the waitlist. The privacy page says so.

