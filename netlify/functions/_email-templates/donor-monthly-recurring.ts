import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, button, muted,
  formatCurrency, formatDate, escapeHtml, ordinal, BRAND
} from './shared';

export interface DonorMonthlyRecurringVars {
  firstName: string;
  amountCents: number;
  totalChargedCents: number;
  stripeReceiptUrl?: string | null;
  donationDate?: Date;
}

export function donorMonthlyRecurring(v: DonorMonthlyRecurringVars): RenderedEmail {
  const date = v.donationDate ?? new Date();
  const dateStr = formatDate(date);
  const dayOfMonth = ordinal(date.getDate());
  const amount = formatCurrency(v.amountCents);
  const total = formatCurrency(v.totalChargedCents);

  const summaryRows = [
    { label: 'Amount', value: amount },
    { label: 'Date', value: dateStr },
    { label: 'Next charge', value: `${dayOfMonth} of next month` },
    { label: 'Total charged', value: total },
  ];

  const receiptBtn = v.stripeReceiptUrl ? button('View your Stripe receipt', v.stripeReceiptUrl) : '';

  const bodyHtml = `
${h1(`Thanks for showing up again, ${escapeHtml(v.firstName)}.`)}
${p(`Your monthly gift of <strong>${amount}</strong> to The Joseph Center has been processed.`)}
${summaryTable(summaryRows)}
${receiptBtn}
${p('Manage your monthly gift — change your card, adjust the amount, or stop it — any time in the <a href="' + BRAND.portalUrl + '" style="color:#1B4D4A;text-decoration:underline;">donor portal</a>. Enter your email there and Stripe sends you a sign-in link. For anything else, including a change of mailing address, reply to this email or contact us at <a href="mailto:jc@josephcentergj.com" style="color:#1B4D4A;text-decoration:underline;">jc@josephcentergj.com</a>.')}
${muted('No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.')}
`.trim();

  const text = wrapText(`
Hi ${v.firstName},

Your monthly gift of ${amount} to The Joseph Center has been processed. Thank you for showing up again this month.

Gift summary
- Amount: ${amount}
- Date: ${dateStr}
- Next charge: ${dayOfMonth} of next month
- Total charged: ${total}

${v.stripeReceiptUrl ? `View your Stripe receipt: ${v.stripeReceiptUrl}\n\n` : ''}Manage your monthly gift — change your card, adjust the amount, or stop it — any time in the donor portal: ${BRAND.portalUrl}\nEnter your email there and Stripe sends you a sign-in link.\n\nFor anything else, including a change of mailing address, reply to this email or contact us at jc@josephcentergj.com.

With gratitude,
The Joseph Center

No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.
  `, true);

  return {
    subject: 'Your monthly gift — The Joseph Center',
    html: renderShell({ previewText: `Your monthly gift of ${amount} has been processed.`, bodyHtml, taxLine: true }),
    text,
  };
}
