import { ref, computed, type ComputedRef } from 'vue';

// Module-level counter so any number of StayConnectedSection instances on
// a page register their presence in one shared signal. The FooterStayConnected
// band reads `isPresentOnPage` and hides itself when the count is non-zero
// — preventing the page from rendering two signup forms.
//
// Using a counter (not a boolean) so two sections on the same page would
// still keep the footer hidden, and unmounting one section doesn't flip
// the flag prematurely on routes where two coexist.

const count = ref(0);
const isPresentOnPage: ComputedRef<boolean> = computed(() => count.value > 0);

export function useStayConnectedPresence() {
  return {
    register() { count.value++; },
    unregister() { count.value--; },
    isPresentOnPage,
  };
}
