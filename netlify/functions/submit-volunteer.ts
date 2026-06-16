import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client/web';
import { Resend } from 'resend';
import { volunteerConfirmation } from './_email-templates/volunteer-confirmation';
import { staffVolunteer } from './_email-templates/staff-volunteer';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Map the form's value keys back to display labels so editor-facing
// emails read clean. Keep in sync with FormsVolunteer.vue's
// departmentOptions array.
const DEPARTMENT_LABELS: Record<string, string> = {
  dayShelter: 'Day Shelter',
  foodPantryKitchen: 'Food Pantry / Kitchen',
  familyCenter: 'Family Center',
  goldenGirlsProject: 'Golden Girls Project',
  events: 'Events',
  whereverNeeded: "Wherever I'm needed",
};

function departmentLabels(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => DEPARTMENT_LABELS[v as string] ?? String(v));
}

function summarizeAvailability(availability: unknown): string {
  if (!availability || typeof availability !== 'object') return '';
  const av = availability as Record<string, unknown>;
  if (av.anytime === true) return 'Anytime';
  const dayShort: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
  };
  const slotShort: Record<string, string> = {
    morning: '9–12', afternoon: '12–3', evening: '3–5',
  };
  const parts: string[] = [];
  for (const [day, label] of Object.entries(dayShort)) {
    const slots = av[day];
    if (!slots || typeof slots !== 'object') continue;
    const s = slots as Record<string, boolean>;
    const picked = Object.entries(slotShort)
      .filter(([slot]) => s[slot])
      .map(([, sl]) => sl);
    if (picked.length) parts.push(`${label} ${picked.join('/')}`);
  }
  return parts.length ? parts.join(' · ') : '—';
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      name, email, phone, departments, availability,
      volunteer_type,
      firstName, lastName,
      anytime,
      aboutYou, anythingElse,
      skills,
      skillsDescription, otherSkills,
    } = body;

    if (!name || !email) {
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'name and email are required' }) };
    }

    // Bundle extras into additional_info JSON.
    const extras: Record<string, unknown> = {};
    if (volunteer_type) extras.volunteer_type = volunteer_type;
    if (firstName) extras.firstName = firstName;
    if (lastName) extras.lastName = lastName;
    if (typeof anytime === 'boolean') extras.anytime = anytime;
    if (aboutYou) extras.aboutYou = aboutYou;
    if (anythingElse) extras.anythingElse = anythingElse;
    if (Array.isArray(skills) && skills.length) extras.skills = skills;
    if (skillsDescription) extras.skillsDescription = skillsDescription;
    if (otherSkills) extras.otherSkills = otherSkills;

    const additionalInfoValue = Object.keys(extras).length
      ? JSON.stringify(extras)
      : null;

    await turso.execute({
      sql: `INSERT INTO volunteer_submissions
            (name, email, phone, departments, availability, additional_info)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        name, email, phone || null,
        departments ? JSON.stringify(departments) : null,
        availability ? JSON.stringify(availability) : null,
        additionalInfoValue,
      ],
    });

    const safeFirstName = (firstName || name.split(' ')[0] || '').toString();
    const safeLastName = (lastName || name.split(' ').slice(1).join(' ') || '').toString();
    const vType: 'program' | 'skills' = volunteer_type === 'skills' ? 'skills' : 'program';

    // ─── Volunteer confirmation (template 5) ──────────────────────────
    const confirmation = volunteerConfirmation({
      firstName: safeFirstName,
      volunteerType: vType,
      departments: vType === 'program' ? departmentLabels(departments) : undefined,
      skills: vType === 'skills' && Array.isArray(skills) ? (skills as string[]) : undefined,
    });
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
      to: [email],
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
    });

    // ─── Staff notification (template 7) ──────────────────────────────
    const staffTo = process.env.STAFF_VOLUNTEER_TO_EMAIL;
    if (staffTo) {
      const message = [aboutYou, anythingElse, skillsDescription, otherSkills]
        .filter(Boolean)
        .join('\n\n');
      const staffEmail = staffVolunteer({
        firstName: safeFirstName,
        lastName: safeLastName,
        email,
        phone: phone || null,
        volunteerType: vType,
        departments: vType === 'program' ? departmentLabels(departments) : undefined,
        availabilitySummary: vType === 'program' ? summarizeAvailability(availability) : null,
        skills: vType === 'skills' && Array.isArray(skills) ? (skills as string[]) : undefined,
        message: message || null,
      });
      await resend.emails.send({
        from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
        to: staffTo.split(',').map((s) => s.trim()).filter(Boolean),
        subject: staffEmail.subject,
        html: staffEmail.html,
        text: staffEmail.text,
      });
    } else {
      console.warn('STAFF_VOLUNTEER_TO_EMAIL not set — staff notification skipped');
    }

    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('submit-volunteer error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
