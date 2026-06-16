import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client/web';

// Persists Stay Connected opt-ins (email newsletter + SMS) to the
// sms_subscribers Turso table. Column names match the Harness CSV template
// so the table can be exported and uploaded directly without reformatting.
//
// Note: the AWeber call for the email newsletter is fired separately from
// the client via subscribe-newsletter. This function always stores the row
// so the Turso table is the canonical record of consent.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      firstName,
      lastName,
      email,
      emailConsent,
      phoneNumber,
      smsConsent,
      list,
      source,
    } = body;

    if (!phoneNumber && !email) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Phone or email required' }),
      };
    }
    if (smsConsent && !phoneNumber) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Phone required for text updates' }),
      };
    }

    await turso.execute({
      sql: `INSERT INTO sms_subscribers
              (first_name, last_name, email, email_consent,
               phone_number, sms_consent, list, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        firstName ?? null,
        lastName ?? null,
        email ?? null,
        emailConsent ? 1 : 0,
        phoneNumber ?? null,
        smsConsent ? 1 : 0,
        list ?? 'general',
        source ?? 'website',
      ],
    });

    // TODO: when migrating from Harness CSV upload to a direct Twilio integration,
    // fire a Twilio API call here. The Turso record stays as a local backup.

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error('subscribe-sms error:', err);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Subscription failed' }),
    };
  }
};
