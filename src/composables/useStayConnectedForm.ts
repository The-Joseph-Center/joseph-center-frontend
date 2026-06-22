import { reactive, ref, computed } from 'vue';

/**
 * Shared state + submit logic for the Stay Connected form (both the
 * embeddable section and the dedicated /forms/stay-connected page).
 *
 * Fans out submissions to two Netlify functions in parallel:
 *   - subscribe-newsletter (AWeber) when wantsEmail is true and email is set
 *   - subscribe-sms (Turso, sms_subscribers table) always — stores the
 *     consent record regardless of which channel was selected, so the
 *     Turso table is the canonical opt-in log.
 *
 * @param source  Free-form label that gets stored in sms_subscribers.source.
 *                Useful for analytics — e.g. 'stay-connected-page',
 *                'events-section', 'home-footer'.
 */
export function useStayConnectedForm(source = 'website') {
  const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    wantsEmail: true,
    wantsSms: false,
  });

  const submitting = ref(false);
  const submitted = ref(false);
  const error = ref('');

  const needsPhone = computed(() => form.wantsSms);
  const needsEmail = computed(() => form.wantsEmail);

  function validate(): string | null {
    if (!form.wantsEmail && !form.wantsSms) {
      return 'Please select at least one option — email newsletter or text updates.';
    }
    if (form.wantsEmail && !form.email.trim()) {
      return 'Email address is required for the newsletter.';
    }
    if (form.wantsEmail && !/\S+@\S+\.\S+/.test(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (form.wantsSms && !form.phoneNumber.trim()) {
      return 'Phone number is required for text updates.';
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      error.value = validationError;
      return;
    }

    submitting.value = true;
    error.value = '';

    try {
      const promises: Promise<Response>[] = [];

      // Newsletter → AWeber. subscribe-newsletter expects { email, name }.
      if (form.wantsEmail && form.email.trim()) {
        const fullName = [form.firstName, form.lastName]
          .map((s) => s.trim())
          .filter(Boolean)
          .join(' ');
        promises.push(
          fetch('/.netlify/functions/subscribe-newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: form.email.trim(),
              ...(fullName ? { name: fullName } : {}),
            }),
          })
        );
      }

      // Canonical opt-in record (both email + SMS consent) → Turso.
      promises.push(
        fetch('/.netlify/functions/subscribe-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: form.firstName.trim() || null,
            lastName: form.lastName.trim() || null,
            email: form.email.trim() || null,
            emailConsent: form.wantsEmail,
            phoneNumber: form.phoneNumber.trim() || null,
            smsConsent: form.wantsSms,
            list: 'general',
            source,
          }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.find((r) => !r.ok);
      if (failed) throw new Error(`Server error: ${failed.status}`);

      submitted.value = true;
    } catch {
      error.value =
        'Something went wrong. Please try again or call us at (970) 245-7672.';
    } finally {
      submitting.value = false;
    }
  }

  return {
    form,
    submitting,
    submitted,
    error,
    needsPhone,
    needsEmail,
    validate,
    handleSubmit,
  };
}
