import type { Handler } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Stripe webhook handler — SCAFFOLDED ONLY.
 * Returns 501 until VITE_DONATION_PROVIDER is set to 'stripe'.
 *
 * Phase 2 implementation will:
 * 1. Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET
 * 2. On checkout.session.completed: update donation row to 'completed'
 * 3. Send Resend confirmation to donor
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const provider = process.env.VITE_DONATION_PROVIDER || 'harness';
  if (provider !== 'stripe') {
    return { statusCode: 501, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Stripe donations not yet activated' }) };
  }

  // PHASE 2: implement Stripe webhook verification + donation lifecycle here
  return { statusCode: 501, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Phase 2 implementation pending' }) };
};
