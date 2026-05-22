# RECON — Hubbly app

> Phase 0 recon for the **gethubbly.app** marketing + legal site.
> Source app read at `C:\Users\oschi\AndroidStudioProjects\Hubbly`.
> Date: 2026-05-20.

> **UPDATE 2026-05-20 (post-recon, from the founder):**
> 1. **Firebase cloud sync ships at launch** — it is being implemented now and is
>    a standard part of v1, not an opt-in afterthought. Legal pages treat Firebase
>    (Auth/Firestore/Storage) as an active processor.
> 2. **Analytics at launch: Sentry + PostHog.** Sentry for crash/error monitoring,
>    PostHog for product analytics. Both must appear in the privacy policy,
>    cookie policy, and third-party processor list.
> 3. **iOS launches ~1 week after Android.** Treat iOS as imminent — both store
>    buttons are real; the App Store button is "Coming soon" only very briefly.
> The sections below are annotated where this supersedes the original finding.

This document is the single source of truth for everything the website says about
the product. Every feature, colour, data-handling claim and legal fact below was
read directly out of the app's code — not assumed.

---

## 1. What Hubbly actually is

**Hubbly is a "cosy command centre for your family's day"** — a React Native /
Expo app, **Android-first**, designed to run on a **kitchen tablet** (wall-mounted
or on the counter) *and* on family members' **phones**. It's a shared family hub:
routines & chores for kids, a family calendar, meal planning, lists, a trip
planner, sticky notes, timers, weather, medication tracking, and a star-based
reward system.

- **Name:** Hubbly
- **Tagline (from brand sheet):** "The cosy command centre for your family's day ♥"
- **Publisher:** Perfect Day Technologies Ltd
- **Android package:** `com.perfectday.hubbly`
- **iOS bundle id:** `com.perfectday.hubbly` (configured, see §9 — *not* a shipping target yet)
- **Version:** 1.0.0 (`versionCode` 1)
- **Stack:** Expo SDK 54, Expo Router 6, React Native 0.81, React 19, TypeScript, New Architecture
- **Maturity:** Pre-launch. README's own roadmap lists Play Store submission as "Phase 9" (not done). The website's "Now in early access" eyebrow is accurate.

### Greeting / dashboard voice (for the hero mockup)
The dashboard header shows a large live **clock**, then **"Good morning, family"**
(literally the word "family" — `greetingSuffix` defaults to `'family'`; switches to
"Good afternoon" after 12:00, "Good evening" after 17:00), then the date. A weather
chip sits alongside.

---

## 2. ⚠️ Contradictions & things to flag

The brief said "if you discover something that contradicts what I said, flag it."
Here is what I found:

1. **README's feature list is stale/aspirational.** `README.md` says v2 shipped
   "Medications, **Contacts, Bills, School, Wishlists, Reading, House info + WiFi
   QR**". The *actual* `app/` routes contain **no** Contacts, Bills, School,
   Reading or House screens. What the app *really* has instead is **Journeys**
   (a trip planner) and generic **Lists**. → The website must describe the
   **real, shipped features** (§4), not the README's list.

2. **"MMKV persistence" is wrong.** README says the store uses MMKV.
   `src/store/storage.ts` explicitly uses **AsyncStorage**, *not* MMKV, with a
   comment explaining why (MMKV is a native module unavailable in Expo Go). →
   The privacy policy must say AsyncStorage / local app storage.

3. **Branding assets now exist.** README says `icon.png` etc. are "4 KB stubs".
   They're now real **281 KB branded icons** — a cute cream **house with a
   smiling face, a heart on the roof, a chimney, a yellow star and a green
   bush/cloud**. A full **brand sheet** also exists at
   `Branding/ChatGPT Image May 20, 2026, 09_55_33 AM.png`. → We have real
   branding to work from.

4. **No `hubbly-icon.jpg`.** The brief's STEP 4 references `hubbly-icon.jpg`. No
   such file exists. The real icon is `assets/icon.png` (1024-ish px, cute house).
   → Plan: copy `assets/icon.png` into the website's `public/` as the Hubbly mark
   wherever the brief says `hubbly-icon.jpg`.

5. ~~**Cloud sync is OFF by default.**~~ **SUPERSEDED** — see update at top.
   Firebase sync **ships at launch** as a standard feature. The privacy policy
   describes Firebase as an active processor. (Local-first architecture is still
   true and worth saying: data lives on-device and works offline; sync mirrors it
   to the family's private Firestore space.)

6. **Location wording mismatch.** `app.json`'s location permission string says
   location is "never stored or shared". In fact the chosen weather location
   (`name`, `lat`, `lon`, `countryCode`) **is persisted locally** (`hubbly:location`
   + `Data.location`) so weather works offline. It is *not transmitted to us* and
   *not shared with third parties* beyond the Open-Meteo weather request. → The
   privacy policy should describe this accurately: location stored locally on the
   device, sent only to Open-Meteo to fetch a forecast.

7. **iOS launches ~1 week after Android** (per founder update). `app.json`
   already has iOS config + `supportsTablet: true`. → Decision (see §11): both
   store buttons are real; Google Play is the day-one CTA, the App Store button
   shows a small "Coming soon" ribbon that's only accurate for ~1 week.

---

## 3. Brand system (ported verbatim from `src/theme/tokens.ts`)

### Core palette
| Token | Hex | Use |
|---|---|---|
| `cream` | `#FFF8EE` | Default page background (the "warm cream" brand default) |
| `warmPaper` | `#FBEFD8` | Secondary background, gradient partner to cream |
| `peach` | `#FFB088` | Warm accent |
| `sun` | `#FFD166` | Stars, yellow accent |
| `mint` | `#88D9C0` | Green accent (lists) |
| `sky` | `#7FC8E4` | Blue accent (calendar, journeys) |
| `coral` | `#FF6B6B` | **Primary brand colour** — CTAs, highlights, hearts |
| `coralDeep` | `#E95C53` | Pressed states, the wordmark, higher-contrast coral |
| `lavender` | `#C5A3FF` | Purple accent (notes) |
| `navy` | `#2D3142` | Primary text, dark surfaces |
| `navySoft` | `#4A4F66` | Secondary text |
| `shadow` | `rgba(45,49,66,0.08)` | Soft shadow colour |

### Night ("Bedtime") palette — for the dark navy feature card
`bg #1A1F3A`, `bgAlt #252B4A`, `panel #2D3458`, `panelAlt #363D6A`,
`text #F0E8D6`, `textSoft #D6D3E3`, `accent #B89DFC`, `accent2 #9FDBEF`,
`star #FFD166`, `coral #F4A0BC`.

### Morning palette — sunrise gradient
`bg1 #FFE5C2` → `bg2 #FFB088`, `accent #FF6B6B`, `textAccent #A23E3E`.

### Member / category colours
Member palette: `#FF6B6B #7FC8E4 #88D9C0 #FFD166 #C5A3FF #FFB088 #F472B6 #A78BFA`.
Note colours: `sun, mint, sky, peach, lavender, coral`.

### Typography
- **Display font: Fredoka** — weights 400 / 500 / 600 / 700. Used for headings,
  the clock, titles. (The brief's "Fredoka headline" matches.)
- **Body font: Nunito** — weights 400 / 600 / 700 / 800 (ExtraBold). Used for body
  + emphasis. The app's "body-x" / extra-bold style = Nunito 800.
- Both are Google Fonts; bundle them via `@fontsource` or self-host `.woff2`.

### Radius scale
`xs 8, sm 10, md 12, lg 14, xl 16, 2xl 18, 3xl 20, 4xl 22, 5xl 24, pill 999`.
Cards in-app use ~22 px (`4xl`). Tiles/buttons ~12–16 px.

### Spacing scale (px)
`2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48`.

### Motion
Durations: fast 150 ms, medium 250 ms, slow 400 ms, very-slow 600 ms.
Signature easing is a springy "pop" overshoot — approx `cubic-bezier(0.34, 1.56,
0.64, 1)`. Use this for the bob/float animations the brief asks for, and respect
`prefers-reduced-motion`.

### Visual texture (seen across screens)
- Big soft **off-screen blurred circles** as background blobs (peach top-right,
  mint bottom-left, at ~16–20% alpha) — a key brand motif, reuse on the site.
- White cards with soft shadow, generous rounding, often an **8 px coloured
  left-border** (e.g. the per-kid card uses the member's colour).
- Cream→warmPaper diagonal gradient as the page background.
- Emoji used liberally as iconography; Lucide icons for UI chrome.

### The Hubbly mark / icon
`assets/icon.png` — a rounded-square app icon: a **cream house with a smiling
face**, a **coral roof with a heart cut-out**, a small **chimney**, a **yellow
star** bottom-left and a **green bush** bottom-right, on an off-white background.
This is the logo lockup icon. There's no separate SVG — the PNG is what we have.

---

## 4. Features — the REAL, shipped feature set

These are the actual routes in `app/` and the dashboard cards/tiles in
`src/data/dashboardSections.ts`. Use these for the feature grid + content
collection. Recommended **12 headline features**:

| # | Feature | Emoji | What it does (from code) | Colour |
|---|---|---|---|---|
| 1 | **Morning routine** | 🌅 | Per-kid checklists (make bed, brush teeth, get dressed, pack bag…). Tick a task → earn ⭐. Sunrise gradient. | peach / sun |
| 2 | **Bedtime mode** | 🌙 | The calm, dark "night" routine — bath, pyjamas, brush teeth, story. Dark navy palette, twinkly stars. **← the dark card in the grid.** | navy/night |
| 3 | **Stars & rewards** | ⭐ | Kids earn stars for tasks; redeem against a reward shop (choose dinner, screen time, cinema trip…). Celebration confetti when a routine is fully done. | coral |
| 4 | **Star investments** | 🌱 | Kids can "invest" stars for a term (½ day → 3 days) and watch a plant grow; matures to more stars. Teaches delayed gratification. | mint |
| 5 | **Pocket money** | 💷 | Optional weekly allowance per child with a balance + adjustment log. Currency auto-derived from location. | sun |
| 6 | **Family calendar** | 📅 | Events with times, members, categories, repeat rules (daily→yearly), reminders, "leave-by" travel buffers, birthdays. **ICS import** by file *or* live URL subscription. | sky |
| 7 | **Meal planner** | 🍽️ | Plan breakfast/lunch/dinner/snacks for the week from a meal-template library (with optional ingredients + method). | peach |
| 8 | **Lists** | ✅ | Shopping + to-do + any custom list; categories, recurring items, tickable. | mint |
| 9 | **Journeys** | 🧳 | A family trip planner: idea → planning → booked → completed; day-by-day plan (travel/stay/activity/food/notes), per-trip packing checklists, budget, optional multi-day calendar band. | sky |
| 10 | **Sticky notes** | 📝 | Colourful post-it notes pinned to the dashboard — reminders, the guest WiFi, anything. | lavender |
| 11 | **Timers** | ⏱️ | Quick-start presets (1/3/5/10/15 min), a focus timer, and a floating timer overlay that follows you across screens. | navy |
| 12 | **Medications** | 💊 | Per-member meds with dose, doses-per-day, last-dose logging and a rolling next-dose reminder. | lavender |

### Supporting capabilities (mention in copy, FAQ, "for everyone" card)
- **Weather** — current conditions + 7-day / hourly forecast (Open-Meteo).
- **Customisable dashboard** — "Personalise mode": large **Cards** at top + small
  **Tiles** below; reorder, expand/collapse, hide, add. Everything is movable.
- **Kitchen display mode** — opt-in: keep-awake, landscape lock, immersive nav
  bar, and a photo-slideshow **screensaver** after idle. Off by default.
- **Android home-screen widgets** — two: "Today's plan" and "Kid stars".
- **Local notifications** — event reminders + medication next-dose reminders,
  quiet-hours-aware. Opt-in; entirely on-device (no push server).
- **Quiet hours** — schedule a window that mutes sound + dims the UI.
- **Backup & restore** — export/import the whole family dataset as JSON.
- **Multi-device family sync** — optional; join with a **6-digit family code**.
- **PIN-gated settings** — a 4-digit PIN protects Settings (default `1234`).
- **Per-kid view, streaks, moods** — each kid has a page; 🔥 streak badge for
  consecutive fully-completed days; optional daily mood emoji.

### Default sample family (for the hero mockup — real seed data)
- **Mum** 👩 (coral), **Dad** 👨 (sky) — parents
- **Lily** 🦄 (sun/yellow), **Max** 🦖 (mint) — kids
- Sample events: **"Lily's swimming" 16:30**, **"Max football" 17:00**, "Grocery shop" 10:00
- Sample meals: Pizza night 🍕, Sunday roast, Tacos, Chicken curry
- Sample journey: "Seaside weekend" 🏖️ to Brighton
- Sample tasks: Make bed 🛏️, Brush teeth 🦷, Get dressed 👕, Pack school bag 🎒, Read 15 mins 📚, Feed the dog 🐕

### Real numbers (for the social-proof stat strip)
- **12 features** (the headline set above) ✓ matches the brief's stat.
- **Works on tablet · phone** ✓.
- **Unlimited family members** — the `family` array has no cap ✓.
- Other true numbers if useful: 2 home-screen widgets, 7-day weather forecast,
  16 built-in task templates, 16 meal templates, 9 sound effects.

---

## 5. Data the app collects / stores

All of this lives **on the device** by default (AsyncStorage, key `hubbly:data`).
It is only transmitted anywhere if (a) the family enables Firebase sync, or
(b) it's a weather lookup. Categories of data in the model (`src/store/types.ts`):

- **Family members:** name, emoji, colour, isParent/isPet flags, celebration emojis.
- **Tasks & routines:** task definitions, daily completions, **stars** balances, streaks (derived).
- **Calendar:** events (title, date, time, members, category, repeat, reminders), event overrides, **ICS imports** (label + imported events), **birthdays**.
- **Meals:** weekly meal plan, meal templates (name, emoji, ingredients, method).
- **Lists:** named lists + items (text, done, category, recurring).
- **Journeys:** trips — destination, dates, members, notes, budget (free text), day-by-day plan, packing checklists.
- **Notes:** sticky-note text, colour, author name.
- **Rewards & economy:** rewards, **star investments**, **investment terms**, **allowance** config + balance, allowance log.
- **Wishlist:** wishes (title, emoji, cost, **URL**, occasion, star cost).
- **Health data ⚠️:** **medications** (name, dose, schedule, last-dose timestamp) + **medication log** per date. *This is sensitive / special-category data.*
- **Moods ⚠️:** an optional per-child, per-day mood emoji. Also sensitive.
- **Security:** the **4-digit PIN** (stored in the local data blob, not encrypted at rest beyond OS app-sandboxing — do not over-claim encryption).
- **Photos:** images the user adds for the screensaver — resized to ≤1280 px JPEG and stored in the app's local document directory (`photos/`). Phase 3 plans to move these to Firebase Storage; today they are **local-only**.
- **Location:** chosen weather location — name, latitude, longitude, country code — stored locally; sent only to Open-Meteo.
- **Device state** (`hubbly:device`): a generated `deviceId`, device role/label, sync `familyId`, toggles (sound, notifications, kiosk mode, onboarding flags).
- **Sync identifiers** (only if sync is on): anonymous Firebase UID, family doc id, **6-digit join code**.

**Not collected:** no analytics, no advertising IDs, no account email/password
(anonymous auth only), no contacts, no microphone (`expo-audio` is configured
with `microphonePermission: false`), no background location.

---

## 6. Third-party services & processors

| Service | Provider | Used for | When |
|---|---|---|---|
| **Firebase Authentication** | Google LLC | Anonymous sign-in (no email/password) | Only if family enables sync |
| **Cloud Firestore** | Google LLC | Storing/syncing the family dataset; region `eur3` (Europe) recommended in setup | Only if sync enabled |
| **Firebase Cloud Storage** | Google LLC | Screensaver photos (planned, Phase 3) | Only if sync enabled (future) |
| **Firebase Cloud Messaging** | Google LLC | Cross-device push (Phase 5b, **not yet built**) | Future |
| **Open-Meteo** | Open-Meteo (open weather API) | `api.open-meteo.com` forecast + `geocoding-api.open-meteo.com` city search. No API key, no account. | When weather is used; receives lat/lon only |
| **Sentry** | Functional Software, Inc. (Sentry) | Crash & error monitoring / diagnostics | At launch |
| **PostHog** | PostHog Inc. | Product analytics (feature usage, funnels) | At launch |
| **Expo / EAS** | Expo (650 Industries) | Build & app delivery infrastructure (`eas build`) | Build-time |
| **Google Fonts** (Fredoka, Nunito) | Google | Bundled in-app via `@expo-google-fonts/*` — **not fetched at runtime** | n/a |
| **Google Play / Apple App Store** | Google / Apple | App distribution | At install |

**Analytics at launch: Sentry + PostHog** (per founder update). Sentry handles
crash/error diagnostics; PostHog handles product analytics. Both must be disclosed
in the privacy policy (lawful basis: legitimate interest / consent), the
processor list, and the cookie policy. Recommended posture for the legal copy:
analytics are used to improve the app, are **not** used for advertising, children
are **not** profiled, and PostHog should be configured to avoid collecting
children's PII. → The **website itself** (gethubbly.app) will still ship with
**zero tracking and no non-essential cookies** — the in-app analytics are a
separate matter from the marketing site, and the cookie policy will make that
distinction explicit.

---

## 7. Permissions requested (Android — `app.json`)

`INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`,
`VIBRATE`, `POST_NOTIFICATIONS`, `READ_MEDIA_IMAGES`, `RECEIVE_BOOT_COMPLETED`,
`SCHEDULE_EXACT_ALARM`, `WAKE_LOCK`.

Plain-English mapping (for the privacy/safety pages):
- Location → fetch local weather (approximate; not background; not shared with us).
- Notifications → event + medication reminders (opt-in).
- Photos / media (`READ_MEDIA_IMAGES`) → let the user pick screensaver photos.
- Camera (iOS string only) → take a photo directly for the screensaver.
- Vibrate → haptic feedback on taps/celebrations.
- Wake lock / boot-completed / exact-alarm → keep the kitchen tablet awake, keep
  widgets fresh, fire reminders at the right minute.

`expo-audio` is configured with **`microphonePermission: false`** — no mic access.

---

## 8. Sync architecture & security (for the safety page)

- Every device that syncs is an **anonymous Firebase user** (no email, no password).
- A device "belongs to" a family iff a `families/{familyId}/members/{uid}` doc
  exists. Firestore **security rules** (`firestore.rules`) enforce that only
  members of a family can read/write that family's data — verified per request.
- Joining uses a **6-digit code**; `joinCodes/{code}` docs are write-once and can
  never be repointed (rule: `update, delete: if false`).
- Storage rules mirror the same membership check for any binary blobs.
- **In transit:** all Firebase traffic is HTTPS/TLS (Google default).
- **At rest:** Firestore + Cloud Storage are encrypted at rest by Google (AES-256,
  Google-managed keys). Local device data sits in the OS app sandbox /
  AsyncStorage — protected by the device's own security, **not** separately
  app-encrypted. **Be honest about this on the safety page** — don't claim
  client-side E2E encryption; it isn't implemented.
- Firestore long-polling is enabled for reliability on mobile networks.

---

## 9. Company & legal facts

- **Legal entity:** PerfectDay Technologies Ltd — registered in England & Wales,
  **company number 16952922**, registered office **71–75 Shelton Street, Covent
  Garden, London WC2H 9JQ** (confirmed via the Companies House register,
  2026-05-20; incorporated 9 Jan 2026). Wired into `src/data/site.ts`.
- **Pricing (confirmed):** Free / Family £4.99 per month / Forever **£40**
  one-time. Cosmetic theme packs & reskins planned as separate future add-ons.
- **Markets:** UK-based; launching across English-speaking markets. Governing
  law England & Wales confirmed.
- **Contact email:** `founders@perfectdaytech.com` (from session context).
  Note: domain is `perfectdaytech.com`; product domain is `gethubbly.app`.
- **Product site:** `https://gethubbly.app`.
- **Governing law:** England & Wales (brief says "confirm" — proceed with E&W,
  flag in README).
- **Regulator for UK:** Information Commissioner's Office (ICO) — give the ICO
  complaint route in the privacy policy.
- **Audiences for legal pages:** GDPR (EU), UK GDPR + Data Protection Act 2018,
  CCPA/CPRA (California). Children: **COPPA** (US), **GDPR-K / Article 8** (EU),
  and the **UK Age-Appropriate Design Code (Children's Code)** — critical because
  the app is *used by* children even though *accounts are created by adults*.
- **Account model for the Terms:** account creator must be **18+**; children only
  participate inside a **parent-managed family** (matches the brief). There is no
  child login — kids use shared devices; "kid view" + the kid star widget are
  parent-set-up surfaces, not authenticated accounts.
- **Children's-data posture:** Hubbly does **not** create accounts for children,
  show ads, profile children, or send children's data to advertisers. Parents
  enter and control all family data. Sensitive child data present: medications,
  moods, names, photos. This should be stated plainly and reassuringly.
- **DPO:** none named in the repo → privacy policy should route DSARs to the
  `founders@perfectdaytech.com` contact, with a placeholder for a postal address.
- **Last-updated date for legal pages:** 2026-05-20.

---

## 10. Project / config facts (for build + SEO)

- App name "Hubbly", slug "hubbly", scheme `hubbly`, `userInterfaceStyle: light`.
- Splash background `#FFF8EE` (cream) — reuse as the site's theme-color.
- Two Android widgets declared: `TodayPlan` (4×2 cell) and `KidStars` (3×3 cell).
- Default PIN `1234`; default profile name `family`.
- `assets/` has the icon (`icon.png`, `adaptive-icon.png` — same image), splash,
  9 generated `.wav` sound effects, 2 widget preview PNGs.
- Local data keys: `hubbly:data`, `hubbly:device`, `hubbly:location`,
  `hubbly:notif-map`, `hubbly:weather-cache`.

---

## 11. Decisions taken into Phase 1+ (recorded here, will go in site README)

1. **`hubbly-icon.jpg` → `assets/icon.png`.** Copy the real PNG into the site's
   `public/` and use it as the Hubbly mark / "Meet Hubbly" floating image.
2. **Store buttons:** Google Play = the live, primary CTA. App Store button shown
   for brand parity but labelled "Coming soon" / disabled — iOS isn't a shipping
   target. (Will flag in README; happy to flip if the user says iOS is launching.)
3. **Feature collection = the 12 real features in §4**, with Bedtime mode as the
   dark navy card. README's Contacts/Bills/School/Reading/House are *omitted*
   (they don't exist in the app).
4. **Cookie policy:** the site will ship with **no analytics and no non-essential
   cookies** at all — honest and on-brand. The page will say exactly that.
5. **Privacy policy headline truth:** "By default, Hubbly stores everything on
   your device and sends nothing to us. Sync is optional." Built around §5–§8.
6. **Pricing:** placeholders per the brief — Free / £4.99 pm / £99 lifetime —
   clearly marked TODO for the user to confirm.
7. **Company registered number/address** left as a visible placeholder in legal
   pages — not inventable from the repo.

---

## 12. Open questions for the user (non-blocking — sensible defaults taken)

- Is iOS launching, or Android-only at first? (Assumed Android-first.)
- Final pricing for the three tiers? (Using brief's placeholders.)
- Company registered number + registered office address for the legal pages?
- Confirm governing law = England & Wales.
- Is there a separate support email, or use `founders@perfectdaytech.com` for
  everything (privacy/DSAR/support)?

None of these block Phases 1–4; they only need answering before the legal pages
(Phase 5) and final pricing sign-off.
