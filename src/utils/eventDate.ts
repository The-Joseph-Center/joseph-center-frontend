/**
 * Event dates, written the way a person would say them.
 *
 * The day only. The Sanity field is a datetime, so every event carries a time
 * whether or not anyone chose one — picking a day in the studio stamps the
 * moment you picked it, which is how a page came to read "Friday, December 25,
 * 2026 at 3:39 PM MST". The site does not announce start times, so none of
 * that belongs on a page; a time that matters goes in the event's own words,
 * where it can be explained.
 */
export function formatEventDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
