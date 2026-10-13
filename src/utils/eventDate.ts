/**
 * Event dates, written the way a person would say them.
 *
 * The Sanity field is a datetime, so every event carries a time whether or not
 * anyone chose one — picking a day in the studio stamps the moment you picked
 * it. That is how "Friday, December 25, 2026 at 3:39 PM MST" reaches a page:
 * 3:39 was when someone was at their desk, not when anything starts.
 *
 * So a time is shown only when it looks chosen. Events start on the hour or a
 * quarter past it; 3:39 PM does not. The rule is crude and occasionally wrong,
 * and it is wrong in the safe direction — a missing time reads as "we have not
 * said yet", while an invented one sends somebody to a locked door.
 */

/** Midnight is a date with no time, whatever the field says. */
function looksDeliberate(d: Date): boolean {
  const minutes = d.getMinutes();
  const hours = d.getHours();
  if (hours === 0 && minutes === 0) return false;
  return minutes % 15 === 0;
}

export interface EventDateParts {
  /** "Friday, December 25, 2026" */
  date: string;
  /** "6:30 PM", or null when no time was chosen. */
  time: string | null;
  /** Both, joined the way they are shown: "Friday, December 25, 2026 · 6:30 PM" */
  full: string;
}

export function formatEventDate(value?: string | null): EventDateParts | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const date = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const time = looksDeliberate(d)
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '')
    : null;

  return { date, time, full: time ? `${date} · ${time}` : date };
}
