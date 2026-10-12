// The only MailerLite write the referral tally is allowed to make.

/** @param {number} count */
export function buildReferralCountBody(count) {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('referral_count must be a non-negative integer');
  }
  return { fields: { referral_count: count } };
}

/**
 * @param {string} id
 * @param {number} count
 */
export function planReferralCountRequest(id, count) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Unexpected subscriber id');
  return {
    method: 'PUT',
    path: `/subscribers/${id}`,
    body: buildReferralCountBody(count),
  };
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function createMailerLiteClient(env = process.env) {
  const mode = env.MAILERLITE_MODE || (env.MAILERLITE_API_KEY ? 'live' : 'mock');
  if (mode === 'live') {
    if (!env.MAILERLITE_API_KEY) {
      throw new Error('MAILERLITE_API_KEY is missing. Refusing to call MailerLite.');
    }
    return createLiveClient(env.MAILERLITE_API_KEY);
  }
  return createFileClient(env.WAITLIST_EXPORT_PATH || 'data/mock-subscribers.json');
}

/** @param {string} filePath */
function createFileClient(filePath) {
  return {
    mode: 'mock',
    filePath,
    async listSubscribers() {
      const { readFile } = await import('node:fs/promises');
      try {
        const raw = await readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return [];
        throw error;
      }
    },
    /**
     * Updates referral_count and no other field.
     * @param {string} id
     * @param {number} count
     */
    async setReferralCount(id, count) {
      const { readFile, writeFile } = await import('node:fs/promises');
      const request = planReferralCountRequest(id, count);
      const raw = await readFile(filePath, 'utf8');
      const subscribers = JSON.parse(raw);
      const found = subscribers.find((subscriber) => subscriber.id === id);
      if (!found) throw new Error('Subscriber was not in the mock export');
      found.fields = { ...(found.fields ?? {}), referral_count: request.body.fields.referral_count };
      await writeFile(filePath, `${JSON.stringify(subscribers, null, 2)}\n`);
    },
  };
}

/** @param {string} apiKey */
function createLiveClient(apiKey) {
  const base = 'https://connect.mailerlite.com/api';
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  return {
    mode: 'live',
    async listSubscribers() {
      /** @type {Array<Record<string, unknown>>} */
      const rows = [];
      let url = `${base}/subscribers?limit=100`;
      for (let page = 0; page < 50 && url; page++) {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`MailerLite list failed (${response.status})`);
        const payload = await response.json();
        for (const row of payload.data ?? []) rows.push(mapSubscriber(row));
        url = payload.links?.next || '';
      }
      return rows;
    },
    /**
     * @param {string} id
     * @param {number} count
     */
    async setReferralCount(id, count) {
      const request = planReferralCountRequest(id, count);
      const response = await fetch(`${base}${request.path}`, {
        method: request.method,
        headers,
        body: JSON.stringify(request.body),
      });
      if (!response.ok) throw new Error(`MailerLite update failed (${response.status})`);
    },
  };
}

/** @param {Record<string, any>} row */
function mapSubscriber(row) {
  const status = mapStatus(row.status);
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    status,
    subscribedAt: String(row.subscribed_at ?? row.created_at ?? ''),
    confirmedAt: row.opted_in_at ? String(row.opted_in_at) : undefined,
    ip: row.ip_address ? String(row.ip_address) : undefined,
    fields: {
      ref_code: row.fields?.ref_code ? String(row.fields.ref_code) : '',
      referred_by: row.fields?.referred_by ? String(row.fields.referred_by) : '',
      referral_count: row.fields?.referral_count ?? 0,
    },
  };
}

/** @param {string} status */
function mapStatus(status) {
  if (status === 'active') return 'confirmed';
  if (status === 'unconfirmed') return 'unconfirmed';
  if (status === 'unsubscribed') return 'unsubscribed';
  if (status === 'bounced') return 'bounced';
  if (status === 'junk') return 'junk';
  return 'unconfirmed';
}
