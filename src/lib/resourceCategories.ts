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
  { value: 'native-american', label: 'Native American Resources' },
  { value: 'community',       label: 'Community Organizations' },
  { value: 'calendars',       label: 'Calendars & Events' },
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]['value'];

export function categoryLabel(value: string): string {
  return RESOURCE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
