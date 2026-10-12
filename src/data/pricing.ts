// ============================================================
// Pricing - subscription model (switched 2026-06-15). One
// subscription covers the whole household on every device.
// Founders' offer is described without a price. It may be offered at
// launch, and the Google Play page is where someone would see it.
// Optional one-time
// cosmetic/content packs on top - never required for any feature.
// Keep in lockstep with the app repo's docs/PRICING.md.
// ============================================================

export interface PricingPlan {
  id: string;
  name: string;
  /** Small line above the price, e.g. "Free for 30 days, then". */
  trialLabel?: string;
  /** Big price string. Omitted while prices stay off the site. */
  price?: string;
  /** Period suffix next to the price. */
  period?: string;
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
  'The price is shown in the app before you subscribe. Your app store shows the equivalent in your local currency. Optional extras (looks, quote packs and other one-time packs) are cosmetic treats - every family feature above is included in the subscription.';

export const FOUNDERS_LINE =
  "We may offer a lower founders' price when Hubbly launches. If we do, you'll see it on the Google Play page before you subscribe. Joining the waitlist doesn't reserve a place.";

export const MONTHLY_PLAN: PricingPlan = {
  id: 'monthly',
  name: 'Monthly',
  tagline: 'Every feature, on the kitchen tablet and every family phone.',
  features: [
    'Every family feature, no paywalls inside',
    'The kitchen tablet and everyone\'s phones (5 devices included)',
    'Works offline, syncs in real time',
    'Cancel anytime - your data stays safe for 30 days',
  ],
  cta: 'Join the waitlist',
};
