// Resource category labels — keep in sync with the `category` enum on the
// resource Sanity schema (studio/schemas/resource.ts).

export const RESOURCE_CATEGORIES = [
  { value: 'housing',         label: 'Housing & Shelter' },
  { value: 'food',            label: 'Food & Nutrition' },
  { value: 'legal',           label: 'Legal Aid' },
  { value: 'medical',         label: 'Medical & Mental Health' },
  { value: 'financial',       label: 'Financial Assistance' },
  { value: 'employment',      label: 'Employment & Job Training' },
  { value: 'family',          label: 'Family Services' },
  { value: 'recovery',        label: 'Substance Use & Recovery' },
  { value: 'transportation',  label: 'Transportation' },
  { value: 'documents',       label: 'ID & Documents' },
  // Three categories for who somebody is, rather than what they need. A
  // veteran service filed under "Housing & Shelter" is findable and
  // mis-signposted; the people it is for scan for the word "veteran".
  { value: 'seniors',         label: 'Older Adults & Seniors' },
  { value: 'veterans',        label: 'Veterans & Military Families' },
  { value: 'native-american', label: 'Native American Resources' },
  { value: 'community',       label: 'Community Organizations' },
  { value: 'calendars',       label: 'Calendars & Events' },
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]['value'];

export function categoryLabel(value: string): string {
  return RESOURCE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
