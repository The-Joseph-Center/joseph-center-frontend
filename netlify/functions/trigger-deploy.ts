import type { Handler } from '@netlify/functions';

// Triggers a Netlify build by POSTing to the configured build hook. Called
// from the Sanity Studio deploy button. The shared secret in the
// `x-deploy-secret` header protects the endpoint from anonymous abuse.
//
// Studio is hosted on *.sanity.studio (a different origin), so this function
// needs to permit cross-origin requests.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-deploy-secret',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const secret = event.headers['x-deploy-secret'] ?? event.headers['X-Deploy-Secret'];
  if (!secret || secret !== process.env.DEPLOY_HOOK_SECRET) {
    return { statusCode: 401, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const hookUrl = process.env.NETLIFY_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'NETLIFY_DEPLOY_HOOK_URL not configured' }),
    };
  }

  try {
    const response = await fetch(hookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return {
        statusCode: 502,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          error: 'Netlify build hook returned non-200',
          status: response.status,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ triggered: true, timestamp: new Date().toISOString() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Failed to trigger deploy', detail: String(err) }),
    };
  }
};
