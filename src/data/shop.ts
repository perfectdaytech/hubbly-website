// Optional cosmetic add-ons — shown on the site as "Coming soon".
// These never change what Hubbly can do, only how it looks and feels.

export interface ShopItem {
  emoji: string;
  name: string;
  /** Price per item, e.g. "£0.99". */
  price: string;
  description: string;
  /** Example variants shown as chips. */
  chips: string[];
  accent: 'sun' | 'lavender';
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    emoji: '🎨',
    name: 'Seasonal theme packs',
    price: '£0.99',
    description:
      'Themed screensavers, stickers, completion animations and sounds for the moments your family looks forward to all year.',
    chips: ['🎄 Christmas', '🎃 Halloween', '☀️ Summer', '🌙 Eid', '🪔 Diwali', '🧧 Lunar New Year'],
    accent: 'sun',
  },
  {
    emoji: '🪄',
    name: 'Family reskins',
    price: '£4.99',
    description:
      'Bigger visual transformations that match the stage of life your household is in right now.',
    chips: [
      'Tweens & Teens',
      'Adult Household',
      'Co-parenting',
      'Grandparent-friendly',
      'Neurodivergent-friendly',
    ],
    accent: 'lavender',
  },
];

export const SHOP_FOOTNOTE =
  'Everything in the shop is genuinely optional. Hubbly is complete and beautiful without ever opening it.';
