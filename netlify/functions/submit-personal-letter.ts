import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client/web';
import { Resend } from 'resend';

// Persists year-end Personal Letter from Mona mailing-address requests.
// Writes to the `letter_requests` Turso table (see 002_personal_letter.sql).
//
// WHO IS TOLD, AND WHY IT IS NOT THE CONTACT INBOX
//
// Every one of these requests is a donor's home address. The dashboard
// restricts this form's inbox to two groups for that reason — the Executive
// Director, whose letters these are, and the Web Developer — while this
// function was emailing the address itself to CONTACT_TO_EMAIL, the general
// contact address that the front desk also reads.
//
// So it goes to the same two people the access rule already names, and
// deliberately does NOT fall back to CONTACT_TO_EMAIL: a missing variable
// should mean nobody new is told, not everybody. Override with a
// comma-separated LETTER_REQUEST_TO_EMAIL.

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

    // Its own try/catch, and after the write. The request has been taken by
    // this point; a mail failure must not turn into "Submission failed" for a
    // donor who has already given us their address, because the only thing
    // they can do with that is type it in again.
    try {
      const to = (process.env.LETTER_REQUEST_TO_EMAIL
        || 'mhighline@josephcentergj.com,ephifer@josephcentergj.com')
        .split(',').map((a) => a.trim()).filter(Boolean);
      await resend.emails.send({
        from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
        to,
        replyTo: email || undefined,
        subject: 'New Personal Letter from Mona request',
        text: `${firstName} ${lastName}\n${street}\n${city}, ${state} ${zip}\n${email}`,
      });
    } catch (mailErr) {
      console.error('submit-personal-letter: saved, but could not notify:', mailErr);
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
