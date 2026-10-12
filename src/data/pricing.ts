// ============================================================
// Pricing - subscription model (switched 2026-06-15). One
// subscription covers the whole household on every device.
// Founders' offer is described without a price, and only if the store
// listing includes it. Optional one-time
// cosmetic/content packs on top - never required for any feature.
// Keep in lockstep with the app repo's docs/PRICING.md.
// ============================================================

export interface PricingPlan {
  id: string;
  name: string;
  /** Small line above the price, e.g. "Free for 30 days, then". */
  trialLabel?: string;
  /** Big price string. */
  price: string;
  /** Period suffix next to the price. */
  period: string;
  /** Founders-rate line shown just under the price. */
  priceNote?: string;
  /** One-line positioning. */
  tagline: string;
  /** Bulleted inclusions. */
  features: string[];
  cta: string;
  /** Corner badge text. */
  badge?: string;
  /** Small print under the CTA. */
  note?: string;
  /** Sparkle line about ways to extend the free trial. */
  trialBonus?: string;
}

export const PRICING_NOTE =
  'Prices in GBP; your app store shows the equivalent in your local currency. Optional extras (looks, quote packs and other one-time packs from £0.99, or the £6.99 everything bundle) are cosmetic treats - every family feature above is included in the subscription.';

export const FOUNDERS_LINE =
  "A founders' offer may be available on launch day, if the store listing includes it. Joining the waitlist does not reserve a place.";

export const MONTHLY_PLAN: PricingPlan = {
  id: 'monthly',
  name: 'Monthly',
  trialLabel: '30 days free in the app',
  price: '£4.99',
  period: '/month',
  tagline: 'Every feature, on the kitchen tablet and every family phone.',
  features: [
    'Every family feature, no paywalls inside',
    'The kitchen tablet and everyone\'s phones (5 devices included)',
    'Works offline, syncs in real time',
    'Cancel anytime - your data stays safe for 30 days',
  ],
  cta: 'Join the waitlist',
  note: 'No card to start. You are not charged when the trial ends unless you choose to subscribe.',
};
