// Email comparison for referral fraud checks.
// Plus-tags are stripped on every domain. Dots are removed for Gmail only.

/** @param {string} email */
export function normalizeEmail(email) {
  const trimmed = String(email ?? '').trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at < 1 || at === trimmed.length - 1) return trimmed;
  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus >= 0) local = local.slice(0, plus);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') local = local.replaceAll('.', '');
  return `${local}@${domain}`;
}

/**
 * Waitlist address check. Allows letters from any script in the local part.
 * Total length follows the 254-character limit; the local part stays within 64.
 * @param {string} value
 */
export function isAcceptableEmail(value) {
  const email = String(value ?? '').trim().normalize('NFC');
  if (!email || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || local.length > 64 || !domain || domain.length > 253) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;
  if (/[<>()[\]\\,;:"]/.test(email)) return false;
  for (const label of domain.split('.')) {
    if (!label || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
  }
  return true;
}

/** @param {string} email */
export function emailDomain(email) {
  const trimmed = String(email ?? '').trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at < 1 || at === trimmed.length - 1) return '';
  return trimmed.slice(at + 1);
}
