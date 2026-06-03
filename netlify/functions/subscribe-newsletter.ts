import type { Handler } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

/**
 * Subscribes an email to the configured AWeber list with tag: newsletter.
 * Mints a fresh access token via the refresh-token grant on each invocation.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, name } = body;

    if (!email) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'email is required' }) };
    }

    const accountId = process.env.AWEBER_ACCOUNT_ID;
    const listId = process.env.AWEBER_LIST_ID;

    if (!accountId || !listId) {
      return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'AWeber account/list not configured' }) };
    }

    const accessToken = await mintAccessToken();

    const res = await fetch(
      `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          ...(name ? { name } : {}),
          tags: ['newsletter'],
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('AWeber error:', text);
      return { statusCode: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Subscription failed' }) };
    }

    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('subscribe-newsletter error:', err);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to subscribe' }) };
  }
};
