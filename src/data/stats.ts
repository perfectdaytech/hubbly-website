// Social-proof strip: three real numbers about Hubbly.
// Numbers verified against the app — see RECON.md §4.

export interface Stat {
  value: string;
  label: string;
  /** Numeric target for the count-up animation; omit for non-numeric stats. */
  countTo?: number;
}

export const STATS: Stat[] = [
  { value: '12', label: 'features in one place', countTo: 12 },
  { value: 'tablet · phone', label: 'works on every family screen' },
  { value: 'unlimited', label: 'family members, no limits' },
];
