import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { PRIVACY_WAITLIST, REFERRAL_TERMS } from '../src/lib/waitlist/copy.mjs';
import { findRewardPdfs, scanPublished, visibleText } from '../scripts/prepublish-check.mjs';

test('the draft build is blocked until open placeholders are removed', async () => {
  const issues = await scanPublished('dist', 'src/emails');
  assert.ok(issues.length > 0);
  for (const token of ['PLAY_URL', 'APP_STORE_URL']) {
    assert.ok(issues.some((issue) => issue.includes(token)), token);
  }
  assert.equal(issues.some((issue) => issue.includes('[REWARD CHOICE]')), false);
  assert.equal(issues.some((issue) => issue.includes('£')), false);
  for (const gone of ['[TRIAL MODEL]', '[FOUNDERS OFFER]', '[ANNUAL PRICE]', '[ICO NUMBER]', '44.99', '4.99']) {
    assert.equal(
      issues.some((issue) => issue.includes(gone)),
      false,
      gone,
    );
  }
  assert.equal(
    issues.some((issue) => issue.includes('emails/01-welcome.html: contains a curly brace')),
    false,
  );
  assert.equal(issues.some((issue) => issue.includes('curly brace in a link')), false);
  const confirm = readFileSync('src/emails/00-confirm.html', 'utf8');
  assert.equal(confirm.includes('href="{$url}"'), true);
  assert.equal(issues.some((issue) => issue.includes('emails/00-confirm.html')), false);
  assert.equal(issues.some((issue) => issue.includes('referral reward PDF')), false);
  assert.deepEqual(await findRewardPdfs('dist'), []);
});

test('encoded braces in an email attribute fail the scan', async () => {
  const dist = mkdtempSync(path.join(tmpdir(), 'hubbly-dist-'));
  const emails = mkdtempSync(path.join(tmpdir(), 'hubbly-mail-'));
  writeFileSync(path.join(dist, 'index.html'), '<p>Hello</p>');
  writeFileSync(path.join(emails, '00.html'), '<a href=mailto:%zz%25257Bname%257D>x</a>');
  const issues = await scanPublished(dist, emails);
  assert.ok(issues.some((issue) => issue.includes('curly brace')));
});

test('a reward PDF in the build fails the scan', async () => {
  const dist = mkdtempSync(path.join(tmpdir(), 'hubbly-dist-'));
  const emails = mkdtempSync(path.join(tmpdir(), 'hubbly-mail-'));
  writeFileSync(path.join(dist, 'index.html'), '<p>Hello</p>');
  writeFileSync(path.join(dist, 'calm-down-cards.pdf'), '%PDF-');
  writeFileSync(path.join(emails, '00.html'), '<p><a href="{$unsubscribe}">Unsubscribe</a></p>');
  const issues = await scanPublished(dist, emails);
  assert.ok(issues.some((issue) => issue.includes('calm-down-cards.pdf')));
});

test('the built waitlist, privacy and referral pages carry the required wording', () => {
  const privacyHtml = readFileSync('dist/privacy/index.html', 'utf8');
  const cookiesHtml = readFileSync('dist/cookies/index.html', 'utf8');
  const termsHtml = readFileSync('dist/terms/index.html', 'utf8');
  const waitlist = visibleText(readFileSync('dist/waitlist/index.html', 'utf8'));
  const privacy = visibleText(privacyHtml);
  const referral = visibleText(readFileSync('dist/referral-terms/index.html', 'utf8'));
  const founders = visibleText(readFileSync('dist/founders-terms/index.html', 'utf8'));
  const freebies = readFileSync('dist/freebies/index.html', 'utf8');
  const form = readFileSync('dist/waitlist/index.html', 'utf8');
  const welcome = readFileSync('src/emails/01-welcome.html', 'utf8');
  const launch = readFileSync('src/emails/06-launch.html', 'utf8');

  const home = visibleText(readFileSync('dist/index.html', 'utf8'));
  assert.ok(waitlist.includes('no card needed to start'));
  assert.ok(waitlist.includes("you're never charged unless you subscribe"));
  assert.equal(waitlist.includes('may be available on launch day'), false);
  assert.equal(waitlist.includes('payment method needed'), false);
  assert.equal(waitlist.includes('[REWARD CHOICE]'), false);
  assert.ok(home.includes('30-day free trial in the app, no card needed to start'));
  assert.ok(home.includes("you're never charged unless you subscribe"));
  assert.equal(home.includes('£'), false);
  assert.ok(privacy.includes('31 July 2027'));
  assert.ok(privacy.includes('within 21 days'));
  assert.equal(privacy.includes('after 14 days'), false);
  assert.equal(home.includes('after 14 days'), false);
  assert.ok(home.includes('within 14 days'));
  assert.equal(privacyHtml.includes('%7B'), false);
  assert.equal(cookiesHtml.includes('%7B'), false);
  assert.equal(termsHtml.includes('%7B'), false);
  assert.equal(privacyHtml.includes('mailto:privacy@gethubbly.app'), true);
  assert.equal(privacyHtml.includes('https://ico.org.uk/make-a-complaint/'), true);
  assert.equal(privacyHtml.includes('https://gethubbly.app'), true);
  assert.equal(cookiesHtml.includes('mailto:privacy@gethubbly.app'), true);
  assert.ok(termsHtml.includes('mailto:hello@gethubbly.app'));
  assert.ok(termsHtml.includes('mailto:support@gethubbly.app'));
  assert.equal(termsHtml.includes('contact@gethubbly.app'), false);
  assert.equal(privacyHtml.includes('contact@gethubbly.app'), false);
  assert.equal(termsHtml.includes('mailto:%7BCONTACT.support%7D'), false);
  assert.ok(privacy.includes('ZC144477'));
  assert.equal(privacy.includes('[ICO NUMBER]'), false);
  assert.ok(privacy.includes('legitimate interest in running the referral rewards fairly'));
  assert.ok(privacy.includes("The only analytics is PostHog, which runs in memory without cookies."));
  assert.equal(privacy.includes('any other third-party script'), false);
  assert.ok(privacy.includes(PRIVACY_WAITLIST.slice(0, 40)));
  assert.ok(referral.includes('Calm-down cards'));
  assert.ok(referral.includes('family-adventure-bingo.pdf'));
  assert.equal(referral.includes('[REWARD CHOICE]'), false);
  assert.equal(referral.includes('£'), false);
  assert.ok(referral.includes('same internet connection'));
  assert.ok(referral.includes('unsubscribes'));
  assert.ok(referral.includes(REFERRAL_TERMS.slice(0, 40)));
  assert.equal(founders.includes('may be available on launch day'), false);
  assert.ok(founders.includes("you're never charged unless you subscribe"));
  assert.ok(founders.includes('hello@gethubbly.app'));
  assert.ok(founders.includes('no card needed to start'));
  assert.equal(founders.includes('no payment details are required'), false);
  assert.equal(founders.includes('[FOUNDERS OFFER]'), false);
  assert.equal(founders.includes('[TRIAL MODEL]'), false);
  assert.equal(founders.includes('44.99'), false);
  assert.equal(founders.includes('4.99'), false);
  assert.equal(founders.includes('is planned in the app'), false);
  assert.ok(freebies.includes('chore-cards.pdf'));
  assert.ok(freebies.includes('colour-in-mascot.pdf'));
  assert.equal(freebies.includes('calm-down-cards.pdf'), false);
  assert.equal(freebies.includes('family-adventure-bingo.pdf'), false);
  assert.ok(freebies.includes("aren't in this library"));
  assert.equal(form.includes('ph-no-capture'), true);
  const ageTag = form.match(/<input[^>]*name="fields\[age_18\]"[^>]*>/);
  assert.ok(ageTag);
  assert.equal(ageTag[0].includes(' checked'), false);

  assert.ok(welcome.includes('https://gethubbly.app/waitlist?ref={$fields.ref_code}'));
  assert.ok(welcome.includes('When 3 friends confirm, you get Calm-down cards; at 5, Family adventure bingo.'));
  const summaryAt = welcome.indexOf('When 3 friends confirm');
  const termsAt = welcome.indexOf('calm-down-cards.pdf');
  assert.ok(summaryAt > -1 && termsAt > summaryAt);
  assert.equal(welcome.includes('[REWARD CHOICE]'), false);
  assert.ok(welcome.includes('href="{$unsubscribe}"'));
  assert.ok(welcome.includes('privacy@gethubbly.app'));
  assert.ok(welcome.includes('hello@gethubbly.app'));
  assert.equal(launch.includes('goes in this email'), false);
  assert.ok(launch.includes('PLAY_URL?utm_campaign=founders_launch'));
  assert.ok(launch.includes("you're among the first to hear"));
  assert.equal(launch.includes('first access'), false);
  assert.equal(launch.includes('may be available on launch day'), false);
  assert.ok(launch.includes("you're never charged unless you subscribe"));
  assert.ok(launch.includes('href="{$unsubscribe}"'));

  const library = readdirSync('public/printables');
  assert.equal(library.includes('chore-cards.pdf'), true);
  assert.equal(library.includes('colour-in-mascot.pdf'), true);
  assert.equal(library.includes('calm-down-cards.pdf'), false);
  assert.equal(library.includes('family-adventure-bingo.pdf'), false);
  for (const file of library) {
    const bytes = readFileSync(`public/printables/${file}`);
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  }
});
