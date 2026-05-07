import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client';
import { Resend } from 'resend';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
    return { statusCode: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      referrerName, referrerEmail, referrerPhone, agency,
      individualFirstName, individualLastName, preferredName, dob, reason,
    } = body;

    if (!referrerName || !referrerEmail || !individualFirstName || !individualLastName) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'referrer name/email and individual first/last name are required' }) };
    }

    await turso.execute({
      sql: `INSERT INTO referral_submissions
            (referrer_name, referrer_email, referrer_phone, agency,
             individual_first_name, individual_last_name, preferred_name, dob, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        referrerName, referrerEmail, referrerPhone || null, agency || null,
        individualFirstName, individualLastName, preferredName || null, dob || null, reason || null,
      ],
    });

    // Notify staff
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
      to: [process.env.CONTACT_TO_EMAIL!],
      subject: `New referral: ${individualFirstName} ${individualLastName}`,
      text: `Referrer: ${referrerName} <${referrerEmail}>${agency ? ' from ' + agency : ''}\n\nIndividual: ${individualFirstName} ${individualLastName}${preferredName ? ' (' + preferredName + ')' : ''}\n\nReason:\n${reason || '—'}`,
    });

    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('submit-referral error:', err);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
