-- Giving Tuesday 2026 — the campaign row that makes `?campaign=giving-tuesday-2026` work.
--
--   turso db shell main-jc < db/seeds/giving-tuesday-2026.sql
--
-- WHY A ROW IS NEEDED AT ALL
--
-- The tagging is already built and already deployed. DonationFlow.vue reads
-- `?campaign=` from the URL, create-donation-session resolves the slug through
-- `findCampaignId`, and the id is written onto the donations row and attached to
-- the Stripe PaymentIntent and Subscription as metadata. What is missing is only
-- this: `findCampaignId` looks for a row with this slug AND active = 1, and
-- returns null when there is none. A tagged link without this row still takes
-- the gift — it just records it untagged. Fail-safe, and also silent, which is
-- why the row has to exist before the first tagged link goes out on Nov 30.
--
-- GOAL IS DELIBERATELY NULL — DO NOT FILL IT IN
--
-- CampaignProgressBar renders its bar when `showProgress && goalCents > 0`, and
-- the caption reads "$X raised toward a $Y goal". Setting a goal would publish a
-- live running total on the donate page, updating through the day, which breaks
-- two rules from the tracking brief at once: no public figure before Mona
-- approves it, and no framing the result against a goal. With goal_cents NULL
-- the header shows the name and description only. show_progress = 0 as well, so
-- it stays off even if a goal is added later by accident.
--
-- DATES ARE DOCUMENTATION, NOT ENFORCEMENT
--
-- get-campaign (what the donate page calls) filters on active = 1 only, and so
-- does findCampaignId. The dates below are read by list-active-campaigns, which
-- today feeds one section component (`activeCampaignsBanner`) that no page in
-- the production dataset uses — checked, 0 pages. So this row has no public
-- surface except on a tagged /donate link. Attribution also will not stop on
-- Dec 2: a gift from an old tagged link in mid-December is still tagged, which
-- is wanted. To end attribution, set active = 0.
--
-- THE NAME AND DESCRIPTION ARE PUBLIC COPY
--
-- They appear on the donate page to anyone following a tagged link, from the
-- moment this runs. Edit them here before running if the wording should differ.
-- No dollar figures, per the brief.

INSERT INTO campaigns
  (name, slug, description, goal_cents, program_id, active, show_progress, start_date, end_date)
VALUES (
  'Giving Tuesday 2026',
  'giving-tuesday-2026',
  'Your gift goes to work right here in Grand Junction — food, shelter, and a path forward for neighbors who need one. The Joseph Center is 100% community and foundation funded.',
  NULL,            -- no goal. See above.
  NULL,            -- org-wide, not tied to one program
  1,               -- active now, so the Nov 30 email's links tag correctly
  0,               -- never show a progress bar
  '2026-11-30',
  '2026-12-31'
);

-- Confirm it landed and that nothing is set that would publish a figure.
SELECT slug, name, active, show_progress, goal_cents, raised_cents, start_date, end_date
FROM campaigns
WHERE slug = 'giving-tuesday-2026';
