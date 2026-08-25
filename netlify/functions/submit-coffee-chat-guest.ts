import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client/web';
import { Resend } from 'resend';

// Persists Coffee Chat with Mona guest applications to the
// coffee_chat_applications Turso table (see 004_coffee_chat_applications.sql).
// Optionally sends a Resend notification to staff when CONTACT_TO_EMAIL is set.

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

    const required = [
      'email',
      'fullName',
      'connection',
      'impactStatement',
      'programsInvolved',
      'nameDisplay',
      'contactMethods',
      'signature',
      'signatureDate',
    ] as const;

    for (const field of required) {
      const value = (body as Record<string, unknown>)[field];
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return {
          statusCode: 400,
          headers: JSON_HEADERS,
          body: JSON.stringify({ error: `${field} is required` }),
        };
      }
    }

    // Persistence must not cost us the notification. Staff act on the email,
    // not the database, so a write failure is logged and the send continues —
    // the coffee chat application is still recoverable from the email itself.
    try {
      await turso.execute({
        sql: `INSERT INTO coffee_chat_applications (
                email, full_name, contact_email, phone, connection, is_18_plus,
                impact_statement, programs_involved, has_legal_matters, sensitive_topics,
                comfortable_recorded, name_display, accommodations, media_release_granted,
                expectations_confirmed, best_days, best_times, contact_methods,
                additional_info, signature, signature_date
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          body.email,
          body.fullName,
          body.contactEmail ?? null,
          body.phone ?? null,
          body.connection,
          body.is18Plus ? 1 : 0,
          body.impactStatement,
          JSON.stringify(body.programsInvolved ?? []),
          body.hasLegalMatters ? 1 : 0,
          body.sensitiveTopics ?? null,
          body.comfortableRecorded ? 1 : 0,
          body.nameDisplay,
          body.accommodations ?? null,
          body.mediaReleaseGranted ? 1 : 0,
          body.expectationsConfirmed ? 1 : 0,
          JSON.stringify(body.bestDays ?? []),
          JSON.stringify(body.bestTimes ?? []),
          JSON.stringify(body.contactMethods ?? []),
          body.additionalInfo ?? null,
          body.signature,
          body.signatureDate,
        ],
      });
    } catch (dbErr) {
      console.error('submit-coffee-chat-guest: failed to persist the coffee chat application:', dbErr);
    }

    if (process.env.CONTACT_TO_EMAIL) {
      await resend.emails.send({
        from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
        to: [process.env.CONTACT_TO_EMAIL],
        subject: `New Coffee Chat guest application: ${body.fullName}`,
        text:
          `Name: ${body.fullName}\n` +
          `Email: ${body.email}\n` +
          `Phone: ${body.phone ?? '—'}\n` +
          `Connection: ${body.connection}\n\n` +
          `Impact statement:\n${body.impactStatement}\n\n` +
          `Programs: ${Array.isArray(body.programsInvolved) ? body.programsInvolved.join(', ') : ''}\n` +
          `Has ongoing legal matters: ${body.hasLegalMatters ? 'Yes' : 'No'}\n` +
          `Sensitive topics: ${body.sensitiveTopics ?? '—'}\n` +
          `Name display: ${body.nameDisplay}\n` +
          `Accommodations: ${body.accommodations ?? '—'}\n` +
          `Best days: ${Array.isArray(body.bestDays) ? body.bestDays.join(', ') : '—'}\n` +
          `Best times: ${Array.isArray(body.bestTimes) ? body.bestTimes.join(', ') : '—'}\n` +
          `Contact methods: ${Array.isArray(body.contactMethods) ? body.contactMethods.join(', ') : ''}\n\n` +
          `Additional info: ${body.additionalInfo ?? '—'}\n\n` +
          `Signed: ${body.signature} on ${body.signatureDate}`,
      });
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error('submit-coffee-chat-guest error:', err);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Submission failed' }),
    };
  }
};
