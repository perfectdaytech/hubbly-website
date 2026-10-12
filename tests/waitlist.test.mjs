import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildWaitlistSubmitProps, errorProps, scrubAnalyticsUrl, shareClickProps } from '../src/lib/waitlist/analytics.mjs';
import { REF_ALPHABET, generateRefCode, isValidRefCode } from '../src/lib/waitlist/codes.mjs';
import { tally } from '../src/lib/waitlist/count.mjs';
import {
  CHECKBOX_AGE,
  CHECKBOX_BETA,
  CHECKBOX_TIPS,
  CONFIRM_BODY,
  CONFIRM_SUBJECT,
  FORM_STATEMENT,
  FORM_VERSION,
  REFERRAL_TERMS,
  SHARE_TEXT,
} from '../src/lib/waitlist/copy.mjs';
import { normalizeEmail } from '../src/lib/waitlist/email.mjs';
import { buildReferralCountBody, planReferralCountRequest } from '../src/lib/waitlist/mailerlite.mjs';
import { selectUnconfirmedForDeletion } from '../src/lib/waitlist/purge.mjs';
import { findIssues } from '../scripts/prepublish-check.mjs';

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
    ip: '203.0.113.20',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const unconfirmed = subscriber({
    id: 'pending-consent',
    email: 'later@example.com',
    status: 'unconfirmed',
    confirmedAt: undefined,
    ip: '203.0.113.21',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const self = subscriber({
    id: 'self',
    email: 'janedoe+list@gmail.com',
    ip: '203.0.113.22',
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

test('an unsubscribed referral stops counting', () => {
  const referrer = subscriber({ id: 'referrer', email: 'owner@example.com', fields: { ref_code: 'ABCDEFGH' } });
  const left = subscriber({
    id: 'left',
    email: 'left@example.com',
    status: 'unsubscribed',
    fields: { referred_by: 'ABCDEFGH' },
  });
  const result = tally([referrer, left]);
  assert.equal(result.counted, 0);
  assert.ok(result.rejected.some((row) => row.id === 'left'));
});

test('five referrals stay at 4 until the hand check', () => {
  const referrer = subscriber({ id: 'referrer', email: 'owner@example.com', fields: { ref_code: 'ABCDEFGH' } });
  const friends = [1, 2, 3, 4, 5].map((n) =>
    subscriber({
      id: `f${n}`,
      email: `friend${n}@example.com`,
      ip: `203.0.113.8${n}`,
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
  assert.ok(REFERRAL_TERMS.includes('Chore Cards'));
  assert.ok(REFERRAL_TERMS.includes('[REWARD CHOICE]'));
  assert.ok(REFERRAL_TERMS.includes('same internet connection'));
  assert.ok(REFERRAL_TERMS.includes('unsubscribes'));
  assert.ok(REFERRAL_TERMS.includes('31 Dec 2026'));
  assert.ok(REFERRAL_TERMS.includes('15 Jan 2027'));
  assert.ok(CONFIRM_BODY.includes('within 21 days'));
});

test('the pre-publish scanner rejects retired wording', () => {
  assert.ok(findIssues('hello {name}', 'sample').length > 0);
  assert.equal(findIssues('ref={$fields.ref_code} <a href="{$unsubscribe}">Unsubscribe</a>', 'sample').length, 0);
  assert.equal(findIssues('iPhone Settings › [your name] › Subscriptions', 'sample').length, 0);
  assert.ok(findIssues('[TRIAL MODEL]', 'sample').some((issue) => issue.includes('[TRIAL MODEL]')));
  assert.ok(findIssues('first 100 households', 'sample').some((issue) => issue.includes('households')));
  assert.ok(findIssues('free, forever', 'sample').some((issue) => issue.includes('forever')));
  assert.ok(findIssues('The store link goes in this email on launch day.', 'sample').some((issue) => issue.includes('goes in this email')));
  assert.ok(findIssues('PLAY_URL', 'sample').some((issue) => issue.includes('PLAY_URL')));
  assert.equal(findIssues('30-day free trial, then £4.99 a month.', 'sample').length, 0);
});
