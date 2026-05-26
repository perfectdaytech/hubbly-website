// "For families" section — three cards, one per audience.

export interface Audience {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  /** Accent colour token name from the brand palette. */
  accent: 'coral' | 'sun' | 'sky' | 'mint' | 'lavender';
  /** Checked capability list. */
  points: string[];
}

export const AUDIENCES: Audience[] = [
  {
    id: 'parents',
    emoji: '👩‍👧',
    title: 'For parents',
    blurb: 'The whole week in one glance, and one less thing to hold in your head.',
    accent: 'coral',
    points: [
      "The 5pm dinner panic, gone: tonight's meal is on the planner, the ingredients are already on the shopping list.",
      "Both grown-ups add events to the same calendar from their phones. No more 'I told you about that on Tuesday'.",
      'PE kit Wednesday, swimming Thursday: the kids see what to bring before they leave the house.',
      'Google Calendar plugs straight in, so work meetings, birthdays and school holidays all sit side by side.',
      'Medication reminders so the antibiotic gets given at 8 and again at 8, with one tap to log each dose.',
      "Pocket money tracked against the chores that earned it. No more 'where did my fiver go?'",
    ],
  },
  {
    id: 'kids',
    emoji: '🦄',
    title: 'For kids',
    blurb: 'Routines that feel like a game, with a page that belongs to them.',
    accent: 'sun',
    points: [
      'Wake up to a friendly checklist: brush teeth, get dressed, pack the bag. Tick, tick, tick.',
      'Every job done earns a star, with a mini celebration when the whole routine is finished.',
      'Spend stars in a shop the grown-ups set: extra screen time, choose dinner, a trip to the park.',
      'Plant a star tree and watch it grow over the week as the stars stack up.',
      'A streak badge for keeping the routine going five mornings in a row.',
      'Bedtime that ends with a soft photo screensaver, not a glowing screen.',
    ],
  },
];
