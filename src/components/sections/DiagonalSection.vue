<script setup lang="ts">
defineProps<{
  title: string;
  /** Band color — default 'gold'. */
  color?: 'gold' | 'green' | 'deep-green';
  /** Background color of the inner content area between the two bands. */
  contentBg?: string;
}>();
</script>

<template>
  <section class="diagonal" :class="`diagonal--${color || 'gold'}`">
    <div class="diagonal__top">
      <h2 v-if="title" class="diagonal__title">{{ title }}</h2>
    </div>
    <div class="diagonal__body" :style="contentBg ? { backgroundColor: contentBg } : undefined">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.diagonal {
  /* Set --band-color via the color modifier classes below */
  position: relative;
}

.diagonal--gold       { --band-color: var(--jc-gold); }
.diagonal--green      { --band-color: var(--jc-green); }
.diagonal--deep-green { --band-color: var(--jc-deep-green); }

.diagonal__top {
  background-color: var(--band-color);
  clip-path: polygon(0 35%, 100% 0%, 100% 100%, 0 100%);
  padding: 3rem 2rem 1.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 100px;
}

.diagonal__title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: white;
  margin: 0;
}

.diagonal__body {
  background-color: var(--color-bg);
  /* Extra bottom padding so content doesn't crowd the next section now that
     the closing band has been removed. */
  padding: 3rem 2rem 5rem;
}
</style>
