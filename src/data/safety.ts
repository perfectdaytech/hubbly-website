// Safety section (home) — four reassurance points.
// The full /safety page expands on each of these.

export interface SafetyPoint {
  emoji: string;
  title: string;
  text: string;
}

export const SAFETY_POINTS: SafetyPoint[] = [
  {
    emoji: '🔒',
    title: 'Encrypted in transit and at rest',
    text: "Your family's data travels over HTTPS/TLS and is encrypted at rest in Google Cloud. Only devices that have joined your family can see it.",
  },
  {
    emoji: '🚫',
    title: 'No ads. Ever.',
    text: 'Hubbly has no advertising and never sells your data. Children are never profiled or marketed to.',
  },
  {
    emoji: '👨‍👩‍👧‍👦',
    title: 'Family-only by design',
    text: 'A device can only see your data if it has joined your family with your code. No public profiles, no strangers.',
  },
  {
    emoji: '🧹',
    title: 'Delete anytime',
    text: 'Leave your family or wipe everything in a couple of taps. Your data is yours; take it or remove it whenever you like.',
  },
];
