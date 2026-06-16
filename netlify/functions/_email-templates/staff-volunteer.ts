import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, BRAND, escapeHtml,
} from './shared';

export interface StaffVolunteerVars {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  volunteerType: 'program' | 'skills';
  departments?: string[];
  availabilitySummary?: string | null;
  skills?: string[];
  message?: string | null;
}

export function staffVolunteer(v: StaffVolunteerVars): RenderedEmail {
  const fullName = `${v.firstName} ${v.lastName}`.trim();

  const applicantRows = [
    { label: 'Name', value: fullName },
    { label: 'Email', value: v.email },
    { label: 'Phone', value: v.phone || '—' },
    { label: 'Type', value: v.volunteerType === 'program' ? 'Program volunteer' : 'Skills volunteer' },
  ];

  const programBlock =
    v.volunteerType === 'program'
      ? `
${p('<strong>Departments</strong>')}
${summaryTable([
  { label: 'Where they want to help', value: v.departments?.join(', ') || '—' },
  { label: 'Availability', value: v.availabilitySummary || '—' },
])}
`
      : '';

  const skillsBlock =
    v.volunteerType === 'skills'
      ? `
${p('<strong>Skills offered</strong>')}
${summaryTable([
  { label: 'Skills', value: v.skills?.join(', ') || '—' },
])}
`
      : '';

  const messageBlock = v.message
    ? `${p('<strong>Their message</strong>')}${p(escapeHtml(v.message).replace(/\n/g, '<br>'))}`
    : '';

  const bodyHtml = `
${h1('New volunteer application')}
${p('<strong>Applicant</strong>')}
${summaryTable(applicantRows)}
${programBlock}
${skillsBlock}
${messageBlock}
`.trim();

  const text = wrapText(`
A new volunteer application has been submitted.

Applicant
- Name: ${fullName}
- Email: ${v.email}
- Phone: ${v.phone || '—'}
- Type: ${v.volunteerType}

${v.volunteerType === 'program' ? `Departments: ${v.departments?.join(', ') || '—'}\nAvailability: ${v.availabilitySummary || '—'}\n` : ''}${v.volunteerType === 'skills' ? `Skills: ${v.skills?.join(', ') || '—'}\n` : ''}
${v.message ? `Their message:\n${v.message}\n` : ''}
  `);

  return {
    subject: `New volunteer application — ${fullName}`,
    html: renderShell({
      previewText: `${fullName} · ${v.volunteerType === 'program' ? 'Program' : 'Skills'} volunteer`,
      bannerColor: BRAND.accent,
      bannerLabel: 'Staff notification',
      bodyHtml,
    }),
    text,
  };
}
