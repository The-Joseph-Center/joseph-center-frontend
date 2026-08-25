import {
  RenderedEmail, renderShell, wrapText, h1, p, summaryTable, BRAND, escapeHtml,
} from './shared';

// TEMPORARY — companion to the inline staff intake editing on /staff. Delete
// with submit-staff-intake.ts and the intakeMode flag once the answers are in.

export interface StaffEdit {
  staffId: string;
  currentName: string;
  imageUrl?: string | null;
  kind: 'identification' | 'correction';
  nameBefore?: string | null;
  nameAfter?: string | null;
  titleBefore?: string | null;
  titleAfter?: string | null;
  departmentBefore?: string | null;
  departmentAfter?: string | null;
  emailBefore?: string | null;
  emailAfter?: string | null;
}

export interface StaffIntakeVars {
  submittedBy?: string | null;
  edits: StaffEdit[];
}

const dash = (v?: string | null) => (v && v.trim() ? v.trim() : '—');
const changed = (a?: string | null, b?: string | null) => dash(a) !== dash(b);

function editBlock(e: StaffEdit): string {
  // The photo travels with the answers — for the placeholder cards it is the
  // only way to confirm the right person was identified.
  const thumb = e.imageUrl
    ? p(
        `<img src="${escapeHtml(e.imageUrl)}?w=220&h=220&fit=crop&auto=format" width="110" height="110" ` +
          `alt="${escapeHtml(e.currentName)}" style="display:block;border-radius:6px;border:1px solid #e7e1d3;">`
      )
    : '';

  const rows: { label: string; value: string }[] = [];

  if (e.kind === 'identification') {
    rows.push({ label: 'Card', value: e.currentName });
    rows.push({ label: 'Name', value: dash(e.nameAfter) });
    rows.push({ label: 'Title', value: dash(e.titleAfter) });
    rows.push({ label: 'Department', value: dash(e.departmentAfter) });
    rows.push({ label: 'Email', value: dash(e.emailAfter) });
  } else {
    rows.push({ label: 'Staff member', value: e.currentName });
    if (changed(e.titleBefore, e.titleAfter)) {
      rows.push({ label: 'Title — was', value: dash(e.titleBefore) });
      rows.push({ label: 'Title — now', value: dash(e.titleAfter) });
    }
    if (changed(e.departmentBefore, e.departmentAfter)) {
      rows.push({ label: 'Department — was', value: dash(e.departmentBefore) });
      rows.push({ label: 'Department — now', value: dash(e.departmentAfter) });
    }
  }

  rows.push({ label: 'Document ID', value: e.staffId });
  return `${thumb}${summaryTable(rows)}`;
}

export function staffIntake(v: StaffIntakeVars): RenderedEmail {
  const ids = v.edits.filter((e) => e.kind === 'identification');
  const corr = v.edits.filter((e) => e.kind === 'correction');

  const parts: string[] = [h1('Staff page edits')];
  parts.push(
    p(
      `${ids.length} card${ids.length === 1 ? '' : 's'} identified · ` +
        `${corr.length} detail${corr.length === 1 ? '' : 's'} corrected` +
        (v.submittedBy ? ` · submitted by ${escapeHtml(v.submittedBy)}` : '')
    )
  );

  if (ids.length) {
    parts.push(p('<strong>Identified from the unnamed cards</strong>'));
    parts.push(...ids.map(editBlock));
  }
  if (corr.length) {
    parts.push(p('<strong>Corrections to existing staff</strong>'));
    parts.push(...corr.map(editBlock));
  }

  const lines: string[] = [
    'STAFF PAGE EDITS',
    `${ids.length} card(s) identified, ${corr.length} detail(s) corrected`,
    v.submittedBy ? `Submitted by: ${v.submittedBy}` : '',
    '',
  ];
  for (const e of ids) {
    lines.push(
      `[${e.currentName}]  (identified)`,
      `  Name:        ${dash(e.nameAfter)}`,
      `  Title:       ${dash(e.titleAfter)}`,
      `  Department:  ${dash(e.departmentAfter)}`,
      `  Email:       ${dash(e.emailAfter)}`,
      `  Photo:       ${e.imageUrl ?? '—'}`,
      `  Document ID: ${e.staffId}`,
      ''
    );
  }
  for (const e of corr) {
    lines.push(`[${e.currentName}]`);
    if (changed(e.titleBefore, e.titleAfter)) {
      lines.push(`  Title:       ${dash(e.titleBefore)}  ->  ${dash(e.titleAfter)}`);
    }
    if (changed(e.departmentBefore, e.departmentAfter)) {
      lines.push(`  Department:  ${dash(e.departmentBefore)}  ->  ${dash(e.departmentAfter)}`);
    }
    lines.push(`  Document ID: ${e.staffId}`, '');
  }

  return {
    subject: `Staff page edits — ${ids.length} identified, ${corr.length} corrected`,
    html: renderShell({
      previewText: `${ids.length} identified, ${corr.length} corrected`,
      bannerColor: BRAND.accent,
      bannerLabel: 'Staff page edits',
      bodyHtml: parts.join('\n'),
    }),
    text: wrapText(lines.join('\n')),
  };
}
