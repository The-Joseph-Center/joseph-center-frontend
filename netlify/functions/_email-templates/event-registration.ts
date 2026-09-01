import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, escapeHtml, BRAND,
} from './shared';

export interface EventRegistrationVars {
  firstName: string;
  eventTitle: string;
  /** ISO datetime from Sanity. Omitted if the event has no date set. */
  eventDate?: string | null;
  /** Already flattened to plain text by the caller. */
  location?: string | null;
  partySize?: number;
}

/**
 * The confirmation someone gets after registering for an event.
 *
 * This used to be a bare plain-text send — "You're confirmed for X. We'll see
 * you there!" — with no branding and, more to the point, no date, time or
 * address. The one thing a registration confirmation has to do is tell someone
 * when and where to turn up.
 */
export function eventRegistration(v: EventRegistrationVars): RenderedEmail {
  const when = v.eventDate
    ? new Date(v.eventDate).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver',
      })
    : null;

  const rows = [{ label: 'Event', value: v.eventTitle }];
  if (when) rows.push({ label: 'When', value: when });
  if (v.location) rows.push({ label: 'Where', value: v.location });
  if (v.partySize && v.partySize > 1) rows.push({ label: 'Party size', value: String(v.partySize) });

  const bodyHtml = `
${h1(`You're registered, ${escapeHtml(v.firstName)}.`)}
${p(`We have your spot for <strong>${escapeHtml(v.eventTitle)}</strong>.`)}
${summaryTable(rows)}
${p(`If your plans change, or you need anything before then, reply to this email or call us at <a href="tel:+1${BRAND.phone.replace(/\D/g, '')}" style="color:${BRAND.primary};text-decoration:underline;">${BRAND.phone}</a>.`)}
${p(`<strong>See you there.</strong><br>${BRAND.name}`)}
`.trim();

  const text = wrapText(`
Hi ${v.firstName},

We have your spot for ${v.eventTitle}.

${rows.map((r) => `${r.label}: ${r.value}`).join('\n')}

If your plans change, or you need anything before then, reply to this email or call us at ${BRAND.phone}.

See you there.
${BRAND.name}
  `);

  return {
    subject: `You're registered for ${v.eventTitle}`,
    html: renderShell({
      previewText: when ? `${v.eventTitle} — ${when}` : `You're registered for ${v.eventTitle}.`,
      bodyHtml,
    }),
    text,
  };
}
