// Local MailerLite exports contain full IP addresses.
// The tally removes the file it just read. The weekly run inside the week
// before 31 January 2027 removes every export that is still on disk.

import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { weeklyPrefixPurgeDue } from './purge.mjs';

const KEEP = new Set(['referral-report.json', 'purge-log.json']);

/** @param {string} name */
function isExportName(name) {
  if (KEEP.has(name)) return false;
  const lower = name.toLowerCase();
  return lower.endsWith('.csv') || lower.endsWith('.json') || lower.includes('export') || lower.includes('subscriber');
}

/** @param {string} file @param {string[]} removed */
async function drop(file, removed) {
  try {
    await unlink(file);
    removed.push(file);
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
  }
}

/**
 * @param {{ exportPath?: string, now?: Date, dirs?: string[] }} [options]
 */
export async function removeLocalExports(options = {}) {
  const now = options.now ?? new Date();
  const dirs = options.dirs ?? ['data', 'exports'];
  /** @type {string[]} */
  const removed = [];
  if (options.exportPath) await drop(options.exportPath, removed);
  if (!weeklyPrefixPurgeDue(now)) return removed;

  for (const dir of dirs) {
    let entries;
    try {
      entries = await readdir(dir);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
      throw error;
    }
    for (const name of entries) {
      if (!isExportName(name)) continue;
      const full = path.join(dir, name);
      if (options.exportPath && path.resolve(full) === path.resolve(options.exportPath)) continue;
      await drop(full, removed);
    }
  }
  return removed;
}
