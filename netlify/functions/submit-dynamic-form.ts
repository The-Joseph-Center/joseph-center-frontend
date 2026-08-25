import type { Handler } from '@netlify/functions';
import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createTursoClient } from '@libsql/client/web';
import { Resend } from 'resend';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const sanity = createSanityClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID!,
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: process.env.VITE_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
});

const turso = createTursoClient({
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
    const { slug, data } = body;

    if (!slug || !data || typeof data !== 'object') {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'slug and data object are required' }) };
    }

    // Fetch form schema for validation + notify config
    const form = await sanity.fetch(
      `*[_type == "dynamicForm" && slug.current == $slug][0]`,
      { slug }
    );

    if (!form) {
      return { statusCode: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Form not found' }) };
    }

    // Active checks
    if (form.active === false) {
      return { statusCode: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Form is currently closed' }) };
    }
    if (form.activeDates) {
      const now = Date.now();
      if (form.activeDates.start && new Date(form.activeDates.start).getTime() > now) {
        return { statusCode: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Form is not yet open' }) };
      }
      if (form.activeDates.end && new Date(form.activeDates.end).getTime() < now) {
        return { statusCode: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Form has closed' }) };
      }
    }

    // Validate required fields
    for (const field of form.fields || []) {
      if (field.required && !data[field.name]) {
        return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `Missing required field: ${field.label}` }) };
      }
    }

    // Persist to Turso
    // Persistence must not cost us the notification. Staff act on the email,
    // not the database, so a write failure is logged and the send continues —
    // the form submission is still recoverable from the email itself.
    try {
      await turso.execute({
        sql: 'INSERT INTO form_submissions (form_slug, data, email) VALUES (?, ?, ?)',
        args: [slug, JSON.stringify(data), data.email || null],
      });
    } catch (dbErr) {
      console.error('submit-dynamic-form: failed to persist the form submission:', dbErr);
    }

    // Notify staff
    if (form.notifyEmail) {
      const summary = Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('\n');
      await resend.emails.send({
        from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
        to: [form.notifyEmail],
        subject: `New ${form.title} submission`,
        text: summary,
      });
    }

    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, message: form.successMessage || 'Thanks for your submission!' }) };
  } catch (err) {
    console.error('submit-dynamic-form error:', err);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
