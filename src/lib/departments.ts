// Staff departments — keep the `value` list in sync with the `departments`
// field options on the staff Sanity schema (studio/schemas/staff.ts).
//
// Departments are an org-chart concept, not a content type: only some of them
// have a public program page. That's why staff carry a department string rather
// than a reference to a `program` document — `it-marketing`, `maintenance`,
// `security` and `operations` have no document to point at.

export const DEPARTMENTS = [
  { value: 'day-shelter',   label: 'Day Shelter' },
  { value: 'family-center', label: 'Family Center' },
  { value: 'golden-girls',  label: 'Golden Girls Project' },
  { value: 'ifs',           label: 'Integrated Financial Services' },
  { value: 'it-marketing',  label: 'IT & Marketing' },
  { value: 'kitchen',       label: 'Kitchen & Food Services' },
  { value: 'maintenance',   label: 'Maintenance' },
  { value: 'security',      label: 'Security' },
  { value: 'operations',    label: 'Operations' },
  // Triage bucket for staff whose name, title or department isn't confirmed
  // yet. Maps to no program page, so these people appear on /staff only until
  // someone in Operations reassigns them.
  { value: 'unknown',       label: 'Unknown / Needs Review' },
] as const;

export type Department = (typeof DEPARTMENTS)[number]['value'];

export const DEPARTMENT_LABELS: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.value, d.label])
);

/**
 * Which department staffs each program page. Program slugs that aren't listed
 * here simply render no staff section — that's the intended behavior for any
 * future program without a dedicated team.
 *
 * Note the two names that don't match: the `ifs` department serves
 * /programs/integrated-financial-services, and the `kitchen` department serves
 * /programs/food-pantry.
 */
export const PROGRAM_SLUG_TO_DEPARTMENT: Record<string, Department> = {
  'day-shelter': 'day-shelter',
  'family-center': 'family-center',
  'golden-girls': 'golden-girls',
  'integrated-financial-services': 'ifs',
  'food-pantry': 'kitchen',
};

export function departmentForProgramSlug(slug: string | undefined | null): Department | null {
  if (!slug) return null;
  return PROGRAM_SLUG_TO_DEPARTMENT[slug] ?? null;
}

export function departmentLabel(value: string): string {
  return DEPARTMENT_LABELS[value] ?? value;
}
