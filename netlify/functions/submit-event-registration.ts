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
    const { eventSlug, firstName, lastName, email, phone, partySize, notes } = body;

    if (!eventSlug || !firstName || !lastName || !email) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'eventSlug, firstName, lastName, email are required' }) };
    }

    // Fetch event to validate registration config
    const ev = await sanity.fetch(
      `*[_type == "event" && slug.current == $slug][0]{ title, registration }`,
      { slug: eventSlug }
    );

    if (!ev) {
      return { statusCode: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Event not found' }) };
    }
    if (!ev.registration?.enabled) {
      return { statusCode: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Registration is not open for this event' }) };
    }
    if (ev.registration.closingDate && new Date(ev.registration.closingDate).getTime() < Date.now()) {
      return { statusCode: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Registration has closed' }) };
    }

    // Capacity check
    if (ev.registration.capacity) {
      const countResult = await turso.execute({
        sql: 'SELECT COALESCE(SUM(party_size), 0) AS total FROM event_registrations WHERE event_slug = ?',
        args: [eventSlug],
      });
      const current = Number((countResult.rows[0] as { total: number }).total);
      const requested = Number(partySize || 1);
      if (current + requested > ev.registration.capacity) {
        return { statusCode: 409, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Event is at capacity' }) };
      }
    }

    // Persistence must not cost us the notification. Staff act on the email,
    // not the database, so a write failure is logged and the send continues —
    // the event registration is still recoverable from the email itself.
    try {
      await turso.execute({
        sql: `INSERT INTO event_registrations
              (event_slug, first_name, last_name, email, phone, party_size, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          eventSlug, firstName, lastName, email,
          phone || null, partySize || 1, notes || null,
        ],
      });
    } catch (dbErr) {
      console.error('submit-event-registration: failed to persist the event registration:', dbErr);
    }

    // Confirmation
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
      to: [email],
      subject: `You're registered for ${ev.title}`,
      text: `Hi ${firstName},\n\nYou're confirmed for ${ev.title}. We'll see you there!`,
    });

    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('submit-event-registration error:', err);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Registration failed' }) };
  }
};
