import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, button, BRAND,
  formatCurrency, formatDate, escapeHtml,
} from './shared';

export interface StaffDonationVars {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  mailingAddress?: string | null;
  amountCents: number;
  totalChargedCents: number;
  frequency: 'one-time' | 'monthly';
  campaignName?: string | null;
  feeCovered: boolean;
  stripeReceiptUrl?: string | null;
  donationDate?: Date;
  // Marks this email as a renewal notification rather than a new donor
  isRenewal?: boolean;
}

export function staffDonation(v: StaffDonationVars): RenderedEmail {
  const date = formatDate(v.donationDate);
  const amount = formatCurrency(v.amountCents);
  const total = formatCurrency(v.totalChargedCents);
  const fullName = `${v.firstName} ${v.lastName}`.trim();

  const subjectPrefix = v.isRenewal ? 'Monthly renewal' : 'New gift';

  const donorRows = [
    { label: 'Name', value: fullName },
    { label: 'Email', value: v.email },
    { label: 'Phone', value: v.phone || '—' },
    { label: 'Mailing address', value: v.mailingAddress || '—' },
  ];
  const giftRows = [
    { label: 'Amount', value: amount },
    { label: 'Frequency', value: v.frequency === 'monthly' ? 'Monthly' : 'One-Time' },
    { label: 'Date', value: date },
    { label: 'Campaign', value: v.campaignName || '—' },
    { label: 'Fee covered', value: v.feeCovered ? 'Yes' : 'No' },
    { label: 'Total charged', value: total },
  ];

  const stripeBtn = v.stripeReceiptUrl ? button('View in Stripe', v.stripeReceiptUrl) : '';

  const bodyHtml = `
${h1(v.isRenewal ? `Monthly renewal — ${escapeHtml(fullName)}` : `A new donation has been received.`)}
${p('<strong>Donor</strong>')}
${summaryTable(donorRows)}
${p('<strong>Gift</strong>')}
${summaryTable(giftRows)}
${stripeBtn}
`.trim();

  const text = wrapText(`
${v.isRenewal ? `Monthly renewal — ${fullName}` : 'A new donation has been received.'}

Donor
- Name: ${fullName}
- Email: ${v.email}
- Phone: ${v.phone || '—'}
- Mailing address: ${v.mailingAddress || '—'}

Gift
- Amount: ${amount}
- Frequency: ${v.frequency === 'monthly' ? 'Monthly' : 'One-Time'}
- Date: ${date}
- Campaign: ${v.campaignName || '—'}
- Fee covered: ${v.feeCovered ? 'Yes' : 'No'}
- Total charged: ${total}

${v.stripeReceiptUrl ? `View in Stripe: ${v.stripeReceiptUrl}\n` : ''}
  `);

  return {
    subject: `${subjectPrefix} — ${fullName} · ${amount}`,
    html: renderShell({
      previewText: `${fullName} · ${amount} · ${v.frequency === 'monthly' ? 'Monthly' : 'One-Time'}`,
      bannerColor: BRAND.accent,
      bannerLabel: 'Staff notification',
      bodyHtml,
    }),
    text,
  };
}
