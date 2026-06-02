<script setup lang="ts">
import { useHead } from '@unhead/vue';

useHead({
  title: 'Referral Form — The Joseph Center',
  meta: [
    {
      name: 'description',
      content:
        "Refer an individual or family to The Joseph Center's programs in Grand Junction, Colorado.",
    },
  ],
});
</script>

<template>
  <main class="page page--forms-referral">
    <div class="form-banner">
      <h1 class="form-banner__title">Referral Form</h1>
    </div>

    <div class="referral-page">
      <iframe
        src="https://the-joseph-center.casemgr.org/embed-casemgr-referral/46dd9429268ede42bf0f31629fb5fcea1fd65236"
        title="Referral Form"
        class="referral-page__iframe"
        scrolling="no"
        frameborder="0"
      />
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

.referral-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 10px 3rem;
}

.referral-page__iframe {
  width: 100%;
  border: none;
  min-height: 1400px;
  display: block;
}
</style>
