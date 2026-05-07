import type { Handler } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Stripe Checkout session creator — SCAFFOLDED ONLY.
 * Returns 501 until VITE_DONATION_PROVIDER is set to 'stripe'.
 *
 * Phase 2 implementation will:
 * 1. Create a Stripe Checkout session (one-time or recurring)
 * 2. Insert a 'pending' donation row in Turso
 * 3. Return the session URL for client redirect
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const provider = process.env.VITE_DONATION_PROVIDER || 'harness';
  if (provider !== 'stripe') {
    return { statusCode: 501, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Stripe donations not yet activated. Set VITE_DONATION_PROVIDER=stripe to enable.' }) };
  }

  // PHASE 2: implement Stripe Checkout session creation here
  return { statusCode: 501, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Phase 2 implementation pending' }) };
};
