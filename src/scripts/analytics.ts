// ============================================================
// Cookieless, anonymous analytics (PostHog EU). Inert unless a
// PUBLIC_POSTHOG_KEY is provided at build time (set in the deploy
// workflow), so local/dev builds collect nothing.
//
// Privacy posture — keep this in lockstep with /privacy §12 and
// /cookies: memory-only persistence (nothing stored on the
// visitor's device, no cookies, no localStorage), no session
// recordings, no surveys, Do Not Track honoured, EU ingestion.
// The PostHog project is additionally configured server-side to
// discard client IP addresses at ingestion.
// ============================================================
import {
  buildWaitlistSubmitProps,
  errorProps,
  scrubAnalyticsEvent,
  shareClickProps,
} from '../lib/waitlist/analytics.mjs';

const key = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;

// Lazy: posthog-js is its own chunk, fetched only when a key exists and
// the page is idle, so it never competes with first paint (and key-less
// dev builds never download it at all).
async function start(): Promise<void> {
  if (!key) return;
  const { default: posthog } = await import('posthog-js');

  posthog.init(key, {
    api_host: (import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) || 'https://eu.i.posthog.com',
    ui_host: 'https://eu.posthog.com',
    // Nothing persisted on the device: no cookies, no localStorage.
    persistence: 'memory',
    // Anonymous events only - we never call identify(), so no person
    // profiles are created.
    person_profiles: 'identified_only',
    capture_pageview: true,
    // Pageleave carries scroll depth for the page being left.
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: true,
    disable_surveys: true,
    respect_dnt: true,
    before_send: (event) => {
      if (!event) return null;
      scrubAnalyticsEvent(event);
      return event;
    },
  });

  // ---- Named events ---------------------------------------------------
  // Elements opt in via data-analytics="event_name" (+ optional
  // data-platform / data-live props). Delegated so it survives any
  // future DOM changes.
  document.addEventListener('click', (ev) => {
    const target = ev.target as Element | null;
    if (!target) return;

    const tagged = target.closest('[data-analytics]');
    if (tagged) {
      const name = tagged.getAttribute('data-analytics')!;
      if (name === 'waitlist_share_click') {
        const props = shareClickProps(tagged.getAttribute('data-channel'));
        if (props) posthog.capture(name, props);
      } else if (name === 'waitlist_view' || name === 'waitlist_confirm_page_view') {
        posthog.capture(name, {});
      } else {
        const props: Record<string, string> = {};
        const platform = tagged.getAttribute('data-platform');
        const live = tagged.getAttribute('data-live');
        if (platform) props.platform = platform;
        if (live) props.live = live;
        posthog.capture(name, props);
      }
    }

    // Outbound links (socials, store links once live) by destination domain.
    const link = target.closest('a[href]') as HTMLAnchorElement | null;
    if (link) {
      try {
        const url = new URL(link.href, location.href);
        if (url.protocol.startsWith('http') && url.origin !== location.origin) {
          posthog.capture('outbound_click', { domain: url.hostname });
        }
      } catch {
        /* unparseable href - ignore */
      }
    }
  });

  // FAQ opens: which questions visitors actually care about. `toggle`
  // doesn't bubble, so listen in the capture phase.
  document.addEventListener(
    'toggle',
    (ev) => {
      const details = ev.target as HTMLDetailsElement | null;
      if (details?.tagName === 'DETAILS' && details.classList.contains('faq') && details.open) {
        const question = details.querySelector('summary span')?.textContent?.trim();
        if (question) posthog.capture('faq_expanded', { question });
      }
    },
    true,
  );

  document.querySelectorAll('[data-analytics-view]').forEach((el) => {
    const name = el.getAttribute('data-analytics-view');
    if (name === 'waitlist_view' || name === 'waitlist_confirm_page_view') {
      posthog.capture(name, {});
    }
  });

  const capture = (payload: {
    name?: string;
    store_pref?: string;
    beta_optin?: boolean;
    has_referrer?: boolean;
    reason?: string;
    search?: string;
  }) => {
    if (payload.name === 'waitlist_submit') {
      posthog.capture(
        'waitlist_submit',
        buildWaitlistSubmitProps({
          storePref: payload.store_pref || '',
          betaOptin: Boolean(payload.beta_optin),
          hasReferrer: Boolean(payload.has_referrer),
          search: payload.search || '',
        }),
      );
    } else if (payload.name === 'waitlist_error') {
      const props = errorProps(payload.reason);
      if (props) posthog.capture('waitlist_error', props);
    } else if (payload.name === 'waitlist_view' || payload.name === 'waitlist_confirm_page_view') {
      posthog.capture(payload.name, {});
    }
  };

  const bridge = window as Window & {
    __hubblyCapture?: typeof capture;
    __hubblyQueue?: Array<Parameters<typeof capture>[0]>;
  };
  bridge.__hubblyCapture = capture;
  for (const payload of bridge.__hubblyQueue ?? []) capture(payload);
  bridge.__hubblyQueue = [];
}

if (key) {
  const urgent = document.querySelector('[data-analytics-view], [data-waitlist-form]');
  if (urgent) {
    void start();
  } else if ('requestIdleCallback' in window) {
    requestIdleCallback(() => void start(), { timeout: 3000 });
  } else {
    setTimeout(() => void start(), 1500);
  }
}
