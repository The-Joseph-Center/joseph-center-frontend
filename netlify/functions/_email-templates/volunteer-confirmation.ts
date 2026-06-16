import {
  RenderedEmail, renderShell, wrapText, h1, p, escapeHtml,
} from './shared';

export interface VolunteerConfirmationVars {
  firstName: string;
  volunteerType: 'program' | 'skills';
  departments?: string[];   // for program volunteers
  skills?: string[];        // for skills volunteers
}

export function volunteerConfirmation(v: VolunteerConfirmationVars): RenderedEmail {
  const departmentsLine =
    v.volunteerType === 'program' && v.departments && v.departments.length
      ? p(`<strong>Where you'd like to help:</strong> ${escapeHtml(v.departments.join(', '))}`)
      : '';
  const skillsLine =
    v.volunteerType === 'skills' && v.skills && v.skills.length
      ? p(`<strong>Skills you're offering:</strong> ${escapeHtml(v.skills.join(', '))}`)
      : '';

  const bodyHtml = `
${h1(`We're glad you're here, ${escapeHtml(v.firstName)}.`)}
${p(`Someone from our team will be in touch within one business day to find the best fit for you.`)}
${departmentsLine}
${skillsLine}
${p('In the meantime, if you have any questions, reach us at <a href="mailto:jc@josephcentergj.com" style="color:#1B4D4A;text-decoration:underline;">jc@josephcentergj.com</a> or (970) 243-7672.')}
${p(`<strong>We'll talk soon.</strong><br>The Joseph Center`)}
`.trim();

  const text = wrapText(`
Hi ${v.firstName},

We're glad you want to help. Someone from our team will be in touch within one business day to find the best fit for you.

${v.volunteerType === 'program' && v.departments?.length ? `Where you'd like to help: ${v.departments.join(', ')}\n\n` : ''}${v.volunteerType === 'skills' && v.skills?.length ? `Skills you're offering: ${v.skills.join(', ')}\n\n` : ''}In the meantime, if you have any questions, reach us at jc@josephcentergj.com or (970) 243-7672.

We'll talk soon.
The Joseph Center
  `);

  return {
    subject: 'We got your volunteer application — The Joseph Center',
    html: renderShell({ previewText: "We'll be in touch within one business day.", bodyHtml }),
    text,
  };
}
