export interface Freebie {
  slug: string;
  title: string;
  keyword: string | null;
  summary: string;
  href: string;
  kind: 'library';
  safety?: string;
}

export const FREEBIES: Freebie[] = [
  {
    slug: 'family-cleaning-day',
    title: 'Family Cleaning Day',
    keyword: 'CLEAN',
    summary: 'A picture sheet for the family and a short plan for the grown-ups.',
    href: '/printables/family-cleaning-day.pdf',
    kind: 'library',
  },
  {
    slug: 'calmer-mornings-starter',
    title: 'Calmer Mornings Starter',
    keyword: 'MORNING',
    summary: 'Morning chart, bedtime chart and a star chart. This is also the waitlist gift.',
    href: '/printables/calmer-mornings-starter.pdf',
    kind: 'library',
  },
  {
    slug: 'wind-down-cards',
    title: 'Wind-down cards',
    keyword: 'BEDTIME',
    summary: 'Six calm bedtime cards: bath, pyjamas, story, breathing, cuddle, lights low.',
    href: '/printables/wind-down-cards.pdf',
    kind: 'library',
  },
  {
    slug: 'advent-kindness-stars',
    title: 'Advent kindness stars',
    keyword: 'KIND',
    summary: '24 small kind things to colour, one a day.',
    href: '/printables/advent-kindness-stars.pdf',
    kind: 'library',
  },
  {
    slug: 'christmas-holidays-routine',
    title: 'Christmas holidays routine',
    keyword: 'HOLIDAY',
    summary: 'A loose daily rhythm and a boredom-buster list.',
    href: '/printables/christmas-holidays-routine.pdf',
    kind: 'library',
  },
  {
    slug: 'january-family-reset',
    title: 'January family reset',
    keyword: 'RESET',
    summary: 'A monthly aim, a weekly rhythm, a chore rota, a reward shop and one habit.',
    href: '/printables/january-family-reset.pdf',
    kind: 'library',
  },
  {
    slug: 'screen-time-star-tokens',
    title: 'Screen-time star tokens',
    keyword: 'SCREENS',
    summary: 'Earn-and-spend stars, plus a family screen agreement.',
    href: '/printables/screen-time-star-tokens.pdf',
    kind: 'library',
  },
  {
    slug: 'sick-day-tracker',
    title: 'Sick-day tracker',
    keyword: 'POORLY',
    summary: 'A log for the time, what you gave, and how they seem.',
    href: '/printables/sick-day-tracker.pdf',
    kind: 'library',
    safety:
      'Follow the dose on the packet, or your pharmacist or GP. Call 111 if you are worried.',
  },
  {
    slug: 'chore-cards',
    title: 'Chore Cards',
    keyword: 'CHORES',
    summary: 'Cut-out job cards, plus a blank card for a job that is yours.',
    href: '/printables/chore-cards.pdf',
    kind: 'library',
  },
  {
    slug: 'colour-in-mascot',
    title: 'Colour-in mascot sheets',
    keyword: 'COLOUR',
    summary: 'The mascot only, with no speech bubbles.',
    href: '/printables/colour-in-mascot.pdf',
    kind: 'library',
  },
  {
    slug: 'half-term-planner',
    title: 'Half-term planner',
    keyword: 'HALFTERM',
    summary: 'A five-day grid and rainy-day ideas.',
    href: '/printables/half-term-planner.pdf',
    kind: 'library',
  },
];
