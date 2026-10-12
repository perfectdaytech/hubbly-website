// Weekly tally. The only write is referral_count, and only with --commit.
// Mock mode reads WAITLIST_EXPORT_PATH or data/mock-subscribers.json.
// Live mode needs MAILERLITE_MODE=live and MAILERLITE_API_KEY. It never sends email.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tally } from '../src/lib/waitlist/count.mjs';
import { createMailerLiteClient } from '../src/lib/waitlist/mailerlite.mjs';

const commit = process.argv.includes('--commit');
const approveRewards = process.argv.includes('--approve-rewards');
const client = createMailerLiteClient();
const subscribers = await client.listSubscribers();
const result = tally(subscribers, { approveRewards });

if (commit) {
  for (const write of result.writes) {
    await client.setReferralCount(write.id, write.referral_count);
  }
}

const report = {
  ranAt: new Date().toISOString(),
  mode: client.mode,
  committed: commit,
  approveRewards,
  total: result.total,
  counted: result.counted,
  warning: result.warning,
  writes: result.writes,
  heldForReview: result.heldForReview,
  collisions: result.collisions,
  rejected: result.rejected,
};

await mkdir('data', { recursive: true });
await writeFile(path.join('data', 'referral-report.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `${commit ? 'Updated' : 'Dry run,'} ${result.writes.length} referral_count value(s). ` +
    `${result.counted} confirmed referral(s) qualified. ` +
    `${result.heldForReview.length} referrer(s) held below 5 until --approve-rewards.`,
);
if (result.warning) {
  console.log(result.warning);
  process.exitCode = 2;
}
