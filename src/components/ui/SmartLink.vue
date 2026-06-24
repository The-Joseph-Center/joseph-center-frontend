<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
  to: string;
}>();

// Treat anything with a URI scheme (http:, https:, mailto:, tel:, sms:, …)
// or a protocol-relative path (//) as non-router. Without the scheme test,
// RouterLink would prepend the current route path to non-http schemes,
// so a `mailto:` href on /staff would render as /staff/mailto:foo@…
const isExternal = computed(() =>
  /^[a-z][a-z0-9+.-]*:/i.test(props.to) || props.to.startsWith('//')
);

// Only open http(s) and protocol-relative URLs in a new tab. For mailto:,
// tel:, sms:, etc. the OS handler fires; target="_blank" would otherwise
// leave a useless blank browser tab behind.
const opensNewTab = computed(() =>
  /^https?:/i.test(props.to) || props.to.startsWith('//')
);
</script>

<template>
  <a
    v-if="isExternal"
    :href="to"
    :target="opensNewTab ? '_blank' : undefined"
    :rel="opensNewTab ? 'noopener noreferrer' : undefined"
  >
    <slot />
  </a>
  <RouterLink v-else :to="to">
    <slot />
  </RouterLink>
</template>
