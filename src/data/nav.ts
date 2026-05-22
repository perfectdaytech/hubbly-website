// Navigation + footer link structure. Edit links here, not in components.
import { CONTACT } from './site';

export interface NavLink {
  label: string;
  href: string;
  /** External links open in a new tab and get rel="noopener". */
  external?: boolean;
}

/** Primary nav — shown centred on desktop, in the mobile sheet under 768px. */
export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '/#features' },
  { label: 'For Families', href: '/#families' },
  { label: 'Safety', href: '/safety' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Meet Hubbly', href: '/#meet' },
      { label: 'For families', href: '/#families' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Safety & security', href: '/safety' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Contact us', href: `mailto:${CONTACT.general}`, external: true },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
];
