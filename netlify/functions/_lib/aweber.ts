// Shared AWeber helper — used by any Netlify Function that needs to add a
// subscriber to the JC AWeber list. Mirrors the OAuth refresh-token + subscriber-
// POST pattern from subscribe-newsletter.ts (single source of truth for the
// API contract — if AWeber's auth changes, update both).
//
// Files in netlify/functions/_lib/ are NOT deployed as functions on their own;
// they're imported by the real functions and bundled in.

interface AddSubscriberInput {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
}

async function mintAccessToken(): Promise<string> {
  const clientId = process.env.AWEBER_CLIENT_ID;
  const clientSecret = process.env.AWEBER_CLIENT_SECRET;
  const refreshToken = process.env.AWEBER_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('AWeber OAuth credentials not configured');
  }

  const res = await fetch('https://auth.aweber.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AWeber token refresh failed: ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Adds (or upserts) a subscriber on the configured AWeber list with the
// given tags. AWeber treats POST to /subscribers as upsert keyed by email.
//
// Returns { ok: true } on success or { ok: false, error } on failure — never
// throws, so the caller can choose whether AWeber sync failure should block
// the rest of the function (typically it shouldn't).
export async function addAweberSubscriber(input: AddSubscriberInput): Promise<{ ok: boolean; error?: string }> {
  const accountId = process.env.AWEBER_ACCOUNT_ID;
  const listId = process.env.AWEBER_LIST_ID;

  if (!accountId || !listId) {
    return { ok: false, error: 'AWeber account/list not configured' };
  }

  let accessToken: string;
  try {
    accessToken = await mintAccessToken();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const fullName = [input.firstName, input.lastName].filter(Boolean).join(' ').trim();

  try {
    const res = await fetch(
      `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: input.email,
          ...(fullName ? { name: fullName } : {}),
          ...(input.tags && input.tags.length ? { tags: input.tags } : {}),
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `AWeber API ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
