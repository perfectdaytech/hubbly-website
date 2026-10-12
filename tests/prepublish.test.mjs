import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { PRIVACY_WAITLIST, REFERRAL_TERMS, TRIAL_SHORT } from '../src/lib/waitlist/copy.mjs';
import { scanPublished, visibleText } from '../scripts/prepublish-check.mjs';

test('built pages and email drafts pass the pre-publish scan', async () => {
  const issues = await scanPublished('dist', 'src/emails');
  assert.deepEqual(issues, []);
});

test('the built waitlist, privacy and referral pages carry the required wording', () => {
  const waitlist = visibleText(readFileSync('dist/waitlist/index.html', 'utf8'));
  const privacy = visibleText(readFileSync('dist/privacy/index.html', 'utf8'));
  const referral = visibleText(readFileSync('dist/referral-terms/index.html', 'utf8'));
  const founders = visibleText(readFileSync('dist/founders-terms/index.html', 'utf8'));
  const form = readFileSync('dist/waitlist/index.html', 'utf8');

  assert.ok(waitlist.includes(TRIAL_SHORT.replaceAll(' ', ' ').slice(0, 24)) || waitlist.includes('30-day free trial'));
  assert.ok(waitlist.includes('£4.99 a month'));
  assert.ok(waitlist.includes('Renews automatically'));
  assert.ok(privacy.includes('31 July 2027'));
  assert.ok(privacy.includes('14 days'));
  assert.ok(privacy.includes(PRIVACY_WAITLIST.slice(0, 40)));
  assert.ok(referral.includes('Chore Cards'));
  assert.ok(referral.includes(REFERRAL_TERMS.slice(0, 40)));
  assert.ok(founders.includes('first 100 subscriptions'));
  assert.equal(form.includes('ph-no-capture'), true);
  const ageTag = form.match(/<input[^>]*name="fields\[age_18\]"[^>]*>/);
  assert.ok(ageTag);
  assert.equal(ageTag[0].includes(' checked'), false);
  assert.equal(form.includes('type="checkbox"'), true);

  for (const file of readdirSync('public/printables')) {
    const bytes = readFileSync(`public/printables/${file}`);
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  }
});
