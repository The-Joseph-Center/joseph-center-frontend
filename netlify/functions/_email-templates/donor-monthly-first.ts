import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, button, signature, muted,
  formatCurrency, formatDate, escapeHtml, ordinal,
} from './shared';

export interface DonorMonthlyFirstVars {
  firstName: string;
  amountCents: number;
  totalChargedCents: number;
  feeCovered: boolean;
  campaignName?: string | null;
  hasMailingAddress: boolean;
  stripeReceiptUrl?: string | null;
  donationDate?: Date;
}

export function donorMonthlyFirst(v: DonorMonthlyFirstVars): RenderedEmail {
  const date = v.donationDate ?? new Date();
  const dateStr = formatDate(date);
  const dayOfMonth = ordinal(date.getDate());
  const amount = formatCurrency(v.amountCents);
  const total = formatCurrency(v.totalChargedCents);

  const summaryRows: { label: string; value: string }[] = [
    { label: 'Amount', value: `${amount}/month` },
    { label: 'First charge', value: dateStr },
    { label: 'Next charge', value: `${dayOfMonth} of each month` },
  ];
  if (v.feeCovered) summaryRows.push({ label: 'Processing fee', value: 'Covered by you — thank you.' });
  summaryRows.push({ label: 'Total charged today', value: total });

  const campaignBlock = v.campaignName
    ? p(`Your giving supports: <strong>${escapeHtml(v.campaignName)}</strong>`)
    : '';
  const receiptBtn = v.stripeReceiptUrl ? button('View your Stripe receipt', v.stripeReceiptUrl) : '';
  const mailingNote = v.hasMailingAddress
    ? p('Watch your mailbox — Mona will be sending you a personal note.')
    : '';

  const bodyHtml = `
${h1(`Welcome, ${escapeHtml(v.firstName)}.`)}
${p(`You're now a monthly partner of The Joseph Center. That means a lot.`)}
${p(`Your first gift of <strong>${amount}</strong> has been processed, and you'll be charged on the <strong>${dayOfMonth}</strong> of each month going forward.`)}
${campaignBlock}
${summaryTable(summaryRows)}
${receiptBtn}
${p('Monthly partners are the reason The Joseph Center can plan ahead — hire staff, stock the pantry, keep the lights on. You\'re part of what makes that possible.')}
${p('To update your payment method or make changes to your recurring gift, reply to this email or contact us at <a href="mailto:jc@josephcentergj.com" style="color:#1B4D4A;text-decoration:underline;">jc@josephcentergj.com</a>.')}
${mailingNote}
${signature({ name: 'Mona Highline', title: 'Founder & CEO, The Joseph Center' })}
${muted('No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.')}
`.trim();

  const text = wrapText(`
Hi ${v.firstName},

You're now a monthly partner of The Joseph Center. That means a lot.

Your first gift of ${amount} has been processed, and you'll be charged on the ${dayOfMonth} of each month going forward.

${v.campaignName ? `Your giving supports: ${v.campaignName}\n\n` : ''}Gift summary
- Amount: ${amount}/month
- First charge: ${dateStr}
- Next charge: ${dayOfMonth} of each month${v.feeCovered ? `\n- Processing fee: Covered by you — thank you.` : ''}
- Total charged today: ${total}

${v.stripeReceiptUrl ? `View your Stripe receipt: ${v.stripeReceiptUrl}\n\n` : ''}Monthly partners are the reason The Joseph Center can plan ahead — hire staff, stock the pantry, keep the lights on. You're part of what makes that possible.

To update your payment method or make changes to your recurring gift, reply to this email or contact us at jc@josephcentergj.com.
${v.hasMailingAddress ? '\nWatch your mailbox — Mona will be sending you a personal note.\n' : ''}
With gratitude,
Mona Highline
Founder & CEO, The Joseph Center

No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.
  `, true);

  return {
    subject: 'Welcome to monthly giving — The Joseph Center',
    html: renderShell({ previewText: `Your first gift of ${amount} has been processed.`, bodyHtml, taxLine: true }),
    text,
  };
}
