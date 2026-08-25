import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, BRAND, escapeHtml,
} from './shared';
// Same module the site and Studio use, so the email names departments exactly
// as the dropdown does — these get keyed straight into Sanity.
import { departmentLabel } from '../../../src/lib/departments';

// TEMPORARY — companion to the staff intake tool on /staff. Delete this file
// together with submit-staff-intake.ts and StaffIntakeSection.vue once the
// submissions are in and the details have been entered into Sanity.

export interface IntakeIdentification {
  designation: string;      // stable code shown beside the photo, e.g. IMG-02302D
  imageUrl: string;
  filename?: string | null;
  assetId: string;
  name?: string | null;
  title?: string | null;
  departments?: string[];
  quote?: string | null;
}

export interface IntakeCorrection {
  name: string;             // read-only on the form — identifies the person
  staffId: string;
  titleBefore?: string | null;
  titleAfter?: string | null;
  departmentsBefore?: string[];
  departmentsAfter?: string[];
}

export interface StaffIntakeVars {
  submittedBy?: string | null;
  identifications: IntakeIdentification[];
  corrections: IntakeCorrection[];
}

const dash = (v?: string | null) => (v && v.trim() ? v.trim() : '—');
const list = (v?: string[]) => (v && v.length ? v.map(departmentLabel).join(', ') : '—');

function identificationBlock(item: IntakeIdentification): string {
  // The thumbnail is inlined so the photo and its answers stay together — the
  // whole point is being able to match one to the other without cross-checking
  // a separate list.
  const thumb = `
${p(`<img src="${escapeHtml(item.imageUrl)}?w=260&h=260&fit=crop&auto=format" width="130" height="130" alt="${escapeHtml(item.designation)}" style="display:block;border-radius:6px;border:1px solid #e7e1d3;">`)}`;

  return `
${p(`<strong style="font-family:monospace;font-size:15px;color:${BRAND.primary};">${escapeHtml(item.designation)}</strong>`)}
${thumb}
${summaryTable([
  { label: 'Name', value: dash(item.name) },
  { label: 'Title', value: dash(item.title) },
  { label: 'Department(s)', value: list(item.departments) },
  { label: 'Quote', value: dash(item.quote) },
  { label: 'File', value: dash(item.filename) },
  { label: 'Asset ID', value: item.assetId },
])}
`;
}

function correctionBlock(item: IntakeCorrection): string {
  const titleChanged = dash(item.titleBefore) !== dash(item.titleAfter);
  const deptChanged = list(item.departmentsBefore) !== list(item.departmentsAfter);

  const rows = [{ label: 'Staff member', value: item.name }];
  if (titleChanged) {
    rows.push({ label: 'Title — was', value: dash(item.titleBefore) });
    rows.push({ label: 'Title — now', value: dash(item.titleAfter) });
  }
  if (deptChanged) {
    rows.push({ label: 'Department — was', value: list(item.departmentsBefore) });
    rows.push({ label: 'Department — now', value: list(item.departmentsAfter) });
  }
  rows.push({ label: 'Document ID', value: item.staffId });

  return summaryTable(rows);
}

export function staffIntake(v: StaffIntakeVars): RenderedEmail {
  const idCount = v.identifications.length;
  const corrCount = v.corrections.length;

  const parts: string[] = [h1('Staff intake submission')];

  parts.push(
    p(
      `${idCount} photo${idCount === 1 ? '' : 's'} identified · ` +
        `${corrCount} existing record${corrCount === 1 ? '' : 's'} changed` +
        (v.submittedBy ? ` · submitted by ${escapeHtml(v.submittedBy)}` : '')
    )
  );

  if (idCount) {
    parts.push(p('<strong>Photo identifications</strong>'));
    parts.push(...v.identifications.map(identificationBlock));
  }

  if (corrCount) {
    parts.push(p('<strong>Changes to existing staff</strong>'));
    parts.push(...v.corrections.map(correctionBlock));
  }

  const textLines = [
    'STAFF INTAKE SUBMISSION',
    `${idCount} photo(s) identified, ${corrCount} existing record(s) changed`,
    v.submittedBy ? `Submitted by: ${v.submittedBy}` : '',
    '',
  ];

  for (const i of v.identifications) {
    textLines.push(
      `[${i.designation}]`,
      `  Name:        ${dash(i.name)}`,
      `  Title:       ${dash(i.title)}`,
      `  Department:  ${list(i.departments)}`,
      `  Quote:       ${dash(i.quote)}`,
      `  File:        ${dash(i.filename)}`,
      `  Image:       ${i.imageUrl}`,
      `  Asset ID:    ${i.assetId}`,
      ''
    );
  }

  for (const c of v.corrections) {
    textLines.push(
      `[${c.name}]`,
      `  Title:       ${dash(c.titleBefore)}  ->  ${dash(c.titleAfter)}`,
      `  Department:  ${list(c.departmentsBefore)}  ->  ${list(c.departmentsAfter)}`,
      `  Document ID: ${c.staffId}`,
      ''
    );
  }

  return {
    subject: `Staff intake — ${idCount} photo${idCount === 1 ? '' : 's'} identified, ${corrCount} change${corrCount === 1 ? '' : 's'}`,
    html: renderShell({
      previewText: `${idCount} identified, ${corrCount} changed`,
      bannerColor: BRAND.accent,
      bannerLabel: 'Staff intake',
      bodyHtml: parts.join('\n'),
    }),
    text: wrapText(textLines.filter((l) => l !== undefined).join('\n')),
  };
}
