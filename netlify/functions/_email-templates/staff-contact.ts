import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, BRAND, escapeHtml,
} from './shared';

export interface StaffContactVars {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  message: string;
}

export function staffContact(v: StaffContactVars): RenderedEmail {
  const fullName = `${v.firstName} ${v.lastName ?? ''}`.trim();

  const fromRows = [
    { label: 'Name', value: fullName },
    { label: 'Email', value: v.email },
    { label: 'Phone', value: v.phone || '—' },
  ];

  const bodyHtml = `
${h1('New message')}
${p('A new message has come in through the contact form.')}
${p('<strong>From</strong>')}
${summaryTable(fromRows)}
${p('<strong>Message</strong>')}
${p(escapeHtml(v.message).replace(/\n/g, '<br>'))}
${p('<em>Reply within one business day per the site\'s stated response time.</em>')}
`.trim();

  const text = wrapText(`
A new message has come in through the contact form.

From
- Name: ${fullName}
- Email: ${v.email}
- Phone: ${v.phone || '—'}

Message:
${v.message}

Reply within one business day per the site's stated response time.
  `);

  return {
    subject: `New message — ${fullName}`,
    html: renderShell({
      previewText: v.message.slice(0, 120),
      bannerColor: BRAND.accent,
      bannerLabel: 'Staff notification',
      bodyHtml,
    }),
    text,
  };
}
