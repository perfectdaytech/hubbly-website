import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildWaitlistSubmitProps,
  errorProps,
  scrubAnalyticsEvent,
  scrubAnalyticsUrl,
  shareClickProps,
} from '../src/lib/waitlist/analytics.mjs';
import { REF_ALPHABET, generateRefCode, isValidRefCode } from '../src/lib/waitlist/codes.mjs';
import { burstFlaggedIds, networkKey, tally } from '../src/lib/waitlist/count.mjs';
import {
  CHECKBOX_AGE,
  CHECKBOX_BETA,
  CHECKBOX_TIPS,
  CONFIRM_BODY,
  CONFIRM_SUBJECT,
  FORM_STATEMENT,
  FORM_VERSION,
  GIFT_LINE,
  REFERRAL_TERMS,
  SHARE_TEXT,
  TRIAL_SHORT,
  WAITLIST_NO_PLACE,
} from '../src/lib/waitlist/copy.mjs';
import { isAcceptableEmail, normalizeEmail } from '../src/lib/waitlist/email.mjs';
import { removeLocalExports } from '../src/lib/waitlist/exports.mjs';
import { buildReferralCountBody, mapSubscriber, planReferralCountRequest } from '../src/lib/waitlist/mailerlite.mjs';
import {
  omitNetworkPrefix,
  selectStoredPrefixesForDeletion,
  selectUnconfirmedForDeletion,
} from '../src/lib/waitlist/purge.mjs';
import { findAttributeIssues, findIssues } from '../scripts/prepublish-check.mjs';

function subscriber(overrides = {}) {
  const fields = { ref_code: '', referred_by: '', referral_count: 0, ...(overrides.fields ?? {}) };
  return {
    id: 's',
    email: 'person@example.com',
    status: 'confirmed',
    subscribedAt: '2026-11-01T10:00:00.000Z',
    confirmedAt: '2026-11-01T10:05:00.000Z',
    ip: '203.0.113.10',
    ...overrides,
    fields,
  };
}

test('referral codes are random, url-safe and free of look-alikes', () => {
  const codes = new Set();
  for (let i = 0; i < 40; i++) codes.add(generateRefCode());
  assert.ok(codes.size > 30);
  for (const code of codes) {
    assert.equal(isValidRefCode(code), true);
    assert.equal(code.length, 8);
    assert.equal(/[0O1IL]/.test(code), false);
  }
  const source = readFileSync(new URL('../src/lib/waitlist/codes.mjs', import.meta.url), 'utf8');
  assert.match(source, /crypto\.getRandomValues/);
  assert.equal(source.includes('email'), false);
  assert.equal(source.includes('subscriber'), false);
});

test('the page script uses the same alphabet and does not store anything', () => {
  const script = readFileSync(new URL('../src/scripts/waitlist-inline.js', import.meta.url), 'utf8');
  assert.ok(script.includes(REF_ALPHABET));
  assert.ok(script.includes(SHARE_TEXT));
  assert.ok(script.includes('crypto.getRandomValues'));
  for (const banned of ['localStorage', 'sessionStorage', 'document.cookie', 'indexedDB']) {
    assert.equal(script.includes(banned), false, banned);
  }
  assert.equal(script.includes('has_referrer'), true);
  assert.equal(script.includes('toUpperCase()'), true);
  assert.equal(script.includes('submitting'), true);
  assert.equal(script.includes('.disabled = true'), true);
  assert.equal(script.includes('length > 254'), true);
  assert.equal(script.includes('Check your email address, it looks incomplete.'), true);
  assert.equal(script.includes('#waitlist-email'), true);
  assert.equal(script.includes('input[type="email"]'), false);
  assert.equal(script.includes('referred_by:'), false);
  assert.equal(script.includes("Please choose one option to continue."), true);
  assert.equal(script.includes("Please tick this box to continue."), true);
});

test('email aliases collapse for self-referral checks', () => {
  assert.equal(normalizeEmail('Jane.Doe+hub@gmail.com'), 'janedoe@gmail.com');
  assert.equal(normalizeEmail('jane.doe@googlemail.com'), 'janedoe@gmail.com');
  assert.equal(normalizeEmail('Keep.Dots+x@outlook.com'), 'keep.dots@outlook.com');
});

test('only a confirmed, non-fraud referral increases the count', () => {
  const referrer = subscriber({
    id: 'referrer',
    email: 'jane.doe@gmail.com',
    fields: { ref_code: 'ABCDEFGH' },
  });
  const good = subscriber({
    id: 'good',
    email: 'friend@example.com',
    ip: '192.0.2.20',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const unconfirmed = subscriber({
    id: 'pending-consent',
    email: 'later@example.com',
    status: 'unconfirmed',
    confirmedAt: undefined,
    ip: '192.0.2.21',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const self = subscriber({
    id: 'self',
    email: 'janedoe+list@gmail.com',
    ip: '198.51.100.22',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const duplicateA = subscriber({
    id: 'dup-a',
    email: 'Pat.Smith+a@outlook.com',
    ip: '198.51.100.2',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const duplicateB = subscriber({
    id: 'dup-b',
    email: 'pat.smith@outlook.com',
    ip: '198.51.100.3',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const disposable = subscriber({
    id: 'trash',
    email: 'bot@mailinator.com',
    ip: '198.51.100.4',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const late = subscriber({
    id: 'late',
    email: 'late@example.com',
    confirmedAt: '2027-01-01T00:00:00.000Z',
    ip: '198.51.100.5',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const result = tally([referrer, good, unconfirmed, self, duplicateA, duplicateB, disposable, late]);
  assert.equal(result.counted, 1);
  assert.deepEqual(result.writes, [{ id: 'referrer', referral_count: 1 }]);
  const reasons = Object.fromEntries(result.rejected.map((row) => [row.id, row.reasons]));
  assert.ok(reasons.self.includes('self'));
  assert.ok(reasons['dup-a'].includes('duplicate'));
  assert.ok(reasons.trash.includes('disposable'));
  assert.ok(reasons.late.includes('after_deadline'));
  assert.ok(reasons['pending-consent'].includes('unconfirmed'));
});

test('a burst from one address is held for a hand check', () => {
  const referrer = subscriber({ id: 'referrer', email: 'owner@example.com', fields: { ref_code: 'ABCDEFGH' } });
  const burst = [1, 2, 3].map((n) =>
    subscriber({
      id: `burst-${n}`,
      email: `burst${n}@example.com`,
      subscribedAt: `2026-11-02T10:0${n}:00.000Z`,
      confirmedAt: `2026-11-02T10:0${n}:00.000Z`,
      ip: '203.0.113.50',
      fields: { referred_by: 'ABCDEFGH' },
    }),
  );
  const held = tally([referrer, ...burst]);
  assert.equal(held.counted, 0);
  assert.equal(held.rejected.length, 0);
  assert.equal(held.burstHeld.length, 3);
  const approved = tally([referrer, ...burst], { approveBurst: true });
  assert.equal(approved.counted, 3);
  assert.equal(approved.burstHeld.length, 0);
});

test('only an unsubscribe before the deadline stops a referral counting', () => {
  const referrer = subscriber({ id: 'referrer', email: 'owner@example.com', fields: { ref_code: 'ABCDEFGH' } });
  const early = subscriber({
    id: 'early',
    email: 'early@example.com',
    status: 'unsubscribed',
    unsubscribedAt: '2026-12-01T12:00:00.000Z',
    ip: '198.51.100.40',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const unknownTime = subscriber({
    id: 'unknown-time',
    email: 'unknown@example.com',
    status: 'unsubscribed',
    ip: '198.51.101.40',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const after = subscriber({
    id: 'after',
    email: 'after@example.com',
    status: 'unsubscribed',
    confirmedAt: '2026-11-01T10:05:00.000Z',
    unsubscribedAt: '2027-01-05T00:00:00.000Z',
    ip: '198.51.102.40',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const dropped = tally([referrer, early, unknownTime]);
  assert.equal(dropped.counted, 0);
  assert.ok(dropped.rejected.some((row) => row.id === 'early'));
  assert.ok(dropped.rejected.some((row) => row.id === 'unknown-time'));
  const kept = tally([referrer, after]);
  assert.equal(kept.counted, 1);
  assert.deepEqual(kept.writes, [{ id: 'referrer', referral_count: 1 }]);
});

test('five referrals stay at 4 until the hand check', () => {
  const referrer = subscriber({ id: 'referrer', email: 'owner@example.com', fields: { ref_code: 'ABCDEFGH' } });
  const friends = [1, 2, 3, 4, 5].map((n) =>
    subscriber({
      id: `f${n}`,
      email: `friend${n}@example.com`,
      ip: `198.51.${100 + n}.8`,
      fields: { referred_by: 'ABCDEFGH' },
    }),
  );
  const held = tally([referrer, ...friends]);
  assert.equal(held.writes[0].referral_count, 4);
  assert.equal(held.heldForReview.length, 1);
  const approved = tally([referrer, ...friends], { approveRewards: true });
  assert.equal(approved.writes[0].referral_count, 5);
  assert.equal(approved.heldForReview.length, 0);
});

test('the same network is an IPv4 /24 or an IPv6 /64, and the full address is not kept', () => {
  const referrer = subscriber({ id: 'referrer', email: 'owner@example.com', ip: '203.0.113.10', fields: { ref_code: 'ABCDEFGH' } });
  const v4 = [1, 2, 3].map((n) =>
    subscriber({
      id: `v4-${n}`,
      email: `v4${n}@example.com`,
      subscribedAt: `2026-11-02T10:0${n}:00.000Z`,
      confirmedAt: `2026-11-02T10:0${n}:00.000Z`,
      ip: `5.5.5.${n}`,
      fields: { referred_by: 'ABCDEFGH' },
    }),
  );
  const v6 = ['1a', '2a', '3a'].map((suffix, index) =>
    subscriber({
      id: `v6-${suffix}`,
      email: `v6${suffix}@example.com`,
      subscribedAt: `2026-11-03T10:0${index + 1}:00.000Z`,
      confirmedAt: `2026-11-03T10:0${index + 1}:00.000Z`,
      ip: `2a00:23c4:1:2::${suffix}`,
      fields: { referred_by: 'ABCDEFGH' },
    }),
  );
  const separate = [1, 2, 3].map((n) =>
    subscriber({
      id: `sep-${n}`,
      email: `sep${n}@example.com`,
      subscribedAt: `2026-11-04T10:0${n}:00.000Z`,
      confirmedAt: `2026-11-04T10:0${n}:00.000Z`,
      ip: `2a00:23c4:${n}:9::1`,
      fields: { referred_by: 'ABCDEFGH' },
    }),
  );
  assert.equal(tally([referrer, ...v4]).burstHeld.length, 3);
  assert.equal(tally([referrer, ...v6]).burstHeld.length, 3);
  assert.equal(tally([referrer, ...separate]).counted, 3);
  assert.equal(networkKey('5.5.5.1'), 'v4:5.5.5');
  assert.equal(networkKey('5.5.5.1') === '5.5.5.1', false);
  assert.equal(networkKey('::ffff:5.5.5.9'), 'v4:5.5.5');
  assert.equal(networkKey('2a00:23c4:1:2::1a'), networkKey('2a00:23c4:1:2::3a'));
  const mapped = mapSubscriber({
    id: '1',
    email: 'a@example.com',
    status: 'unsubscribed',
    subscribed_at: '2026-11-01T10:00:00.000Z',
    opted_in_at: '2026-11-01T10:05:00.000Z',
    unsubscribed_at: '2027-01-05T00:00:00.000Z',
    ip_address: '2a00:23c4:1:2::1a',
    fields: {},
  });
  assert.equal(mapped.ip, 'v6:2a00:23c4:0001:0002');
  assert.equal(mapped.unsubscribedAt, '2027-01-05T00:00:00.000Z');
  assert.equal(JSON.stringify(mapped).includes('::1a'), false);
  const report = JSON.stringify({ writes: [], burstHeld: [{ id: 'v4-1', referrerId: 'referrer' }] });
  assert.equal(report.includes('5.5.5.1'), false);
  assert.equal(networkKey('v4:5.5.5'), 'v4:5.5.5');
  assert.equal(networkKey('v6:2a00:23c4:0001:0002'), 'v6:2a00:23c4:0001:0002');
  assert.equal(networkKey(networkKey('5.5.5.9')), 'v4:5.5.5');
  assert.equal(networkKey(networkKey('2a00:23c4:1:2::1a')), 'v6:2a00:23c4:0001:0002');
});

test('three mapped sign-ups from one IP are flagged and held', () => {
  const referrer = mapSubscriber({
    id: 'referrer',
    email: 'owner@example.com',
    status: 'active',
    subscribed_at: '2026-11-01T10:00:00.000Z',
    opted_in_at: '2026-11-01T10:05:00.000Z',
    ip_address: '203.0.113.10',
    fields: { ref_code: 'ABCDEFGH' },
  });
  const friends = [1, 2, 3].map((n) =>
    mapSubscriber({
      id: `burst-${n}`,
      email: `burst${n}@example.com`,
      status: 'active',
      subscribed_at: `2026-11-03T10:0${n}:00.000Z`,
      opted_in_at: `2026-11-03T10:0${n}:00.000Z`,
      ip_address: '5.5.5.9',
      fields: { referred_by: 'ABCDEFGH' },
    }),
  );
  const flagged = burstFlaggedIds(friends);
  assert.equal(flagged.size, 3);
  for (const friend of friends) assert.equal(flagged.has(friend.id), true);
  const people = [referrer, ...friends];
  const before = JSON.stringify(people);
  const result = tally(people);
  assert.equal(JSON.stringify(people), before);
  assert.equal(result.burstHeld.length, 3);
  assert.equal(result.counted, 0);
  assert.equal(JSON.stringify(result).includes('v4:'), false);
  const later = tally(JSON.parse(before), { now: '2027-02-01T00:00:00.000Z' });
  assert.equal(later.burstHeld.length, 0);
  assert.equal(later.counted, 3);
  assert.equal(JSON.stringify(later).includes('v4:'), false);
});

test('the free-plan flag counts unconfirmed contacts and does not buy anything', () => {
  const people = Array.from({ length: 200 }, (_, index) =>
    subscriber({
      id: `p${index}`,
      email: `p${index}@example.com`,
      status: index < 50 ? 'unconfirmed' : 'confirmed',
    }),
  );
  const flagged = tally(people);
  assert.match(flagged.warning, /200 subscribers including unconfirmed/);
  assert.match(flagged.warning, /Do not start a paid plan/);
  assert.equal(tally(people.slice(0, 199)).warning, null);
});

test('the only MailerLite write body is referral_count', () => {
  const body = buildReferralCountBody(3);
  assert.deepEqual(body, { fields: { referral_count: 3 } });
  assert.deepEqual(JSON.parse(JSON.stringify(planReferralCountRequest('abc123', 3).body)), body);
  const tallySource = readFileSync(new URL('../scripts/referral-count.mjs', import.meta.url), 'utf8');
  assert.equal(tallySource.includes('setReferralCount'), true);
  assert.equal(tallySource.includes('DELETE'), false);
  assert.equal(tallySource.includes('planDeleteRequest'), false);
  const countSource = readFileSync(new URL('../src/lib/waitlist/count.mjs', import.meta.url), 'utf8');
  assert.equal(countSource.includes('deleteSubscriber'), false);
  assert.equal(countSource.includes('fetch('), false);
});

test('unconfirmed contacts older than 14 days are the purge set', () => {
  const now = new Date('2026-11-20T00:00:00.000Z');
  const selected = selectUnconfirmedForDeletion(
    [
      subscriber({ id: 'old', status: 'unconfirmed', subscribedAt: '2026-11-01T00:00:00.000Z' }),
      subscriber({ id: 'new', status: 'unconfirmed', subscribedAt: '2026-11-10T00:00:00.000Z' }),
      subscriber({ id: 'kept', status: 'confirmed', subscribedAt: '2026-10-01T00:00:00.000Z' }),
    ],
    now,
  );
  assert.deepEqual(selected.map((row) => row.id), ['old']);
  const withPrefix = [
    subscriber({ id: 'old', status: 'unconfirmed', subscribedAt: '2026-11-01T00:00:00.000Z', ip: 'v4:5.5.5' }),
    subscriber({ id: 'fresh', status: 'unconfirmed', subscribedAt: '2026-11-10T00:00:00.000Z', ip: 'v4:5.5.5' }),
    subscriber({ id: 'kept', status: 'confirmed', subscribedAt: '2026-10-01T00:00:00.000Z', ip: 'v6:2a00:23c4:0001:0002' }),
  ];
  assert.deepEqual(
    selectStoredPrefixesForDeletion(withPrefix, now).map((row) => row.id),
    ['old'],
  );
  assert.deepEqual(
    selectStoredPrefixesForDeletion(withPrefix, new Date('2027-01-20T00:00:00.000Z')).map((row) => row.id),
    ['old', 'fresh'],
  );
  assert.deepEqual(
    selectStoredPrefixesForDeletion(withPrefix, new Date('2027-01-25T00:00:00.000Z')).map((row) => row.id),
    ['old', 'fresh', 'kept'],
  );
  assert.deepEqual(
    selectStoredPrefixesForDeletion(withPrefix, new Date('2027-08-01T00:00:00.000Z')).map((row) => row.id),
    ['old', 'fresh', 'kept'],
  );
  const cleared = omitNetworkPrefix({
    id: 'kept',
    ip: 'v4:5.5.5',
    ip_address: '5.5.5.9',
    fields: { network_prefix: 'v4:5.5.5', referral_count: 1 },
  });
  assert.equal(cleared.ip, undefined);
  assert.equal(cleared.ip_address, undefined);
  assert.equal(cleared.fields.network_prefix, undefined);
  assert.equal(cleared.fields.referral_count, 1);
});

test('each tally removes the export it read, and the last week removes every export', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hubbly-exports-'));
  const exportPath = path.join(dir, 'mock-subscribers.json');
  writeFileSync(exportPath, '[{"ip_address":"1.2.3.4"}]\n');
  writeFileSync(path.join(dir, 'referral-report.json'), '{}\n');
  writeFileSync(path.join(dir, 'notes.txt'), 'keep\n');
  const once = await removeLocalExports({
    exportPath,
    now: new Date('2026-11-01T00:00:00.000Z'),
    dirs: [dir],
  });
  assert.equal(existsSync(exportPath), false);
  assert.equal(once.length, 1);
  assert.equal(existsSync(path.join(dir, 'referral-report.json')), true);
  assert.equal(existsSync(path.join(dir, 'notes.txt')), true);

  writeFileSync(path.join(dir, 'subscribers.csv'), 'ip\n');
  writeFileSync(path.join(dir, 'other-export.json'), '{}\n');
  await removeLocalExports({
    now: new Date('2027-01-25T00:00:00.000Z'),
    dirs: [dir],
  });
  assert.equal(existsSync(path.join(dir, 'subscribers.csv')), false);
  assert.equal(existsSync(path.join(dir, 'other-export.json')), false);
  assert.equal(existsSync(path.join(dir, 'referral-report.json')), true);
  assert.equal(existsSync(path.join(dir, 'notes.txt')), true);
});

test('analytics payloads cannot carry a referral code or an email address', () => {
  const props = buildWaitlistSubmitProps({
    storePref: 'google_play',
    betaOptin: true,
    hasReferrer: true,
    search: '?ref=ABCDEFGH&utm_source=instagram&utm_campaign=morning&email=a@b.c',
  });
  assert.equal(props.store_pref, 'google_play');
  assert.equal(props.beta_optin, true);
  assert.equal(props.has_referrer, true);
  assert.equal(props.utm_source, 'instagram');
  assert.equal(props.utm_campaign, 'morning');
  assert.equal('ref' in props, false);
  assert.equal('email' in props, false);
  assert.deepEqual(shareClickProps('copy'), { channel: 'copy' });
  assert.equal(shareClickProps('ABCDEFGH'), null);
  assert.equal(errorProps('missing_age')?.reason, 'missing_age');
  assert.equal(errorProps('a@b.c'), null);
  const scrubbed = scrubAnalyticsUrl('https://gethubbly.app/waitlist?ref=ABCDEFGH&utm_source=instagram');
  assert.equal(scrubbed.includes('ref='), false);
  assert.equal(scrubbed.includes('ABCDEFGH'), false);
  assert.equal(scrubbed.includes('utm_source=instagram'), true);
  const event = {
    properties: {
      $current_url: 'https://gethubbly.app/confirmed?code=ABCDEFGH',
      $el_text: 'Share https://gethubbly.app/waitlist?ref=ABCDEFGH today',
      $elements: [{ attr__href: 'https://gethubbly.app/waitlist?REF=abcdefgh&utm_source=instagram' }],
    },
  };
  scrubAnalyticsEvent(event);
  const encoded = JSON.stringify(event);
  assert.equal(encoded.includes('ABCDEFGH'), false);
  assert.equal(encoded.includes('abcdefgh'), false);
  assert.equal(encoded.includes('utm_source=instagram'), true);
  const direct = { properties: { $referrer: '$direct' } };
  scrubAnalyticsEvent(direct);
  assert.equal(direct.properties.$referrer, '$direct');
  assert.equal(scrubAnalyticsUrl('$direct'), '$direct');
  assert.equal(scrubAnalyticsUrl('/waitlist?ref=ABCDEFGH').includes('ABCDEFGH'), false);
});

test('consent wording is saved with the form version', () => {
  const snapshot = readFileSync(
    new URL('../src/content/consent/waitlist-form-2026-10-12.html', import.meta.url),
    'utf8',
  );
  assert.equal(FORM_VERSION, '2026-10-12');
  for (const line of [FORM_STATEMENT, CHECKBOX_AGE, CHECKBOX_BETA, CHECKBOX_TIPS, CONFIRM_SUBJECT, CONFIRM_BODY]) {
    assert.equal(line.includes('{'), false);
  }
  assert.ok(snapshot.includes(FORM_STATEMENT));
  assert.ok(snapshot.includes(CHECKBOX_AGE));
  assert.ok(snapshot.includes(CHECKBOX_BETA));
  assert.ok(snapshot.includes(CHECKBOX_TIPS));
  assert.ok(snapshot.includes(GIFT_LINE));
  assert.ok(snapshot.includes(WAITLIST_NO_PLACE));
  assert.ok(snapshot.includes(TRIAL_SHORT));
  assert.equal(snapshot.includes('[REWARD CHOICE]'), false);
  assert.ok(REFERRAL_TERMS.includes('Calm-down cards'));
  assert.ok(REFERRAL_TERMS.includes('family-adventure-bingo.pdf'));
  assert.equal(REFERRAL_TERMS.includes('[REWARD CHOICE]'), false);
  assert.ok(REFERRAL_TERMS.includes('same internet connection'));
  assert.ok(REFERRAL_TERMS.includes('unsubscribes'));
  assert.ok(REFERRAL_TERMS.includes('31 Dec 2026'));
  assert.ok(REFERRAL_TERMS.includes('15 Jan 2027'));
  assert.ok(CONFIRM_BODY.includes('within 21 days'));
  assert.equal(
    TRIAL_SHORT,
    "30-day free trial in the app, no card needed to start. After that, keeping Hubbly needs a subscription. You'll see the price in the app before you choose, and you're never charged unless you subscribe.",
  );
});

test('the pre-publish scanner rejects retired wording', () => {
  assert.ok(findIssues('hello {name}', 'sample').length > 0);
  assert.equal(findIssues('ref={$fields.ref_code} <a href="{$unsubscribe}">Unsubscribe</a>', 'sample').length, 0);
  assert.equal(findIssues('iPhone Settings › [your name] › Subscriptions', 'sample').length, 0);
  assert.ok(findIssues('[TRIAL MODEL]', 'sample').some((issue) => issue.includes('square bracket')));
  assert.ok(findIssues('[REWARD CHOICE]', 'sample').some((issue) => issue.includes('square bracket')));
  assert.ok(findIssues('then £4.99', 'sample').some((issue) => issue.includes('£')));
  assert.ok(findIssues('first 100 households', 'sample').some((issue) => issue.includes('households')));
  assert.ok(findIssues('free, forever', 'sample').some((issue) => issue.includes('forever')));
  assert.ok(findIssues('The store link goes in this email on launch day.', 'sample').some((issue) => issue.includes('goes in this email')));
  assert.ok(findIssues('PLAY_URL', 'sample').some((issue) => issue.includes('PLAY_URL')));
  assert.ok(findIssues('30-day free trial, then £4.99 a month.', 'sample').some((issue) => issue.includes('4.99')));
  assert.equal(findIssues('524.992188', 'sample').length, 0);
  const encoded = '<a href="mailto:%7BCONTACT.privacy%7D">privacy</a>';
  assert.ok(findAttributeIssues(encoded, 'privacy/index.html').some((issue) => issue.includes('curly brace')));
  const literal = '<a href="mailto:privacy@gethubbly.app">privacy</a><a href="https://ico.org.uk/make-a-complaint/">ICO</a>';
  assert.equal(findAttributeIssues(literal, 'privacy/index.html').length, 0);
  const confirm = '<a href="{$url}">Confirm your email</a><a href="{$unsubscribe}">Unsubscribe</a>';
  assert.equal(findAttributeIssues(confirm, 'emails/00-confirm.html').length, 0);
  assert.equal(findIssues(confirm, 'emails/00-confirm.html').length, 0);
  const bulletproof = '<!--[if mso]><v:roundrect href="{$url}"></v:roundrect><![endif]-->';
  assert.equal(findIssues(bulletproof, 'emails/00-confirm.html').length, 0);
  for (const hidden of [
    '<a href="mailto:&#123;name&#125;">x</a>',
    '<a href="mailto:&#x7B;name&#x7D;">x</a>',
    '<a href="mailto:%25257Bname%25257D">x</a>',
    '<a href=mailto:%7Bname%7D>x</a>',
    '<a href="mailto:%zz%7Bname%7D">x</a>',
  ]) {
    assert.ok(findAttributeIssues(hidden, 'emails/hidden.html').some((issue) => issue.includes('curly brace')), hidden);
  }
  assert.ok(findIssues('Hello &#123;name&#125;', 'emails/hidden.html').some((issue) => issue.includes('curly brace')));
  assert.equal(findAttributeIssues('<a href="%7B$url%7D">Confirm</a>', 'emails/00-confirm.html').length, 0);
  assert.equal(findIssues('<p>&#123;$url&#125;</p>', 'emails/00-confirm.html').length, 0);
});

test('waitlist addresses allow accented local parts and stop at 254 characters', () => {
  assert.equal(isAcceptableEmail('zoë@exämple.com'), true);
  assert.equal(isAcceptableEmail('friend@example.com'), true);
  assert.equal(isAcceptableEmail('a@b'), true);
  for (const bad of ['abc', 'a@', '@b.com', 'a b@c.com', 'x@y..com', `${'a'.repeat(300)}@example.com`]) {
    assert.equal(isAcceptableEmail(bad), false, bad);
  }
  const form = readFileSync(new URL('../src/components/waitlist/WaitlistForm.astro', import.meta.url), 'utf8');
  assert.equal(form.includes('maxlength="254"'), true);
  assert.equal(form.includes('outline-none'), false);
  assert.equal(form.includes('data-error-for="email"'), true);
  assert.equal(form.includes('py-3'), true);
  assert.equal(form.includes('[REWARD CHOICE]'), false);
  const confirm = readFileSync(new URL('../src/emails/00-confirm.html', import.meta.url), 'utf8');
  assert.equal(confirm.includes('href="{$url}"'), true);
});
