// ============================================================
// Site-wide constants. Single source of truth for brand facts,
// company/legal details, contact routes and store links.
// Anything marked TODO needs the founder to confirm before launch.
// ============================================================

export const SITE = {
  name: 'Hubbly',
  domain: 'gethubbly.app',
  url: 'https://gethubbly.app',
  tagline: "The cosy command centre for your family's day",
  /** ~155 char meta description used as the site-wide default. */
  description:
    'Hubbly is the family organiser app for the kitchen tablet: shared routines, calendar, meals, lists, trips and star rewards, all in one warm family hub.',
  /** Brand heart used in the tagline. */
  heart: '♥',
  launchStatus: 'Coming soon',
} as const;

export const COMPANY = {
  legalName: 'PerfectDay Technologies Ltd',
  shortName: 'PerfectDay Technologies',
  jurisdiction: 'England & Wales',
  governingLaw: 'the laws of England & Wales',
  // UK company — confirmed on the Companies House register.
  registrationNumber: '16952922',
  registeredAddress: '71–75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom',
  /** Date the current legal documents took effect. */
  legalEffectiveDate: '2026-05-20',
  legalEffectiveDateLabel: '20 May 2026',
} as const;

export const CONTACT = {
  // TODO(founder): split into support@/privacy@ if you want dedicated routes.
  general: 'contact@gethubbly.app',
  privacy: 'contact@gethubbly.app',
  support: 'contact@gethubbly.app',
  safety: 'contact@gethubbly.app',
} as const;

export const STORES = {
  // Both apps are pre-launch. The store buttons show a "Coming soon" ribbon
  // until each listing is live; flip the matching *Live flag to true on
  // launch day (and confirm the Play Store URL once published).
  android: 'https://play.google.com/store/apps/details?id=com.perfectday.hubbly',
  androidLive: false,
  ios: '#',
  iosLive: false,
} as const;

/** UK regulator details, used in the privacy policy. */
export const REGULATOR = {
  name: "Information Commissioner's Office (ICO)",
  url: 'https://ico.org.uk/make-a-complaint/',
  helpline: '0303 123 1113',
} as const;
