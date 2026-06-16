import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { staffContact } from './_email-templates/staff-contact';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email, message, phone } = body;

    if (!name || !email || !message) {
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'name, email, and message are required' }) };
    }

    const to = process.env.CONTACT_TO_EMAIL;
    if (!to) {
      console.error('CONTACT_TO_EMAIL not configured');
      return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Recipient not configured' }) };
    }

    const trimmed = String(name).trim();
    const firstSpace = trimmed.indexOf(' ');
    const firstName = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
    const lastName = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();

    const rendered = staffContact({
      firstName,
      lastName,
      email,
      phone: phone || null,
      message,
    });

    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
      to: to.split(',').map((s) => s.trim()).filter(Boolean),
      replyTo: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('submit-contact error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Failed to send message' }) };
  }
};
