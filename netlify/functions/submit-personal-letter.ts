import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client/web';
import { Resend } from 'resend';

// Persists year-end Personal Letter from Mona mailing-address requests.
// Writes to the `letter_requests` Turso table (see 002_personal_letter.sql).
// Notifies staff via Resend when CONTACT_TO_EMAIL is configured.

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

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { firstName, lastName, street, city, state, zip, email } = body;

    if (!firstName || !lastName || !street || !city || !state || !zip || !email) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'All fields are required' }),
      };
    }

    await turso.execute({
      sql: `INSERT INTO letter_requests
              (first_name, last_name, street, city, state, zip, email)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [firstName, lastName, street, city, state, zip, email],
    });

    // Optional staff notification
    if (process.env.CONTACT_TO_EMAIL) {
      await resend.emails.send({
        from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
        to: [process.env.CONTACT_TO_EMAIL],
        subject: 'New Personal Letter from Mona request',
        text: `${firstName} ${lastName}\n${street}\n${city}, ${state} ${zip}\n${email}`,
      });
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error('submit-personal-letter error:', err);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Submission failed' }),
    };
  }
};
