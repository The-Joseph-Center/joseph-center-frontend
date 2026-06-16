import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, button, signature, muted,
  formatCurrency, formatDate, escapeHtml,
} from './shared';

export interface DonorOneTimeVars {
  firstName: string;
  amountCents: number;
  totalChargedCents: number;
  feeCovered: boolean;
  campaignName?: string | null;
  hasMailingAddress: boolean;
  stripeReceiptUrl?: string | null;
  donationDate?: Date;
}

export function donorOneTime(v: DonorOneTimeVars): RenderedEmail {
  const date = formatDate(v.donationDate);
  const amount = formatCurrency(v.amountCents);
  const total = formatCurrency(v.totalChargedCents);

  const summaryRows: { label: string; value: string }[] = [
    { label: 'Amount', value: amount },
    { label: 'Date', value: date },
  ];
  if (v.feeCovered) summaryRows.push({ label: 'Processing fee', value: 'Covered by you — thank you.' });
  summaryRows.push({ label: 'Total charged', value: total });

  const campaignBlock = v.campaignName
    ? p(`Your gift supports: <strong>${escapeHtml(v.campaignName)}</strong>`)
    : '';
  const receiptBtn = v.stripeReceiptUrl ? button('View your Stripe receipt', v.stripeReceiptUrl) : '';
  const mailingNote = v.hasMailingAddress
    ? p('And watch your mailbox — Mona will be sending you a personal note.')
    : '';

  const bodyHtml = `
${h1(`Thank you, ${escapeHtml(v.firstName)}.`)}
${p(`Your gift of <strong>${amount}</strong> just made a real difference for someone on the Western Slope.`)}
${campaignBlock}
${summaryTable(summaryRows)}
${receiptBtn}
${p('The Joseph Center is 100% community funded. Gifts like yours are the only reason our doors stay open.')}
${mailingNote}
${signature({ name: 'Mona Highline', title: 'Founder & CEO, The Joseph Center' })}
${muted('No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.')}
`.trim();

  const text = wrapText(`
Hi ${v.firstName},

Your gift of ${amount} just made a real difference for someone on the Western Slope.

${v.campaignName ? `Your gift supports: ${v.campaignName}\n\n` : ''}Gift summary
- Amount: ${amount}
- Date: ${date}${v.feeCovered ? `\n- Processing fee: Covered by you — thank you.` : ''}
- Total charged: ${total}

${v.stripeReceiptUrl ? `View your Stripe receipt: ${v.stripeReceiptUrl}\n\n` : ''}The Joseph Center is 100% community funded. Gifts like yours are the only reason our doors stay open.
${v.hasMailingAddress ? '\nAnd watch your mailbox — Mona will be sending you a personal note.\n' : ''}
With gratitude,
Mona Highline
Founder & CEO, The Joseph Center

No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.
  `);

  return {
    subject: 'Your gift to The Joseph Center',
    html: renderShell({ previewText: `Your gift of ${amount} just made a real difference.`, bodyHtml }),
    text,
  };
}
