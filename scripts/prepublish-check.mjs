// Pre-publish scan of built pages and email drafts.
// Fails while open decisions, internal notes, or reward PDFs remain.
// MailerLite merge tags that the emails actually use are allowed.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const BANNED = [
  'PENDING',
  '[TO CONFIRM',
  '[HOLD',
  '[UNVERIFIED',
  'households',
  'forever',
  'cancel anytime in your store settings',
  'goes in this email',
  'once the listing is actually live',
  'sit in the same place as the word free',
  'is planned in the app',
  'PLAY_URL',
  'APP_STORE_URL',
  '44.99',
  '4.99',
  '£',
];

/** Tokens that stay in the draft until the owner decides. Any one fails this scan. */
export const OPEN_PLACEHOLDERS = [];

/**
 * Tags the emails actually send.
 * {$url} is MailerLite's campaign web-version link. No confirm-link merge tag
 * is published, so the confirmation draft keeps this tag until a live test.
 * {$unsubscribe} is the visible unsubscribe link.
 * {$fields.ref_code} is the share-link code in the welcome email.
 */
export const ALLOWED_MERGE_TAGS = ['{$unsubscribe}', '{$url}', '{$fields.ref_code}'];

export const REWARD_PDFS = ['calm-down-cards.pdf', 'family-adventure-bingo.pdf'];

export const REWARD_SOURCES = [
  {
    file: 'calm-down-cards.pdf',
    marker: 'Calm-down cards',
    email: 'emails/09-reward-3.html',
  },
  {
    file: 'family-adventure-bingo.pdf',
    marker: 'Family adventure bingo',
    email: 'emails/10-reward-5.html',
  },
];

/** Ava's files live here. The site does not generate them. */
export const REWARD_DIR = 'rewards';

const ALLOWED_BRACKET = '[your name]';

/**
 * Price figures must not match a longer decimal, such as the logo path
 * coordinate 524.992188.
 * @param {string} text
 * @param {string} term
 */
export function containsTerm(text, term) {
  if (term === '4.99' || term === '44.99') {
    const escaped = term.replace('.', '\\.');
    return new RegExp(`(?<![\\d.])${escaped}(?!\\d)`).test(text);
  }
  return text.toLowerCase().includes(term.toLowerCase());
}

/** @param {string} html */
export function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z]+;/gi, ' ');
}

/**
 * Percent-encoded and entity-encoded braces survive a visible-text scan,
 * because the tags are stripped before the brace check.
 * @param {string} value
 */
function decodeHtmlEntities(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, body) => {
    const hex = body[0] === 'x' || body[0] === 'X';
    const code = hex ? Number.parseInt(body.slice(1), 16) : Number.parseInt(body, 10);
    if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
    return String.fromCodePoint(code);
  });
}

/**
 * Decode one valid %XX at a time. A broken % does not stop a later %7B.
 * @param {string} value
 */
function decodePercents(value) {
  return value.replace(/%[0-9a-f]{2}|%/gi, (token) => {
    if (token.length !== 3) return token;
    try {
      return decodeURIComponent(token);
    } catch {
      return token;
    }
  });
}

export function decodeAttribute(raw) {
  let value = String(raw);
  for (let pass = 0; pass < 4; pass++) {
    const next = decodePercents(decodeHtmlEntities(value));
    if (next === value) break;
    value = next;
  }
  return value;
}

/**
 * @param {string} html
 * @param {string} label
 */
export function findAttributeIssues(html, label) {
  /** @type {string[]} */
  const issues = [];
  const markup = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  const tags = markup.match(/<\/?[a-z][\w:-]*\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    for (const attr of tag.matchAll(/[\w:-]+\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
      const decoded = decodeAttribute(attr[1] ?? attr[2] ?? attr[3] ?? '');
      let stripped = decoded;
      for (const merge of ALLOWED_MERGE_TAGS) stripped = stripped.split(merge).join('');
      if (stripped.includes('{') || stripped.includes('}')) {
        issues.push(`${label}: contains a curly brace in a link`);
        return issues;
      }
    }
  }
  return issues;
}

/**
 * Tokens that can hide in attributes or JSON-LD, which visible text drops.
 * @param {string} text
 * @param {string} label
 */
export function findHiddenIssues(text, label) {
  /** @type {string[]} */
  const issues = [];
  for (const token of ['PLAY_URL', 'APP_STORE_URL', '44.99', '4.99', ...OPEN_PLACEHOLDERS]) {
    if (containsTerm(text, token)) issues.push(`${label}: open placeholder ${token}`);
  }
  return issues;
}

/**
 * @param {string} text
 * @param {string} label
 * @param {{ braces?: boolean }} [options]
 */
export function findIssues(text, label, options = {}) {
  const braces = options.braces !== false;
  const decoded = decodeAttribute(text);
  /** @type {string[]} */
  const issues = [];
  if (braces) {
    let stripped = decoded;
    for (const tag of ALLOWED_MERGE_TAGS) stripped = stripped.split(tag).join('');
    if (stripped.includes('{') || stripped.includes('}')) {
      issues.push(`${label}: contains a curly brace`);
    }
  }
  const withoutName = decoded
    .split(ALLOWED_BRACKET)
    .join('')
    .replaceAll('<!--[if mso]>', '')
    .replaceAll('<![endif]-->');
  if (withoutName.includes('[')) {
    issues.push(`${label}: contains a square bracket`);
  }
  for (const term of BANNED) {
    if (containsTerm(decoded, term)) issues.push(`${label}: contains "${term}"`);
  }
  for (const token of OPEN_PLACEHOLDERS) {
    if (decoded.includes(token)) issues.push(`${label}: open placeholder ${token}`);
  }
  return issues;
}

/** @param {string} dir */
async function htmlFiles(dir) {
  /** @type {string[]} */
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

/** @param {string} dir */
async function collectFiles(dir) {
  /** @type {string[]} */
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await collectFiles(full)));
    else found.push(full);
  }
  return found;
}

/** @param {string} dir */
export async function findRewardPdfs(dir) {
  /** @type {string[]} */
  const found = [];
  for (const full of await collectFiles(dir)) {
    if (REWARD_PDFS.includes(path.basename(full))) found.push(full);
  }
  return found;
}

/**
 * A public PDF fails if it is a reward file by name, or if its bytes contain
 * a reward title. HTML that merely names the reward does not.
 * @param {string} dir
 */
export async function findPublicRewardIssues(dir) {
  /** @type {string[]} */
  const issues = [];
  for (const file of await collectFiles(dir)) {
    const name = path.basename(file);
    let bytes;
    try {
      bytes = await readFile(file);
    } catch {
      continue;
    }
    const named = REWARD_PDFS.includes(name);
    const pdf = named || name.toLowerCase().endsWith('.pdf') || bytes.subarray(0, 5).toString() === '%PDF-';
    if (!pdf) continue;
    const relative = path.relative(dir, file);
    if (named) issues.push(`${relative}: referral reward PDF is public`);
    const text = bytes.toString('latin1');
    for (const reward of REWARD_SOURCES) {
      if (text.includes(reward.marker)) {
        issues.push(`${relative}: referral reward PDF fails the content check`);
        break;
      }
    }
  }
  return issues;
}

/**
 * Emails 09 and 10 cannot go out until Ava's PDFs are in rewards/ and the
 * title is in the file. A missing file or a failed content check blocks both.
 * @param {string} [root]
 */
export async function rewardSourceIssues(root = REWARD_DIR) {
  /** @type {string[]} */
  const issues = [];
  const files = await collectFiles(root);
  for (const reward of REWARD_SOURCES) {
    const matches = files.filter((file) => path.basename(file) === reward.file);
    if (matches.length === 0) {
      issues.push(`${reward.email}: reward PDF ${reward.file} is missing`);
      continue;
    }
    for (const match of matches) {
      const bytes = await readFile(match);
      const text = bytes.toString('latin1');
      if (!text.startsWith('%PDF-') || !text.includes(reward.marker)) {
        issues.push(`${reward.email}: ${reward.file} fails the content check`);
      }
    }
  }
  return issues;
}

/**
 * Draft mode still expects PLAY_URL and APP_STORE_URL. Anything else blocks.
 * Launch mode blocks on every finding, including those two tokens.
 * @param {string[]} issues
 * @param {'draft' | 'launch'} [mode]
 */
export function blockingIssues(issues, mode = 'draft') {
  if (mode === 'launch') return [...issues];
  return issues.filter((issue) => !issue.includes('PLAY_URL') && !issue.includes('APP_STORE_URL'));
}

/** @param {string} distDir @param {string} emailDir */
export async function scanPublished(distDir, emailDir) {
  /** @type {string[]} */
  const issues = [];
  const pages = await htmlFiles(distDir);
  if (pages.length === 0) issues.push(`${distDir}: no HTML to scan`);
  for (const file of pages) {
    const html = await readFile(file, 'utf8');
    const label = path.relative(distDir, file);
    issues.push(...findIssues(visibleText(html), label));
    issues.push(...findHiddenIssues(html, label));
    issues.push(...findAttributeIssues(html, label));
  }
  const emails = await readdir(emailDir);
  for (const name of emails) {
    if (!name.endsWith('.html')) continue;
    const raw = await readFile(path.join(emailDir, name), 'utf8');
    issues.push(...findIssues(raw, `emails/${name}`));
    issues.push(...findHiddenIssues(raw, `emails/${name}`));
    issues.push(...findAttributeIssues(raw, `emails/${name}`));
  }
  issues.push(...(await findPublicRewardIssues(distDir)));
  const emailNames = await readdir(emailDir).catch(() => []);
  if (emailNames.includes('09-reward-3.html') || emailNames.includes('10-reward-5.html')) {
    issues.push(...(await rewardSourceIssues()));
  }
  return issues;
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const mode = process.env.HUBBLY_SCAN === 'launch' ? 'launch' : 'draft';
  const issues = await scanPublished('dist', 'src/emails');
  const blocking = blockingIssues(issues, mode);
  if (blocking.length) {
    console.error(blocking.join('\n'));
    process.exit(1);
  }
  console.log(`Pre-publish ${mode} scan passed.`);
}
