// Weekly tally. The only write is referral_count, and only with --commit.
// Mock mode reads WAITLIST_EXPORT_PATH or data/mock-subscribers.json.
// Live mode needs MAILERLITE_MODE=live and MAILERLITE_API_KEY. It never sends email.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tally } from '../src/lib/waitlist/count.mjs';
import { removeLocalExports } from '../src/lib/waitlist/exports.mjs';
import { createMailerLiteClient } from '../src/lib/waitlist/mailerlite.mjs';

const commit = process.argv.includes('--commit');
const approveRewards = process.argv.includes('--approve-rewards');
const approveBurst = process.argv.includes('--approve-burst');
const client = createMailerLiteClient();
const subscribers = await client.listSubscribers();
const result = tally(subscribers, { approveRewards, approveBurst });

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
  approveBurst,
  total: result.total,
  counted: result.counted,
  warning: result.warning,
  writes: result.writes,
  heldForReview: result.heldForReview,
  burstHeld: result.burstHeld,
  collisions: result.collisions,
  rejected: result.rejected,
};

await mkdir('data', { recursive: true });
await writeFile(path.join('data', 'referral-report.json'), `${JSON.stringify(report, null, 2)}\n`);

const exportPath = client.filePath || process.env.WAITLIST_EXPORT_PATH;
const removed = await removeLocalExports({ exportPath });
if (removed.length) console.log(`Removed ${removed.length} local export file(s).`);

console.log(
  `${commit ? 'Updated' : 'Dry run,'} ${result.writes.length} referral_count value(s). ` +
    `${result.counted} confirmed referral(s) qualified. ` +
    `${result.heldForReview.length} referrer(s) held below 5 until --approve-rewards. ` +
    `${result.burstHeld.length} same-network sign-up(s) held until --approve-burst.`,
);
if (result.warning) {
  console.log(result.warning);
  process.exitCode = 2;
}
