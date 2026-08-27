import type { Context } from '@netlify/functions';
import { Resend } from 'resend';
import { createClient } from '@libsql/client/web';

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'jc@josephcentergj.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'no-reply@josephcentergj.com';
// Was left as the literal scaffold placeholder ##CLIENT_DOMAIN##, which shipped
// straight into the subject line of every contact email.
const SITE_DOMAIN = process.env.VITE_SITE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  || 'josephcentergj.com';

export default async (req: Request, _context: Context) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { name, email, message } = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Name, email, and message are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Keep a copy before sending the notification.
    //
    // Until now a contact message existed only as an email, so a deleted or
    // filtered message was simply gone, with no record that anyone had written
    // in. The dashboard inbox is the durable copy; the email is the nudge.
    //
    // Wrapped and non-fatal on purpose, in both directions: a database problem
    // must not swallow the message the way an INSERT-then-email ordering once
    // lost five forms' worth of submissions, and equally the sender should not
    // see an error because a row failed to write when the email went out fine.
    try {
      const db = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
      await db.execute({
        sql: 'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
        args: [String(name).slice(0, 200), String(email).slice(0, 200), null, String(message).slice(0, 5000)],
      });
    } catch (dbErr) {
      console.error('send-message: could not store the message:', dbErr);
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New message from ${name} via ${SITE_DOMAIN}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0e7490; margin-bottom: 24px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top; width: 100px;">Name</td>
              <td style="padding: 8px 12px; color: #1f2937;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top;">Email</td>
              <td style="padding: 8px 12px; color: #1f2937;"><a href="mailto:${escapeHtml(email)}" style="color: #0e7490;">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top;">Message</td>
              <td style="padding: 8px 12px; color: #1f2937; white-space: pre-wrap;">${escapeHtml(message)}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Sent from the contact form on ${SITE_DOMAIN}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send message error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
