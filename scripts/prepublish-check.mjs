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
  const tags = html.match(/<[^>]+>/g) ?? [];
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
export async function findRewardPdfs(dir) {
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
    if (entry.isDirectory()) found.push(...(await findRewardPdfs(full)));
    else if (REWARD_PDFS.includes(entry.name)) found.push(full);
  }
  return found;
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
  for (const file of await findRewardPdfs(distDir)) {
    issues.push(`${path.relative(distDir, file)}: referral reward PDF is public`);
  }
  return issues;
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const issues = await scanPublished('dist', 'src/emails');
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exit(1);
  }
  console.log('Pre-publish scan passed.');
}
