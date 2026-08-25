import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { staffIntake, type IntakeIdentification, type IntakeCorrection } from './_email-templates/staff-intake';

// TEMPORARY — receives the staff intake form on /staff and emails the answers.
// Nothing is written to Sanity: the details are entered into the CMS by hand
// after review, which is the whole reason the photos need a stable designation.
//
// Delete alongside _email-templates/staff-intake.ts and StaffIntakeSection.vue
// once the submissions are in.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const resend = new Resend(process.env.RESEND_API_KEY);

// Where the answers land. Falls back to the address that requested the tool so
// a missing env var can't silently drop a submission.
const FALLBACK_TO = 'ephifer@josephcentergj.com';

const MAX_ITEMS = 200;
const MAX_FIELD = 500;

const clean = (v: unknown): string =>
  typeof v === 'string' ? v.trim().slice(0, MAX_FIELD) : '';

const cleanList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => clean(x)).filter(Boolean).slice(0, 20) : [];

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Honeypot — matches the pattern used by the donation form.
    if (body._gotcha) {
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ success: true }) };
    }

    const identifications: IntakeIdentification[] = (Array.isArray(body.identifications) ? body.identifications : [])
      .slice(0, MAX_ITEMS)
      .map((i: Record<string, unknown>) => ({
        designation: clean(i.designation),
        imageUrl: clean(i.imageUrl),
        filename: clean(i.filename) || null,
        assetId: clean(i.assetId),
        name: clean(i.name) || null,
        title: clean(i.title) || null,
        departments: cleanList(i.departments),
        quote: clean(i.quote) || null,
      }))
      // Only photos the manager actually filled something in for.
      .filter((i: IntakeIdentification) => i.assetId && (i.name || i.title || i.departments?.length || i.quote));

    const corrections: IntakeCorrection[] = (Array.isArray(body.corrections) ? body.corrections : [])
      .slice(0, MAX_ITEMS)
      .map((c: Record<string, unknown>) => ({
        name: clean(c.name),
        staffId: clean(c.staffId),
        titleBefore: clean(c.titleBefore) || null,
        titleAfter: clean(c.titleAfter) || null,
        departmentsBefore: cleanList(c.departmentsBefore),
        departmentsAfter: cleanList(c.departmentsAfter),
      }))
      // Only records that actually changed — an unchanged roster of 20 people
      // is noise, not a submission.
      .filter((c: IntakeCorrection) =>
        c.staffId &&
        ((c.titleBefore ?? '') !== (c.titleAfter ?? '') ||
          (c.departmentsBefore ?? []).join('|') !== (c.departmentsAfter ?? []).join('|'))
      );

    if (!identifications.length && !corrections.length) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Nothing to submit — fill in at least one photo or change a staff detail.' }),
      };
    }

    const to = process.env.STAFF_INTAKE_TO_EMAIL || FALLBACK_TO;
    const from = process.env.CONTACT_FROM_EMAIL || 'no-reply@josephcentergj.com';

    const rendered = staffIntake({
      submittedBy: clean(body.submittedBy) || null,
      identifications,
      corrections,
    });

    const { error } = await resend.emails.send({
      from: `The Joseph Center <${from}>`,
      to,
      replyTo: clean(body.submittedBy) && clean(body.submittedBy).includes('@') ? clean(body.submittedBy) : undefined,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (error) {
      console.error('submit-staff-intake: Resend rejected the send:', error);
      return { statusCode: 502, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Could not send the submission. Please try again.' }) };
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ success: true, identified: identifications.length, changed: corrections.length }),
    };
  } catch (err) {
    console.error('submit-staff-intake error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
