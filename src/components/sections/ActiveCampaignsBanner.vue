<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CampaignProgressBar from '@/components/donate/CampaignProgressBar.vue';

interface Section {
  heading?: string;
}

interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  goal_cents: number | null;
  raised_cents: number | null;
  end_date: string | null;
  show_progress: boolean;
}

defineProps<{ section?: Section | null }>();

const campaigns = ref<Campaign[]>([]);

onMounted(async () => {
  try {
    const res = await fetch('/.netlify/functions/list-active-campaigns');
    if (!res.ok) return;
    const data = (await res.json()) as { campaigns: Campaign[] };
    campaigns.value = data.campaigns ?? [];
  } catch {
    /* silent — section just won't render */
  }
});
</script>

<template>
  <section v-if="campaigns.length > 0" class="active-campaigns">
    <div class="active-campaigns__inner">
      <h2 v-if="section?.heading" class="active-campaigns__heading">
        {{ section.heading }}
      </h2>
      <div class="active-campaigns__grid">
        <a
          v-for="c in campaigns"
          :key="c.id"
          :href="`/donate?campaign=${c.slug}`"
          class="active-campaigns__card-link"
        >
          <CampaignProgressBar
            :name="c.name"
            :description="c.description"
            :goal-cents="c.goal_cents"
            :raised-cents="c.raised_cents"
            :end-date="c.end_date"
            :show-progress="c.show_progress"
          />
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.active-campaigns {
  padding: 3rem 1.5rem;
  background: var(--color-bg);
}

.active-campaigns__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.active-campaigns__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 1.5rem;
}

.active-campaigns__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
}

.active-campaigns__card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 200ms ease;
}

.active-campaigns__card-link:hover {
  transform: translateY(-3px);
}
</style>
