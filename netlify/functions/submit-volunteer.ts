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
    const { name, email, phone, departments, availability, additionalInfo } = body;

    if (!name || !email) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'name and email are required' }) };
    }

    await turso.execute({
      sql: `INSERT INTO volunteer_submissions
            (name, email, phone, departments, availability, additional_info)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        name, email, phone || null,
        departments ? JSON.stringify(departments) : null,
        availability ? JSON.stringify(availability) : null,
        additionalInfo || null,
      ],
    });

    // Confirmation to applicant
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
      to: [email],
      subject: 'Thanks for applying to volunteer',
      text: `Hi ${name},\n\nWe received your volunteer application and will be in touch soon.\n\nThank you for your interest!`,
    });

    // TODO: AWeber tag 'volunteer-submitted' when AWEBER_ACCESS_TOKEN is set

    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('submit-volunteer error:', err);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
