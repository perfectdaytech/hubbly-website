// Separate from the referral tally on purpose.
// Unconfirmed contacts have not consented. Delete them after 14 days.
// This script is the only one that deletes, and only with --confirm.

import { NETWORK_PREFIX_PURGE_AT, UNCONFIRMED_RETENTION_DAYS } from './copy.mjs';

/**
 * @param {string} id
 */
export function planDeleteRequest(id) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Unexpected subscriber id');
  return { method: 'DELETE', path: `/subscribers/${id}` };
}

/**
 * @param {Array<{ id: string, status: string, subscribedAt: string }>} subscribers
 * @param {Date} [now]
 * @param {number} [days]
 */
export function selectUnconfirmedForDeletion(subscribers, now = new Date(), days = UNCONFIRMED_RETENTION_DAYS) {
  const limit = days * 24 * 60 * 60 * 1000;
  return subscribers.filter((subscriber) => {
    if (subscriber.status !== 'unconfirmed') return false;
    const subscribedAt = Date.parse(subscribedAtOf(subscriber));
    if (Number.isNaN(subscribedAt)) return false;
    return now.getTime() - subscribedAt > limit;
  });
}

/** @param {{ subscribedAt?: string, subscribed_at?: string, created_at?: string }} subscriber */
function subscribedAtOf(subscriber) {
  return subscriber.subscribedAt ?? subscriber.subscribed_at ?? subscriber.created_at ?? '';
}

/** @param {Record<string, any>} subscriber */
export function storedNetworkPrefix(subscriber) {
  const value = subscriber.ip ?? subscriber.ip_address ?? subscriber.fields?.network_prefix;
  if (value == null || value === '') return undefined;
  return String(value);
}

/** One weekly purge. The last run before the cutoff has to clear every prefix. */
export const PREFIX_PURGE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * True after 31 January 2027. The tally must not use the prefix after this.
 * @param {Date} [now]
 */
export function fraudCheckClosed(now = new Date()) {
  return now.getTime() > Date.parse(NETWORK_PREFIX_PURGE_AT);
}

/**
 * True when this weekly run is the last one that can still finish by the
 * cutoff, or the cutoff has already passed. Stored prefixes go on that run.
 * @param {Date} [now]
 */
export function weeklyPrefixPurgeDue(now = new Date()) {
  const cutoff = Date.parse(NETWORK_PREFIX_PURGE_AT);
  return now.getTime() >= cutoff || now.getTime() + PREFIX_PURGE_WEEK_MS >= cutoff;
}

/**
 * Prefixes kept only for the referral fraud check.
 * Unconfirmed ones go with the 14-day purge. Every remaining prefix goes on
 * the weekly run that falls inside the week before 31 January 2027, so none
 * are left after that date.
 * @param {Array<Record<string, any>>} subscribers
 * @param {Date} [now]
 */
export function selectStoredPrefixesForDeletion(subscribers, now = new Date()) {
  const scheduleEnded = weeklyPrefixPurgeDue(now);
  const unconfirmedIds = new Set(selectUnconfirmedForDeletion(subscribers, now).map((row) => row.id));
  return subscribers.filter((subscriber) => {
    if (!storedNetworkPrefix(subscriber)) return false;
    if (unconfirmedIds.has(subscriber.id)) return true;
    return scheduleEnded;
  });
}

/** @param {Record<string, any>} subscriber */
export function omitNetworkPrefix(subscriber) {
  const next = { ...subscriber };
  delete next.ip;
  delete next.ip_address;
  if (next.fields) {
    next.fields = { ...next.fields };
    delete next.fields.network_prefix;
  }
  return next;
}
