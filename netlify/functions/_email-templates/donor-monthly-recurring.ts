import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, button, muted,
  formatCurrency, formatDate, escapeHtml, ordinal,
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
${p('To update your payment method or make changes to your recurring gift, reply to this email or contact us at <a href="mailto:jc@josephcentergj.com" style="color:#1B4D4A;text-decoration:underline;">jc@josephcentergj.com</a>.')}
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

${v.stripeReceiptUrl ? `View your Stripe receipt: ${v.stripeReceiptUrl}\n\n` : ''}To update your payment method or make changes to your recurring gift, reply to this email or contact us at jc@josephcentergj.com.

With gratitude,
The Joseph Center

No goods or services were provided in exchange for this contribution. Please retain this email for your tax records.
  `);

  return {
    subject: 'Your monthly gift — The Joseph Center',
    html: renderShell({ previewText: `Your monthly gift of ${amount} has been processed.`, bodyHtml }),
    text,
  };
}
