import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { staffIntake, type StaffEdit } from './_email-templates/staff-intake';

// TEMPORARY — receives the inline staff-card edits from /staff and emails them.
// Nothing is written to Sanity; the details are entered into the CMS by hand
// after review.
//
// Delete alongside _email-templates/staff-intake.ts and the intakeMode flag on
// the People Grid section once the submissions are in.

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

    const edits: StaffEdit[] = (Array.isArray(body.edits) ? body.edits : [])
      .slice(0, MAX_ITEMS)
      .map((e: Record<string, unknown>) => ({
        staffId: clean(e.staffId),
        currentName: clean(e.currentName),
        imageUrl: clean(e.imageUrl) || null,
        kind: e.kind === 'identification' ? 'identification' : 'correction',
        nameBefore: clean(e.nameBefore) || null,
        nameAfter: clean(e.nameAfter) || null,
        titleBefore: clean(e.titleBefore) || null,
        titleAfter: clean(e.titleAfter) || null,
        departmentBefore: clean(e.departmentBefore) || null,
        departmentAfter: clean(e.departmentAfter) || null,
        emailBefore: clean(e.emailBefore) || null,
        emailAfter: clean(e.emailAfter) || null,
      }))
      // Guard against a client that sends the whole roster: only rows that
      // actually differ are worth emailing.
      .filter((e: StaffEdit) => {
        if (!e.staffId) return false;
        if (e.kind === 'identification') {
          return !!(e.nameAfter || e.titleAfter || e.departmentAfter || e.emailAfter);
        }
        return (
          (e.titleBefore ?? '') !== (e.titleAfter ?? '') ||
          (e.departmentBefore ?? '') !== (e.departmentAfter ?? '')
        );
      });

    if (!edits.length) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Nothing has been changed yet.' }),
      };
    }

    const to = process.env.STAFF_INTAKE_TO_EMAIL || FALLBACK_TO;
    const from = process.env.CONTACT_FROM_EMAIL || 'no-reply@josephcentergj.com';

    const rendered = staffIntake({
      submittedBy: clean(body.submittedBy) || null,
      edits,
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
      body: JSON.stringify({ success: true, edits: edits.length }),
    };
  } catch (err) {
    console.error('submit-staff-intake error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
