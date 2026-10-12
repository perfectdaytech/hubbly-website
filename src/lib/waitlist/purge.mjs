// Separate from the referral tally on purpose.
// Unconfirmed contacts have not consented. Delete them after 14 days.
// This script is the only one that deletes, and only with --confirm.

import { UNCONFIRMED_RETENTION_DAYS } from './copy.mjs';

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
    const subscribedAt = Date.parse(subscriber.subscribedAt);
    if (Number.isNaN(subscribedAt)) return false;
    return now.getTime() - subscribedAt > limit;
  });
}
