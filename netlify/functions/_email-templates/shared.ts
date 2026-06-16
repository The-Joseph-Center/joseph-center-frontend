// Shared email chrome — used by every template in this directory. Produces
// HTML safe for common email clients (Gmail, Apple Mail, Outlook) using
// inline styles + tables for layout. Also produces a plain-text companion.
//
// Files in this folder do NOT become Netlify functions on their own (only
// files at netlify/functions/*.ts root level are functions). They're
// imported by the real functions.

export const BRAND = {
  name: 'The Joseph Center',
  address1: '2511 Belford Ave #B, Grand Junction, CO 81501',
  phone: '(970) 243-7672',
  email: 'jc@josephcentergj.com',
  website: 'josephcentergj.com',
  // Brand palette per the email spec
  primary: '#1B4D4A',
  accent: '#C49A2B',
  textBody: '#262626',
  textMuted: '#5C5C5C',
  bg: '#F7F5EE',
} as const;

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Hidden preview snippet at the top of every email so inbox listings show
// something more meaningful than the first visible word of body copy.
function previewMeta(previewText: string): string {
  if (!previewText) return '';
  return `<div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</div>`;
}

const FOOTER_HTML = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e7e1d3;margin-top:32px;">
  <tr>
    <td style="padding:24px 32px;font-family:${SYSTEM_FONT_STACK};font-size:13px;color:${BRAND.textMuted};line-height:1.55;">
      <strong style="color:${BRAND.textBody};">${BRAND.name}</strong><br>
      ${BRAND.address1}<br>
      ${BRAND.phone} &middot; <a href="mailto:${BRAND.email}" style="color:${BRAND.primary};text-decoration:none;">${BRAND.email}</a><br>
      <a href="https://${BRAND.website}" style="color:${BRAND.primary};text-decoration:none;">${BRAND.website}</a>
      <br><br>
      The Joseph Center is a 501(c)(3) nonprofit organization.<br>
      Your gift may be tax-deductible to the extent permitted by law.
      <br><br>
      <span style="color:#9a9a9a;">&copy; 2026 The Joseph Center. All rights reserved.</span>
    </td>
  </tr>
</table>
`.trim();

const FOOTER_TEXT = `
${BRAND.name}
${BRAND.address1}
${BRAND.phone} | ${BRAND.email}
${BRAND.website}

The Joseph Center is a 501(c)(3) nonprofit organization.
Your gift may be tax-deductible to the extent permitted by law.

© 2026 The Joseph Center. All rights reserved.
`.trim();

interface ShellOpts {
  previewText?: string;
  // Inner HTML for the body — caller provides paragraph and table markup.
  bodyHtml: string;
  // Banner color override (defaults to primary). e.g. gold for staff alerts.
  bannerColor?: string;
  // Banner label, defaults to brand name.
  bannerLabel?: string;
}

export function renderShell(opts: ShellOpts): string {
  const banner = opts.bannerColor ?? BRAND.primary;
  const label = opts.bannerLabel ?? BRAND.name;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(label)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:${SYSTEM_FONT_STACK};color:${BRAND.textBody};">
${previewMeta(opts.previewText ?? '')}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.bg};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:${banner};padding:20px 32px;font-family:${SYSTEM_FONT_STACK};color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
            ${escapeHtml(label)}
          </td>
        </tr>
        <tr>
          <td style="padding:32px;font-family:${SYSTEM_FONT_STACK};color:${BRAND.textBody};font-size:16px;line-height:1.65;">
            ${opts.bodyHtml}
          </td>
        </tr>
        <tr>
          <td>${FOOTER_HTML}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function wrapText(content: string): string {
  return `${content.trim()}\n\n--\n\n${FOOTER_TEXT}\n`;
}

// ─── Inline-style helpers ────────────────────────────────────────────────

export function h1(text: string): string {
  return `<h1 style="font-family:${SYSTEM_FONT_STACK};font-size:22px;font-weight:700;color:${BRAND.textBody};margin:0 0 16px 0;line-height:1.3;">${escapeHtml(text)}</h1>`;
}

export function p(html: string): string {
  return `<p style="margin:0 0 16px 0;color:${BRAND.textBody};font-size:16px;line-height:1.65;">${html}</p>`;
}

export function muted(html: string): string {
  return `<p style="margin:0 0 16px 0;color:${BRAND.textMuted};font-size:14px;line-height:1.55;font-style:italic;">${html}</p>`;
}

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr><td bgcolor="${BRAND.primary}" style="border-radius:4px;">
    <a href="${escapeAttr(href)}" style="display:inline-block;padding:12px 24px;font-family:${SYSTEM_FONT_STACK};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}

export function summaryTable(rows: { label: string; value: string }[]): string {
  const trs = rows
    .map(
      (r) => `<tr>
  <td style="padding:8px 0;font-size:14px;color:${BRAND.textMuted};vertical-align:top;">${escapeHtml(r.label)}</td>
  <td style="padding:8px 0;font-size:14px;color:${BRAND.textBody};text-align:right;font-weight:600;vertical-align:top;">${escapeHtml(r.value)}</td>
</tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;border-top:1px solid #efebe0;border-bottom:1px solid #efebe0;">${trs}</table>`;
}

export function signature(opts: { name: string; title?: string }): string {
  return `<p style="margin:24px 0 0 0;color:${BRAND.textBody};font-size:16px;line-height:1.55;">
    With gratitude,<br>
    <strong>${escapeHtml(opts.name)}</strong>${opts.title ? `<br><span style="color:${BRAND.textMuted};font-size:14px;">${escapeHtml(opts.title)}</span>` : ''}
  </p>`;
}

// ─── String helpers ──────────────────────────────────────────────────────

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(s: string): string {
  return escapeHtml(s);
}
