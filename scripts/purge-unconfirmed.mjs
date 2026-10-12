// Monthly clean: delete unconfirmed contacts older than 14 days.
// Does nothing unless --confirm is passed. Never used by the referral tally.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createMailerLiteClient } from '../src/lib/waitlist/mailerlite.mjs';
import { planDeleteRequest, selectUnconfirmedForDeletion } from '../src/lib/waitlist/purge.mjs';

const confirm = process.argv.includes('--confirm');
const client = createMailerLiteClient();
const subscribers = await client.listSubscribers();
const due = selectUnconfirmedForDeletion(subscribers);
const ids = due.map((subscriber) => subscriber.id);

if (confirm && client.mode === 'live') {
  const apiKey = process.env.MAILERLITE_API_KEY;
  for (const id of ids) {
    const request = planDeleteRequest(id);
    const response = await fetch(`https://connect.mailerlite.com/api${request.path}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error(`MailerLite delete failed (${response.status})`);
  }
}

if (confirm && client.mode === 'mock') {
  const { readFile, writeFile: write } = await import('node:fs/promises');
  const filePath = client.filePath;
  try {
    const current = JSON.parse(await readFile(filePath, 'utf8'));
    const remaining = current.filter((subscriber) => !ids.includes(subscriber.id));
    await write(filePath, `${JSON.stringify(remaining, null, 2)}\n`);
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error;
  }
}

await mkdir('data', { recursive: true });
await writeFile(
  path.join('data', 'purge-log.json'),
  `${JSON.stringify({ ranAt: new Date().toISOString(), confirm, deleted: confirm ? ids.length : 0, due: ids.length }, null, 2)}\n`,
);

console.log(
  confirm
    ? `Deleted ${ids.length} unconfirmed contact(s) older than 14 days.`
    : `Dry run: ${ids.length} unconfirmed contact(s) are older than 14 days. Pass --confirm to delete them.`,
);
