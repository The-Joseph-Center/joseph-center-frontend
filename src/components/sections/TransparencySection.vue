<script setup lang="ts">
import { computed } from 'vue';
import { useSanity } from '@/composables/useSanity';

interface Section {
  heading?: string;
  intro?: string;
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
    "The Joseph Center is committed to financial transparency. Below you'll find our annual reports and IRS Form 990s available for public review."
);

const query = `*[_type == "annualReport"] | order(year desc){
  _id, year, title, description, "fileUrl": file.asset->url
}`;

const { data: reports, loading } = useSanity<AnnualReport[]>(query);
</script>

<template>
  <section class="transparency">
    <div class="transparency__banner">
      <h1 class="transparency__banner-title">{{ heading }}</h1>
    </div>

    <div class="transparency__inner">
      <p class="transparency__intro">{{ intro }}</p>

      <div v-if="loading" class="transparency__state">
        <p>Loading reports…</p>
      </div>

      <template v-else-if="reports?.length">
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
      </template>

      <div v-else class="transparency__state">
        <p>Annual reports and Form 990s will be available here soon.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
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
  margin: 0 0 2rem;
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
  background: white;
  border-bottom: 1px solid var(--color-border, #e0d8c5);
  transition: background 150ms ease;
}

.transparency__item:last-child {
  border-bottom: none;
}

.transparency__item:hover {
  background: var(--color-bg-subtle, #f4f1ea);
}

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

.transparency__state {
  padding: 3rem 0;
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
