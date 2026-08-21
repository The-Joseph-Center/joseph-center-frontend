/**
 * Shared donation fee math.
 *
 * Imported by BOTH the donation flow (to show the donor what they'll pay) and
 * create-donation-session (which decides what Stripe actually charges). Keep it
 * in one place: if the two ever disagreed, a donor would see one amount in the
 * form and a different one on their card statement.
 *
 * Ported from the Gatsby site's src/utils/donationFees.js so both generations
 * of the site quote identical totals during the cutover.
 *
 * The rate is Stripe's discounted 501(c)(3) nonprofit rate, which The Joseph
 * Center is enrolled in (2.2% + 30c, vs. 2.9% + 30c standard). It's a constant
 * rather than an env var deliberately: this module is bundled into a Netlify
 * Function as well as the browser bundle, and the two runtimes read env
 * differently. If Stripe changes JC's rate, edit it here — one place, both
 * sides.
 *
 * This is a close estimate, not an exact match on every charge: Stripe bills
 * Amex at a higher rate and adds 1% for international cards, so a gift on those
 * cards covers slightly less than the full fee. Not worth engineering around.
 */

export const FEE_PERCENT = 2.2;
export const FEE_FIXED_CENTS = 30;

/** Smallest gift we'll accept, in cents. */
export const MIN_DONATION_CENTS = 100;
/** Ceiling, in cents ($50,000). Anything larger is a mistake or a probe. */
export const MAX_DONATION_CENTS = 5_000_000;

/**
 * Gross up so the organization nets the donor's intended gift after Stripe
 * takes its cut. Solving `total - (total * rate + fixed) = intended` gives
 * `total = (intended + fixed) / (1 - rate)`.
 */
export function totalWithFeesCents(baseCents: number): number {
  return Math.round((baseCents + FEE_FIXED_CENTS) / (1 - FEE_PERCENT / 100));
}

/** The extra the donor pays to absorb the processing fee. */
export function feeCents(baseCents: number): number {
  return totalWithFeesCents(baseCents) - baseCents;
}

/** What Stripe should actually charge, given the donor's choice. */
export function chargeCents(baseCents: number, coverFees: boolean): number {
  return coverFees ? totalWithFeesCents(baseCents) : baseCents;
}
