// Disposable inboxes we will not count as referrals.
// This is a guard, not a promise that every throwaway domain is listed.

import { emailDomain } from './email.mjs';

const DISPOSABLE = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.de',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'minutemail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.de',
  'getnada.com',
  'nada.email',
  'dispostable.com',
  'mailnesia.com',
  'maildrop.cc',
  'fakeinbox.com',
  'throwawaymail.com',
  'tempail.com',
  'moakt.com',
  'emailondeck.com',
  'mailcatch.com',
  'mintemail.com',
  'mytemp.email',
  'tmpmail.org',
  'tmpmail.net',
  'discard.email',
  'discardmail.com',
  'spamgourmet.com',
  'mailnull.com',
  'getairmail.com',
  'inboxkitten.com',
  'burnermail.io',
]);

/** @param {string} email */
export function isDisposableEmail(email) {
  const domain = emailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE.has(domain)) return true;
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    if (DISPOSABLE.has(parts.slice(i).join('.'))) return true;
  }
  return false;
}
