<script setup>
import { useSanity } from '@/composables/useSanity';
import { sectionMap, pageQuery } from '@/composables/useSections';
import { useRevealObserver } from '@/composables/useRevealObserver';
import SmartLink from '@/components/ui/SmartLink.vue';

const { data: page } = useSanity(pageQuery('/media'));
useRevealObserver(page);
</script>

<template>
  <main class="page page--media">
    <template v-for="section in (page?.sections || [])" :key="section._key">
      <component :is="sectionMap[section._type]" v-if="sectionMap[section._type]" :section="section" />
    </template>

    <!-- Apply-to-be-a-guest CTA. Hardcoded on this page (not sectionMap) per
         24-coffee-chat-guest-form.md — tightly coupled to the /media page's
         purpose, no editor flexibility needed. -->
    <section class="media-apply-cta">
      <div class="media-apply-cta__inner">
        <div class="media-apply-cta__text">
          <h2 class="media-apply-cta__heading">Want to Share Your Story?</h2>
          <p class="media-apply-cta__body">
            If The Joseph Center has impacted your life and you'd like to join
            Mona for a Coffee Chat, we'd love to hear from you.
          </p>
        </div>
        <SmartLink to="/media/apply" class="btn-secondary media-apply-cta__cta">
          Apply to Be a Guest →
        </SmartLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.media-apply-cta {
  background: var(--color-bg-secondary);
  padding: 3rem 1.5rem;
  border-top: 1px solid var(--color-border, #e0d8c5);
}

.media-apply-cta__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.media-apply-cta__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.media-apply-cta__body {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  max-width: 520px;
  line-height: 1.6;
  margin: 0;
}

.media-apply-cta__cta {
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .media-apply-cta__cta {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>
