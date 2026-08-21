<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSanity } from '@/composables/useSanity';

// /transparency — a fund-allocation donut ("where donor funds go") followed by
// any annual reports / Form 990s as downloads.
//
// Chart notes:
//  • Categories are ranked by share, so this is an ORDINAL scale, not a
//    nominal one — it takes a single-hue ramp (JC green, dark→light) rather
//    than a categorical palette. The reader sees the ranking in the color.
//    JC's brand hues were checked as a categorical set first and failed:
//    olive and rust collapse to ΔE 3.2 under protanopia, and sage/green sit at
//    8.3 even in full colour vision.
//  • Both ramps below are verified: monotone OKLCH lightness, every step ≥ 2:1
//    against its own surface. Dark mode gets its own steps (anchored lighter),
//    not an automatic flip.
//  • Identity never rests on colour alone — every slice is named in the key,
//    larger slices carry their share directly, and a table view holds the
//    exact figures.

interface Allocation {
  _key?: string;
  label: string;
  value: number;
  note?: string | null;
}

interface Section {
  heading?: string;
  intro?: string;
  allocationHeading?: string;
  allocationPeriod?: string;
  valueFormat?: 'percent' | 'currency';
  allocations?: Allocation[] | null;
  allocationFootnote?: string;
}

interface AnnualReport {
  _id: string;
  year: number;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
}

const props = defineProps<{ section?: Section | null }>();

const heading = computed(() => props.section?.heading || 'Transparency');
const intro = computed(
  () =>
    props.section?.intro ||
    'The Joseph Center is 100% community & foundation funded. Here is how your giving is put to work.'
);
const chartHeading = computed(() => props.section?.allocationHeading || 'Where Your Gift Goes');
const period = computed(() => props.section?.allocationPeriod?.trim() || '');
const footnote = computed(() => props.section?.allocationFootnote?.trim() || '');
const isCurrency = computed(() => props.section?.valueFormat === 'currency');

// ── Slices ────────────────────────────────────────────────────────────────
// Ranked largest first, and capped at six: past that the thin slices stop
// being readable, so the tail folds into "Other".
const MAX_SLICES = 6;

interface Slice extends Allocation {
  share: number;  // 0–100
  color: string;  // CSS var reference
  step: number;   // 1–6, drives both the fill and its label ink via CSS vars
}

const total = computed(() =>
  (props.section?.allocations ?? []).reduce((sum, a) => sum + (Number(a.value) || 0), 0)
);

const slices = computed<Slice[]>(() => {
  const raw = (props.section?.allocations ?? []).filter((a) => a?.label && Number(a.value) > 0);
  if (!raw.length || total.value <= 0) return [];

  const ranked = [...raw].sort((a, b) => Number(b.value) - Number(a.value));

  let working = ranked;
  if (ranked.length > MAX_SLICES) {
    const kept = ranked.slice(0, MAX_SLICES - 1);
    const folded = ranked.slice(MAX_SLICES - 1);
    working = [
      ...kept,
      {
        label: 'Other',
        value: folded.reduce((s, a) => s + Number(a.value), 0),
        note: folded.map((a) => a.label).join(', '),
      },
    ];
  }

  return working.map((a, i) => ({
    ...a,
    share: (Number(a.value) / total.value) * 100,
    color: `var(--alloc-${i + 1})`,
    step: i + 1,
  }));
});

// ── Donut geometry ────────────────────────────────────────────────────────
const CX = 120;
const CY = 120;
const R_OUTER = 100;
const R_INNER = 62;
// ~2px of surface between fills, expressed as an angle at the outer radius.
const GAP_DEG = (2 / R_OUTER) * (180 / Math.PI);

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function annularPath(startDeg: number, endDeg: number): string {
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const o0 = polar(R_OUTER, startDeg);
  const o1 = polar(R_OUTER, endDeg);
  const i1 = polar(R_INNER, endDeg);
  const i0 = polar(R_INNER, startDeg);
  return [
    `M ${o0.x.toFixed(2)} ${o0.y.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${R_INNER} ${R_INNER} 0 ${large} 0 ${i0.x.toFixed(2)} ${i0.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

interface Arc extends Slice {
  index: number;
  d: string;
  mid: { x: number; y: number };
  showInlineLabel: boolean;
}

const arcs = computed<Arc[]>(() => {
  const out: Arc[] = [];
  let cursor = 0;
  const list = slices.value;
  const gap = list.length > 1 ? GAP_DEG : 0;

  list.forEach((s, index) => {
    const sweep = (s.share / 100) * 360;
    const start = cursor + gap / 2;
    const end = cursor + sweep - gap / 2;
    cursor += sweep;
    if (end <= start) return;
    const midAngle = (start + end) / 2;
    out.push({
      ...s,
      index,
      d: annularPath(start, end),
      mid: polar((R_OUTER + R_INNER) / 2, midAngle),
      // Below ~8% the wedge is too narrow to hold a legible number.
      showInlineLabel: s.share >= 8,
    });
  });
  return out;
});

// A single 100% category can't be drawn as an arc — render a full ring.
const isSingleSlice = computed(() => slices.value.length === 1);

const hovered = ref<number | null>(null);

function fmtShare(share: number): string {
  return `${share >= 10 ? Math.round(share) : Math.round(share * 10) / 10}%`;
}
function fmtValue(v: number): string {
  return isCurrency.value
    ? v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : `${Math.round(v * 10) / 10}%`;
}

const chartSummary = computed(() =>
  slices.value.length
    ? `Pie chart of how funds are allocated: ${slices.value
        .map((s) => `${s.label}, ${fmtShare(s.share)}`)
        .join('; ')}.`
    : ''
);

// ── Annual reports ────────────────────────────────────────────────────────
const query = `*[_type == "annualReport"] | order(year desc){
  _id, year, title, description, "fileUrl": file.asset->url
}`;
const { data: reports } = useSanity<AnnualReport[]>(query);
</script>

<template>
  <section class="transparency">
    <div class="transparency__banner">
      <h1 class="transparency__banner-title">{{ heading }}</h1>
    </div>

    <div class="transparency__inner">
      <p class="transparency__intro">{{ intro }}</p>

      <!-- ── Fund allocation ─────────────────────────────────────────── -->
      <div v-if="slices.length" class="alloc">
        <h2 class="alloc__heading">{{ chartHeading }}</h2>

        <div class="alloc__body">
          <!-- Donut -->
          <figure class="alloc__figure">
            <svg
              class="alloc__svg"
              viewBox="0 0 240 240"
              role="img"
              :aria-label="chartSummary"
            >
              <template v-if="isSingleSlice">
                <circle
                  :cx="CX"
                  :cy="CY"
                  :r="(R_OUTER + R_INNER) / 2"
                  fill="none"
                  :stroke="arcs[0]?.color"
                  :stroke-width="R_OUTER - R_INNER"
                />
              </template>

              <template v-else>
                <path
                  v-for="arc in arcs"
                  :key="arc._key || arc.label"
                  :d="arc.d"
                  :fill="arc.color"
                  class="alloc__arc"
                  :class="{
                    'alloc__arc--dim': hovered !== null && hovered !== arc.index,
                  }"
                  @mouseenter="hovered = arc.index"
                  @mouseleave="hovered = null"
                />
              </template>

              <!-- Direct labels on the slices big enough to hold one -->
              <text
                v-for="arc in arcs"
                :key="`t-${arc._key || arc.label}`"
                v-show="arc.showInlineLabel"
                :x="arc.mid.x"
                :y="arc.mid.y"
                class="alloc__arc-label"
                :style="{ fill: `var(--alloc-text-${arc.step})` }"
                text-anchor="middle"
                dominant-baseline="central"
                aria-hidden="true"
              >{{ fmtShare(arc.share) }}</text>
            </svg>

            <figcaption v-if="period" class="alloc__period">{{ period }}</figcaption>
          </figure>

          <!-- Key -->
          <ul class="alloc__key">
            <li
              v-for="arc in arcs"
              :key="`k-${arc._key || arc.label}`"
              class="alloc__key-item"
              :class="{ 'alloc__key-item--active': hovered === arc.index }"
              @mouseenter="hovered = arc.index"
              @mouseleave="hovered = null"
            >
              <span class="alloc__swatch" :style="{ background: arc.color }" aria-hidden="true" />
              <span class="alloc__key-text">
                <span class="alloc__key-label">{{ arc.label }}</span>
                <span class="alloc__key-value">
                  {{ fmtShare(arc.share) }}<template v-if="isCurrency"> · {{ fmtValue(arc.value) }}</template>
                </span>
                <span v-if="arc.note" class="alloc__key-note">{{ arc.note }}</span>
              </span>
            </li>
          </ul>
        </div>

        <details class="alloc__table-toggle">
          <summary>View these figures as a table</summary>
          <table class="alloc__table">
            <caption class="sr-only">Fund allocation{{ period ? `, ${period}` : '' }}</caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Share</th>
                <th scope="col">{{ isCurrency ? 'Amount' : 'Figure' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="arc in arcs" :key="`r-${arc._key || arc.label}`">
                <th scope="row">{{ arc.label }}</th>
                <td>{{ fmtShare(arc.share) }}</td>
                <td>{{ fmtValue(arc.value) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="isCurrency">
              <tr>
                <th scope="row">Total</th>
                <td>100%</td>
                <td>{{ fmtValue(total) }}</td>
              </tr>
            </tfoot>
          </table>
        </details>

        <p v-if="footnote" class="alloc__footnote">{{ footnote }}</p>
      </div>

      <!-- ── Annual reports — renders only when reports exist ─────────── -->
      <div v-if="reports?.length" class="transparency__reports">
        <h2 class="alloc__heading">Annual Reports &amp; Form 990s</h2>
        <div class="transparency__list">
          <a
            v-for="report in reports"
            :key="report._id"
            :href="report.fileUrl || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="transparency__item"
            :aria-label="`Download ${report.title} (PDF)`"
          >
            <div class="transparency__item-info">
              <span class="transparency__year">{{ report.year }}</span>
              <div>
                <span class="transparency__title">{{ report.title }}</span>
                <span v-if="report.description" class="transparency__desc">
                  {{ report.description }}
                </span>
              </div>
            </div>
            <span class="transparency__download" aria-hidden="true">↓ PDF</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Ordinal ramp — a single JC-green hue stepping dark→light by share, so the
   ranking is legible in the colour itself. Generated in OKLCH at a constant
   hue with an even 0.074 lightness step, then verified: monotone lightness,
   and every step ≥ 2:1 against its own surface. `--alloc-text-N` is the ink
   each step needs for an in-slice label; the crossover sits at a different
   step in each theme, which is why it lives here and not in the script. */
.transparency {
  --alloc-1: #004b29;
  --alloc-2: #005f3d;
  --alloc-3: #1c7453;
  --alloc-4: #3d8968;
  --alloc-5: #599e7f;
  --alloc-6: #75b596;

  --alloc-text-1: #ffffff;
  --alloc-text-2: #ffffff;
  --alloc-text-3: #ffffff;
  --alloc-text-4: #ffffff;
  --alloc-text-5: var(--jc-charcoal, #2c3531);
  --alloc-text-6: var(--jc-charcoal, #2c3531);
}

/* Dark mode gets its own steps, anchored lighter — selected against the dark
   surface, not an automatic flip of the light ramp. */
:global(.dark) .transparency {
  --alloc-1: #006f4c;
  --alloc-2: #2f8562;
  --alloc-3: #4d9a78;
  --alloc-4: #6ab08f;
  --alloc-5: #85c7a7;
  --alloc-6: #a1dec0;

  --alloc-text-1: #ffffff;
  --alloc-text-2: #ffffff;
  --alloc-text-3: var(--jc-charcoal, #2c3531);
  --alloc-text-4: var(--jc-charcoal, #2c3531);
  --alloc-text-5: var(--jc-charcoal, #2c3531);
  --alloc-text-6: var(--jc-charcoal, #2c3531);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.transparency__banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.transparency__banner-title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.transparency__inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.transparency__intro {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  max-width: 680px;
  margin: 0 0 2.5rem;
}

/* ── Allocation chart ── */
.alloc__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1.75rem;
}

.alloc__body {
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  gap: 2.5rem;
  align-items: center;
}

.alloc__figure {
  margin: 0;
}

.alloc__svg {
  display: block;
  width: 100%;
  height: auto;
}

.alloc__arc {
  transition: opacity 150ms ease;
}

.alloc__arc--dim {
  opacity: 0.45;
}

/* Values wear text tokens, never the series colour — the slice beside them
   carries the identity. */
.alloc__arc-label {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 700;
  pointer-events: none;
}
.alloc__period {
  margin: 0.75rem 0 0;
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}

.alloc__key {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.alloc__key-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem;
  margin: -0.35rem -0.5rem;
  border-radius: var(--radius-sm, 0.375rem);
  transition: background 150ms ease;
}

.alloc__key-item--active {
  background: var(--color-bg-subtle, #f4f1ea);
}

.alloc__swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.alloc__key-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.alloc__key-label {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
}

.alloc__key-value {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.alloc__key-note {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.alloc__table-toggle {
  margin-top: 2.5rem;
  font-size: var(--text-sm);
}

.alloc__table-toggle summary {
  cursor: pointer;
  color: var(--jc-deep-green);
  font-family: var(--font-heading);
  font-weight: 600;
}

.alloc__table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: var(--text-sm);
}

.alloc__table th,
.alloc__table td {
  text-align: left;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #e0d8c5);
}

.alloc__table thead th {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.alloc__table tbody th,
.alloc__table tfoot th {
  font-weight: 600;
  color: var(--color-text);
}

.alloc__table td {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.alloc__table tfoot th,
.alloc__table tfoot td {
  border-bottom: none;
  border-top: 2px solid var(--color-border, #e0d8c5);
  color: var(--color-text);
  font-weight: 600;
}

.alloc__footnote {
  margin: 1.25rem 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

/* ── Annual reports ── */
.transparency__reports {
  margin-top: 4rem;
}

.transparency__list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
}

.transparency__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  text-decoration: none;
  background: var(--color-bg, white);
  border-bottom: 1px solid var(--color-border, #e0d8c5);
  transition: background 150ms ease;
}

.transparency__item:last-child { border-bottom: none; }
.transparency__item:hover { background: var(--color-bg-subtle, #f4f1ea); }

.transparency__item-info {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.transparency__year {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--jc-gold);
  min-width: 3rem;
  flex-shrink: 0;
}

.transparency__title {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text);
  display: block;
}

.transparency__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  display: block;
  margin-top: 0.125rem;
}

.transparency__download {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
  flex-shrink: 0;
  letter-spacing: 0.04em;
}

@media (max-width: 720px) {
  .alloc__body {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .alloc__figure {
    max-width: 300px;
    margin: 0 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .alloc__arc,
  .alloc__key-item,
  .transparency__item {
    transition: none;
  }
}
</style>
