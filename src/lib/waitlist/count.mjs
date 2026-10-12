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
 * Network prefix the referral check may keep: IPv4 /24 or IPv6 /64.
 * The full address is not returned. Callers drop the raw value after this.
 * @param {string | undefined | null} ip
 * @returns {string | undefined}
 */
export function networkKey(ip) {
  if (!ip) return undefined;
  let raw = String(ip).trim().toLowerCase();
  const zone = raw.indexOf('%');
  if (zone !== -1) raw = raw.slice(0, zone);
  const dotted = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) raw = dotted[1];
  if (raw.includes(':')) {
    const groups = expandIpv6(raw);
    if (!groups) return undefined;
    return `v6:${groups.slice(0, 4).join(':')}`;
  }
  const parts = raw.split('.');
  if (parts.length !== 4) return undefined;
  if (!parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return undefined;
  return `v4:${parts.slice(0, 3).join('.')}`;
}

/** @param {string} raw */
function expandIpv6(raw) {
  if (raw.includes('.')) return null;
  const halves = raw.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 ? (halves[1] ? halves[1].split(':') : []) : [];
  if ([...head, ...tail].some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  if (halves.length === 1) {
    if (head.length !== 8) return null;
    return head.map((group) => group.padStart(4, '0'));
  }
  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;
  return [...head, ...Array(missing).fill('0000'), ...tail].map((group) => group.padStart(4, '0'));
}

/**
 * A confirmed subscriber still counts after the deadline if they only
 * unsubscribe once referrals have closed. An unsubscribe on or before the
 * deadline, or one with no time, does not count.
 * @param {{ status: string, confirmedAt?: string, unsubscribedAt?: string }} subscriber
 * @param {number} deadline
 * @returns {string | null}
 */
export function referralStatusReason(subscriber, deadline) {
  const confirmedAt = Date.parse(subscriber.confirmedAt ?? '');
  if (subscriber.status === 'confirmed') {
    if (Number.isNaN(confirmedAt)) return 'missing_confirmation_time';
    if (confirmedAt > deadline) return 'after_deadline';
    return null;
  }
  if (subscriber.status === 'unsubscribed') {
    const unsubscribedAt = Date.parse(subscriber.unsubscribedAt ?? '');
    if (Number.isNaN(unsubscribedAt) || unsubscribedAt <= deadline) return 'unsubscribed';
    if (Number.isNaN(confirmedAt)) return 'missing_confirmation_time';
    if (confirmedAt > deadline) return 'after_deadline';
    return null;
  }
  return 'unconfirmed';
}

/**
 * @param {{ status: string, unsubscribedAt?: string }} subscriber
 * @param {number} deadline
 */
function ownsReferralCode(subscriber, deadline) {
  if (subscriber.status === 'confirmed') return true;
  if (subscriber.status !== 'unsubscribed') return false;
  const unsubscribedAt = Date.parse(subscriber.unsubscribedAt ?? '');
  return !Number.isNaN(unsubscribedAt) && unsubscribedAt > deadline;
}

/**
 * @param {Array<{ id: string, ip?: string, subscribedAt: string }>} subscribers
 * @returns {Set<string>}
 */
export function burstFlaggedIds(subscribers) {
  const flagged = new Set();
  /** @type {Map<string, Array<{ id: string, subscribedAt: string }>>} */
  const byIp = new Map();
  for (const subscriber of subscribers) {
    const key = networkKey(subscriber.ip);
    if (!key) continue;
    const list = byIp.get(key) ?? [];
    list.push(subscriber);
    byIp.set(key, list);
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
 *   unsubscribedAt?: string,
 *   ip?: string,
 *   fields?: { ref_code?: string, referred_by?: string, referral_count?: number|string }
 * }>} subscribers
 * @param {{
 *   approveRewards?: boolean,
 *   approveBurst?: boolean,
 *   deadline?: string,
 *   flagAt?: number,
 * }} [options]
 */
export function tally(subscribers, options = {}) {
  const deadline = Date.parse(options.deadline ?? REFERRAL_DEADLINE_ISO);
  const flagAt = options.flagAt ?? SUBSCRIBER_FLAG_AT;
  const approveRewards = Boolean(options.approveRewards);
  const approveBurst = Boolean(options.approveBurst);

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
    if (!ownsReferralCode(subscriber, deadline)) continue;
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
  /** @type {Array<{ id: string, referrerId: string | null }>} */
  const burstHeld = [];
  /** @type {Map<string, number>} */
  const counts = new Map();

  for (const subscriber of subscribers) {
    const reasons = [];
    const referredBy = String(subscriber.fields?.referred_by ?? '').trim();
    const referrer = isValidRefCode(referredBy) ? byCode.get(referredBy) : undefined;

    const statusReason = referralStatusReason(subscriber, deadline);
    if (statusReason) reasons.push(statusReason);
    if (!isValidRefCode(referredBy)) reasons.push('invalid_referrer');
    else if (!referrer) reasons.push(collisions.includes(referredBy) ? 'code_collision' : 'unknown_referrer');
    if (duplicateEmails.has(normalizeEmail(subscriber.email))) reasons.push('duplicate');
    if (isDisposableEmail(subscriber.email)) reasons.push('disposable');
    if (referrer && normalizeEmail(referrer.email) === normalizeEmail(subscriber.email)) {
      reasons.push('self');
    }

    if (reasons.length > 0) {
      if (referredBy) rejected.push({ id: subscriber.id, reasons });
      continue;
    }

    if (burst.has(subscriber.id) && !approveBurst) {
      burstHeld.push({ id: subscriber.id, referrerId: referrer ? referrer.id : null });
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
    burstHeld,
    collisions,
    warning,
    total,
    counted: [...counts.values()].reduce((sum, n) => sum + n, 0),
  };
}
