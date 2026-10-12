// PostHog payloads for the waitlist. No email, name, ref code or referred_by value.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const STORES = new Set(['google_play', 'app_store', 'both']);
const ERRORS = new Set(['missing_email', 'invalid_email', 'missing_store', 'missing_age', 'honeypot']);
const URL_KEYS = ['$current_url', '$referrer', '$initial_current_url', '$initial_referrer'];
const STRIP_PARAMS = ['ref', 'code', 'referred_by', 'email', 'name'];

/**
 * @param {string} raw
 * @param {string} [origin]
 */
export function scrubAnalyticsUrl(raw, origin = 'https://gethubbly.app') {
  try {
    const url = new URL(raw, origin);
    for (const key of STRIP_PARAMS) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return raw;
  }
}

/** @param {{ properties?: Record<string, unknown> } | null | undefined} event */
export function scrubAnalyticsEvent(event) {
  if (!event?.properties) return event ?? null;
  for (const key of URL_KEYS) {
    const value = event.properties[key];
    if (typeof value === 'string') event.properties[key] = scrubAnalyticsUrl(value);
  }
  return event;
}

/** @param {string | null | undefined} channel */
export function shareClickProps(channel) {
  if (channel === 'copy' || channel === 'share') return { channel };
  return null;
}

/** @param {string | null | undefined} reason */
export function errorProps(reason) {
  if (reason && ERRORS.has(reason)) return { reason };
  return null;
}

/**
 * @param {{ storePref: string, betaOptin: boolean, hasReferrer: boolean, search?: string }} input
 */
export function buildWaitlistSubmitProps(input) {
  /** @type {Record<string, string | boolean>} */
  const props = {
    store_pref: STORES.has(input.storePref) ? input.storePref : 'unknown',
    beta_optin: Boolean(input.betaOptin),
    has_referrer: Boolean(input.hasReferrer),
  };
  const params = new URLSearchParams(input.search || '');
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) props[key] = value.slice(0, 80);
  }
  return props;
}
