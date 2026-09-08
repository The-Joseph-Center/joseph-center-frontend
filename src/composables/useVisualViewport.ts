import { onMounted, onUnmounted } from 'vue';

/**
 * Keeps the layout honest while the page is pinch-zoomed.
 *
 * A `position: fixed` element is placed against the LAYOUT viewport, which does
 * not change when someone pinch-zooms — only the VISUAL viewport does. So at 2×
 * zoom a fixed full-width header is still as wide as the whole unzoomed page:
 * most of it sits off-screen, the logo drifts out of view, and a bottom-right
 * floating button can land somewhere the reader cannot reach at all. Nothing is
 * broken in the CSS; the browser is doing exactly what `fixed` asks for.
 *
 * This publishes the visual viewport's real size and offset as custom
 * properties, and marks the document while a zoom is active:
 *
 *   --vv-width / --vv-height   what the reader can actually see
 *   --vv-left  / --vv-top      where that sits inside the layout viewport
 *   data-zoomed="true"         set once the scale is meaningfully above 1
 *
 * Browsers without visualViewport get nothing set and the existing behaviour,
 * which is the current behaviour — so this can only improve matters.
 */
const ZOOM_THRESHOLD = 1.05;   // ignore the rounding noise around 1

export function useVisualViewport() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
  if (!vv) return;

  let frame = 0;

  const apply = () => {
    frame = 0;
    const root = document.documentElement;
    root.style.setProperty('--vv-width', `${vv.width}px`);
    root.style.setProperty('--vv-height', `${vv.height}px`);
    root.style.setProperty('--vv-left', `${vv.offsetLeft}px`);
    root.style.setProperty('--vv-top', `${vv.offsetTop}px`);
    if (vv.scale > ZOOM_THRESHOLD) root.setAttribute('data-zoomed', 'true');
    else root.removeAttribute('data-zoomed');
  };

  // resize and scroll both fire continuously during a pinch, so coalesce to
  // one write per frame rather than thrashing style recalculation.
  const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };

  onMounted(() => {
    apply();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
  });

  onUnmounted(() => {
    if (frame) cancelAnimationFrame(frame);
    vv.removeEventListener('resize', schedule);
    vv.removeEventListener('scroll', schedule);
    const root = document.documentElement;
    root.removeAttribute('data-zoomed');
    for (const p of ['--vv-width', '--vv-height', '--vv-left', '--vv-top']) root.style.removeProperty(p);
  });
}
