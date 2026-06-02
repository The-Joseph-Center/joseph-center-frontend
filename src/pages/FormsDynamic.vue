<script setup lang="ts">
import { computed, watch } from 'vue';
import { useHead } from '@unhead/vue';
import { useSanity } from '@/composables/useSanity';
import BlockDynamicForm from '@/components/sections/BlockDynamicForm.vue';

const props = defineProps<{ formSlug: string }>();

// Fetch the title for the banner + SEO. BlockDynamicForm refetches the full
// doc — duplicating the lightweight title query here keeps the page simple
// without coupling the two components.
const { data: form } = useSanity<{ title?: string }>(
  `*[_type == "dynamicForm" && slug.current == $slug][0]{ title }`,
  { slug: props.formSlug }
);

const bannerTitle = computed(() => form.value?.title || 'Form');

watch(
  form,
  (val) => {
    if (val?.title) {
      useHead({ title: `${val.title} — The Joseph Center` });
    }
  },
  { immediate: true }
);
</script>

<template>
  <main class="page page--forms-dynamic">
    <div class="form-banner">
      <h1 class="form-banner__title">{{ bannerTitle }}</h1>
    </div>

    <div class="form-wrap">
      <BlockDynamicForm :form-slug="formSlug" />
    </div>
  </main>
</template>

<style scoped>
.form-banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.form-banner__title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.form-wrap {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}
</style>
