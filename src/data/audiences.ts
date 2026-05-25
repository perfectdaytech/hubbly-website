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
      'Plan meals, events and lists in one place',
      'Calendar reminders with leave-by buffers',
      'Connect Google Calendar or any iCal link',
      'Track medications and next-dose times',
      'PIN-protected settings, kid-proofed',
      'Back up and restore everything as a file',
    ],
  },
  {
    id: 'kids',
    emoji: '🦄',
    title: 'For kids',
    blurb: 'Routines that feel like a game, with a page that belongs to them.',
    accent: 'sun',
    points: [
      'Friendly morning & bedtime checklists',
      'Earn stars for every job done',
      'Spend stars in the reward shop',
      'Grow a star-investment plant',
      'Streak badges for keeping it up',
      'Confetti celebrations when it all clicks',
    ],
  },
];
