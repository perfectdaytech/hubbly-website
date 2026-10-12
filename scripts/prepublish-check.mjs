// Pre-publish scan of built pages and email drafts.
// Fails on placeholder tokens and retired claims. Internal notes are not scanned.

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
];

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
 * @param {string} text
 * @param {string} label
 * @param {{ braces?: boolean }} [options]
 */
export function findIssues(text, label, options = {}) {
  const braces = options.braces !== false;
  /** @type {string[]} */
  const issues = [];
  if (braces && (text.includes('{') || text.includes('}'))) {
    issues.push(`${label}: contains a curly brace`);
  }
  const lower = text.toLowerCase();
  for (const term of BANNED) {
    if (lower.includes(term.toLowerCase())) issues.push(`${label}: contains "${term}"`);
  }
  return issues;
}

/** @param {string} dir */
async function htmlFiles(dir) {
  /** @type {string[]} */
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) found.push(full);
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
    issues.push(...findIssues(visibleText(html), path.relative(distDir, file)));
  }
  const emails = await readdir(emailDir);
  for (const name of emails) {
    if (!name.endsWith('.html')) continue;
    const raw = await readFile(path.join(emailDir, name), 'utf8');
    issues.push(...findIssues(raw, `emails/${name}`));
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
