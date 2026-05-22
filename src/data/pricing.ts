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
  /** Founders / scarcity line shown just under the price. */
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
  'One purchase covers your whole household: unlimited members and devices. Prices are in GBP; your app store shows the equivalent in your local currency.';

export const FOREVER_PLAN: PricingPlan = {
  id: 'forever',
  name: 'Hubbly Forever',
  trialLabel: 'Free for 30 days, then',
  // Launch pricing lives here: `price` is the founders launch price and
  // `priceWas` the post-launch standard price. When the founders offer ends,
  // set `price` to the standard price and clear `priceWas`.
  price: '£15',
  priceWas: '£39.99',
  period: 'one-time',
  badge: 'Founders pricing',
  tagline: 'The complete Hubbly app, made for your whole family.',
  priceNote:
    'A limited founders launch offer for early households. Hubbly Forever is £39.99 after launch, and the current price is always shown before you buy.',
  features: [
    'The complete Hubbly app, every feature',
    'Shared family calendar & reminders',
    'Unlimited routines, chores & reward charts',
    'Star economy, reward shop & pocket money',
    'Meal planner, shared lists & trip planner',
    'Kitchen-tablet display & photo screensaver',
    'Medication tracking & mood check-ins',
    'Bedtime mode & breathing timer',
    'Unlimited family members & devices',
    'Every future update, included free',
  ],
  cta: 'Start your free trial',
  note: 'No payment details needed to start, and with no subscription, nothing renews on its own.',
};
