// ============================================================
// Content collections. Adding a feature or an FAQ is one Markdown
// file with frontmatter — no code change needed.
// ============================================================
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Brand palette tokens a feature card may be themed with. */
const accent = z.enum(['coral', 'peach', 'sun', 'mint', 'sky', 'lavender', 'navy']);

const features = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/features' }),
  schema: z.object({
    /** Card heading. */
    title: z.string(),
    /** Emoji shown in the card's icon chip. */
    icon: z.string(),
    /** Accent colour token. */
    color: accent,
    /** Display order (1-based) across the asymmetric grid. */
    order: z.number().int().positive(),
    /** Desktop column span out of a 6-column grid (2 | 3 | 4). */
    span: z.number().int().min(2).max(6).default(2),
    /** When true the card renders as the dark navy "break" card. */
    dark: z.boolean().default(false),
    /** Optional sub-capability chips. */
    chips: z.array(z.string()).default([]),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    order: z.number().int().positive(),
  }),
});

export const collections = { features, faqs };
