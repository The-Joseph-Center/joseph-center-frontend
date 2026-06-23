import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';

// Partner Logo Submission — direct-link form at /forms/partner-submit.
// Not linked from nav or footer; the URL is shared out-of-band when JC
// asks a partner to submit. Sends a notification email to staff with the
// submission details. No Sanity write — staff manually adds approved
// partners via Studio.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orgName, url, logoUrl, notes } = body;

    if (!orgName || !url) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Organization name and URL are required' }),
      };
    }

    const to = process.env.STAFF_PARTNER_TO_EMAIL || process.env.CONTACT_TO_EMAIL;
    if (!to) {
      console.error('STAFF_PARTNER_TO_EMAIL or CONTACT_TO_EMAIL not configured');
      return {
        statusCode: 500,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Recipient not configured' }),
      };
    }

    const html = `
      <h2>New Partner Logo Submission</h2>
      <p><strong>Organization:</strong> ${escapeHtml(String(orgName))}</p>
      <p><strong>Website URL:</strong> <a href="${escapeHtml(String(url))}">${escapeHtml(String(url))}</a></p>
      ${logoUrl ? `<p><strong>Logo URL:</strong> <a href="${escapeHtml(String(logoUrl))}">${escapeHtml(String(logoUrl))}</a></p>` : ''}
      ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(String(notes)).replace(/\n/g, '<br>')}</p>` : ''}
      <hr>
      <p style="color: #666; font-size: 12px;">
        To add this partner to the site, upload the logo via Sanity Studio →
        Pages → Home → Partners section.
      </p>
    `;

    const text = [
      'New Partner Logo Submission',
      '',
      `Organization: ${orgName}`,
      `Website URL: ${url}`,
      logoUrl ? `Logo URL: ${logoUrl}` : null,
      notes ? `Notes:\n${notes}` : null,
      '',
      '--',
      'To add this partner to the site, upload the logo via Sanity Studio → Pages → Home → Partners section.',
    ]
      .filter(Boolean)
      .join('\n');

    const sendResult = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
      to: to.split(',').map((s) => s.trim()).filter(Boolean),
      subject: `New Partner Logo Submission: ${orgName}`,
      html,
      text,
    });

    if (sendResult.error) {
      console.error('Resend email failed:', sendResult.error);
      return {
        statusCode: 502,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Notification email failed to send' }),
      };
    }

    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('submit-partner-logo error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
