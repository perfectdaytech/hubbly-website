// ============================================================
// Pricing — radically simple. One product: Hubbly Forever.
// Free to use for 30 days, then a single one-time purchase.
// No subscription. No monthly plan. No annual plan. Cosmetic
// theme packs & reskins are separate optional add-ons (shop.ts).
// ============================================================

export interface PricingPlan {
  id: string;
  name: string;
  /** Small line above the price, e.g. "Free for 30 days, then". */
  trialLabel?: string;
  /** Big price string. */
  price: string;
  /** Struck-through standard price, shown beside `price`. */
  priceWas?: string;
  /** Early-access / scarcity line shown just under the price. */
  priceNote?: string;
  /** Period suffix next to the price. */
  period: string;
  /** One-line positioning. */
  tagline: string;
  /** Bulleted inclusions. */
  features: string[];
  cta: string;
  /** Corner badge text. */
  badge?: string;
  /** Small print under the CTA. */
  note?: string;
}

export const PRICING_NOTE =
  'Prices in GBP; your app store shows the equivalent in your local currency.';

export const FOREVER_PLAN: PricingPlan = {
  id: 'forever',
  name: 'Hubbly Forever',
  trialLabel: 'Free for 30 days, then',
  // Launch pricing lives here: `price` is the early-access launch price and
  // `priceWas` the post-launch standard price. When the early-access offer ends,
  // set `price` to the standard price and clear `priceWas`.
  price: '£19.99',
  priceWas: '£59.99',
  period: 'one-time',
  badge: 'Early access',
  tagline: 'Every feature, for the whole household.',
  priceNote: 'A limited early-access offer. Hubbly Forever is £59.99 after launch.',
  features: [
    'Every feature included, no paywalls',
    'Unlimited family members and devices',
    'Backup and restore as a file',
    'Free updates while Hubbly runs',
  ],
  cta: 'Start your free trial',
  note: 'No card to start the trial, no subscription, nothing renews on its own.',
};
