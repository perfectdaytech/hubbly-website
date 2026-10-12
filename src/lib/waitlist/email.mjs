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

/** @param {string} email */
export function emailDomain(email) {
  const trimmed = String(email ?? '').trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at < 1 || at === trimmed.length - 1) return '';
  return trimmed.slice(at + 1);
}
