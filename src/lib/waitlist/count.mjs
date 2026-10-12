// Weekly referral tally.
// Reads an export and decides each referrer's referral_count.
// It does not create, edit or delete subscribers, and it does not send email.
// The only value it asks the caller to write is referral_count.

import { isValidRefCode } from './codes.mjs';
import { REFERRAL_DEADLINE_ISO, REWARD_REVIEW_AT, SUBSCRIBER_FLAG_AT } from './copy.mjs';
import { isDisposableEmail } from './disposable.mjs';
import { normalizeEmail } from './email.mjs';

export const BURST_WINDOW_MS = 60 * 60 * 1000;
export const BURST_COUNT = 3;

/**
 * @param {Array<{ id: string, ip?: string, subscribedAt: string }>} subscribers
 * @returns {Set<string>}
 */
export function burstFlaggedIds(subscribers) {
  const flagged = new Set();
  /** @type {Map<string, Array<{ id: string, subscribedAt: string }>>} */
  const byIp = new Map();
  for (const subscriber of subscribers) {
    if (!subscriber.ip) continue;
    const list = byIp.get(subscriber.ip) ?? [];
    list.push(subscriber);
    byIp.set(subscriber.ip, list);
  }
  for (const list of byIp.values()) {
    const sorted = list.slice().sort((a, b) => Date.parse(a.subscribedAt) - Date.parse(b.subscribedAt));
    for (let i = 0; i < sorted.length; i++) {
      const start = Date.parse(sorted[i].subscribedAt);
      if (Number.isNaN(start)) continue;
      const window = [];
      for (let j = i; j < sorted.length; j++) {
        const at = Date.parse(sorted[j].subscribedAt);
        if (Number.isNaN(at)) continue;
        if (at - start > BURST_WINDOW_MS) break;
        window.push(sorted[j]);
      }
      if (window.length >= BURST_COUNT) {
        for (const item of window) flagged.add(item.id);
      }
    }
  }
  return flagged;
}

/**
 * @param {Array<{
 *   id: string,
 *   email: string,
 *   status: string,
 *   subscribedAt: string,
 *   confirmedAt?: string,
 *   ip?: string,
 *   fields?: { ref_code?: string, referred_by?: string, referral_count?: number|string }
 * }>} subscribers
 * @param {{
 *   approveRewards?: boolean,
 *   deadline?: string,
 *   flagAt?: number,
 * }} [options]
 */
export function tally(subscribers, options = {}) {
  const deadline = Date.parse(options.deadline ?? REFERRAL_DEADLINE_ISO);
  const flagAt = options.flagAt ?? SUBSCRIBER_FLAG_AT;
  const approveRewards = Boolean(options.approveRewards);

  /** @type {Map<string, typeof subscribers>} */
  const byEmail = new Map();
  for (const subscriber of subscribers) {
    const key = normalizeEmail(subscriber.email);
    const list = byEmail.get(key) ?? [];
    list.push(subscriber);
    byEmail.set(key, list);
  }
  const duplicateEmails = new Set();
  for (const [key, list] of byEmail) {
    if (list.length > 1) duplicateEmails.add(key);
  }

  /** @type {Map<string, typeof subscribers>} */
  const codeOwners = new Map();
  for (const subscriber of subscribers) {
    if (subscriber.status !== 'confirmed') continue;
    const code = String(subscriber.fields?.ref_code ?? '').trim();
    if (!isValidRefCode(code)) continue;
    const list = codeOwners.get(code) ?? [];
    list.push(subscriber);
    codeOwners.set(code, list);
  }
  /** @type {Map<string, (typeof subscribers)[number]>} */
  const byCode = new Map();
  /** @type {string[]} */
  const collisions = [];
  for (const [code, list] of codeOwners) {
    if (list.length === 1) byCode.set(code, list[0]);
    else collisions.push(code);
  }

  const burst = burstFlaggedIds(subscribers);
  /** @type {Array<{ id: string, reasons: string[] }>} */
  const rejected = [];
  /** @type {Map<string, number>} */
  const counts = new Map();

  for (const subscriber of subscribers) {
    const reasons = [];
    const referredBy = String(subscriber.fields?.referred_by ?? '').trim();
    const referrer = isValidRefCode(referredBy) ? byCode.get(referredBy) : undefined;

    if (subscriber.status !== 'confirmed') reasons.push('unconfirmed');
    if (!isValidRefCode(referredBy)) reasons.push('invalid_referrer');
    else if (!referrer) reasons.push(collisions.includes(referredBy) ? 'code_collision' : 'unknown_referrer');
    if (duplicateEmails.has(normalizeEmail(subscriber.email))) reasons.push('duplicate');
    if (isDisposableEmail(subscriber.email)) reasons.push('disposable');
    if (burst.has(subscriber.id)) reasons.push('burst');
    if (subscriber.status === 'confirmed') {
      const confirmedAt = Date.parse(subscriber.confirmedAt ?? '');
      if (Number.isNaN(confirmedAt)) reasons.push('missing_confirmation_time');
      else if (confirmedAt > deadline) reasons.push('after_deadline');
    }
    if (referrer && normalizeEmail(referrer.email) === normalizeEmail(subscriber.email)) {
      reasons.push('self');
    }

    if (reasons.length > 0) {
      if (referredBy) rejected.push({ id: subscriber.id, reasons });
      continue;
    }

    const next = (counts.get(referrer.id) ?? 0) + 1;
    counts.set(referrer.id, next);
  }

  /** @type {Array<{ id: string, referral_count: number }>} */
  const writes = [];
  /** @type {Array<{ id: string, count: number, written: number }>} */
  const heldForReview = [];

  for (const referrer of byCode.values()) {
    const count = counts.get(referrer.id) ?? 0;
    let written = count;
    if (count >= REWARD_REVIEW_AT && !approveRewards) {
      written = REWARD_REVIEW_AT - 1;
      heldForReview.push({ id: referrer.id, count, written });
    }
    const current = Number(referrer.fields?.referral_count ?? 0);
    if (written !== current) {
      writes.push({ id: referrer.id, referral_count: written });
    }
  }

  const total = subscribers.length;
  const warning =
    total >= flagAt
      ? `MailerLite Free plan flag: ${total} subscribers including unconfirmed contacts. Tell the owner near 200, before the 250 cap. Do not start a paid plan without the owner's OK.`
      : null;

  return {
    writes,
    rejected,
    heldForReview,
    collisions,
    warning,
    total,
    counted: [...counts.values()].reduce((sum, n) => sum + n, 0),
  };
}
