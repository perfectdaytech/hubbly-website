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
const URL_IN_TEXT = /https?:\/\/[^\s"'<>]+/gi;

export function scrubAnalyticsUrl(raw, origin = 'https://gethubbly.app') {
  if (typeof raw !== 'string' || raw === '$direct') return raw;
  const absolute = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  if (!absolute && !raw.startsWith('/')) return raw;
  try {
    const url = new URL(raw, origin);
    const strip = new Set(STRIP_PARAMS);
    for (const key of [...url.searchParams.keys()]) {
      if (strip.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

/** @param {string} value */
function scrubString(value) {
  if (!value.includes('://') && !value.includes('?') && !value.includes('&') && !value.includes('=')) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
    const scrubbed = scrubAnalyticsUrl(value);
    if (scrubbed !== value || !value.includes('://')) return scrubbed;
  }
  return value.replace(URL_IN_TEXT, (url) => scrubAnalyticsUrl(url));
}

/** @param {unknown} node */
function scrubNode(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let index = 0; index < node.length; index++) {
      const value = node[index];
      if (typeof value === 'string') node[index] = scrubString(value);
      else scrubNode(value);
    }
    return;
  }
  for (const key of Object.keys(node)) {
    const value = /** @type {Record<string, unknown>} */ (node)[key];
    if (typeof value === 'string') /** @type {Record<string, unknown>} */ (node)[key] = scrubString(value);
    else scrubNode(value);
  }
}

/** @param {{ properties?: Record<string, unknown> } | null | undefined} event */
export function scrubAnalyticsEvent(event) {
  if (!event || typeof event !== 'object') return event ?? null;
  scrubNode(event);
  for (const key of URL_KEYS) {
    const properties = event.properties;
    const value = properties?.[key];
    if (typeof value === 'string' && properties) properties[key] = scrubAnalyticsUrl(value);
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
