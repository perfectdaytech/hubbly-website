// Builders for JSON-LD structured data. Keeps schema objects out of markup.
import { SITE, COMPANY, CONTACT } from '@/data/site';
import { SOCIAL_LINKS } from '@/data/social';

const ORG_ID = `${SITE.url}/#organization`;
const ctx = 'https://schema.org';

/** Organization — emitted site-wide. */
export function organizationSchema() {
  return {
    '@context': ctx,
    '@type': 'Organization',
    '@id': ORG_ID,
    name: COMPANY.legalName,
    alternateName: 'Hubbly',
    url: SITE.url,
    logo: `${SITE.url}/hubbly-icon.png`,
    email: CONTACT.general,
    description: SITE.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '71–75 Shelton Street, Covent Garden',
      addressLocality: 'London',
      postalCode: 'WC2H 9JQ',
      addressCountry: 'GB',
    },
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  };
}

/** SoftwareApplication — emitted on the home page. */
export function softwareApplicationSchema() {
  return {
    '@context': ctx,
    '@type': 'SoftwareApplication',
    name: 'Hubbly',
    operatingSystem: 'Android, iOS',
    applicationCategory: 'LifestyleApplication',
    applicationSubCategory: 'Family organiser',
    description: SITE.description,
    url: SITE.url,
    image: `${SITE.url}/og-image.png`,
    inLanguage: 'en-GB',
    // No `offers` block until the app is downloadable: advertising a buyable
    // price for an unreleased app would overstate availability. Re-add at
    // launch with the live price and an availability value.
    publisher: { '@id': ORG_ID },
  };
}

/** WebPage — emitted on legal / standalone pages. */
export function webPageSchema(opts: { name: string; description: string; path: string }) {
  return {
    '@context': ctx,
    '@type': 'WebPage',
    name: opts.name,
    description: opts.description,
    url: `${SITE.url}${opts.path}`,
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    publisher: { '@id': ORG_ID },
  };
}

/** FAQPage — emitted alongside the home-page FAQ section. */
export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': ctx,
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
