# Frontend Performance TODO

## Goal

Make pages display useful content sooner, keep loading transitions consistent, and prevent avoidable network requests or React renders across tenant, landlord, agent, admin, and public routes.

Performance changes must be measured before and after implementation. A faster animation or shorter artificial delay does not count as a performance improvement unless the underlying content becomes available sooner or the interface communicates progress more clearly.

## Progress: 2026-09-16

The items below cover the approved first batch only. The numbered checklist remains open for the broader site audit and browser verification.

- [x] Load Tenant Browse saved homes independently of property results, once per mounted page lifecycle rather than after every search or filter change.
- [x] Keep save controls loading until saved-home state resolves, without blocking the listing grid.
- [x] Ignore pagination responses from previous searches and unmounted pages.
- [x] Prevent overlapping Load more requests for the same search.
- [x] Load property booking and viewing dialog code on demand with visible progress feedback.
- [x] Preserve viewing form state and its closing animation after the first opening.
- [x] Compare production entry-chunk sizes and controlled request behavior before and after this batch.
- [x] Document results and measurement limitations in [REPORT.md](./REPORT.md).
- [ ] Verify both dialogs visually, including keyboard focus, first-open loading, close, and reopen.
- [ ] Capture real browser waterfalls and mobile/desktop LCP, INP, and CLS before declaring rendering-speed gains.

Existing implementations from the latest pull include listing pagination, concurrent dashboard requests, public property/host link builders, and rental/shortlet calendars. These are not considered site-wide completed requirements until their coverage and runtime behavior are verified.

## Agent Dashboard Batch: 2026-09-16

- [x] Replace the page-wide request gate with independent portfolio, bookings, viewings, summary, and verification resource states.
- [x] Display the static dashboard shell while requests are pending.
- [x] Match property, tenancy, summary, attention, and schedule placeholders to their section content.
- [x] Show resolved sections without waiting for unrelated requests.
- [x] Keep occupancy pending until bookings resolve, and distinguish failed occupancy checks from available homes.
- [x] Provide isolated errors and retries without refetching successful resources.
- [x] Prevent premature empty states and verification warnings when checks are pending or failed.
- [x] Verify controlled response ordering, rejected requests, cleanup, and targeted retries.
- [ ] Verify desktop and mobile rendering, skeleton contrast, layout shifts, and retry controls in a browser.
- [ ] Measure browser timing before claiming a rendering-speed improvement.

## Artificial Waiting Batch: 2026-09-16

- [x] Remove simulated photo-upload timers after local file reading completes.
- [x] Advance tenant verification immediately after successful API checks without a forced 700 ms success pause.
- [x] Remove the decorative loading gate and initial document hiding from the root layout.
- [x] Remove the 600 ms exit pause from the retained, currently unused logo animation component.
- [x] Preserve the Landlord Dashboard's 150 ms skeleton reveal delay because it does not delay resolved content.
- [ ] Verify photo selection, verification transitions, and initial navigation in a browser.
- [ ] Complete the site-wide timer audit before closing section 2.

## Site-Wide Data Fetching Batch: 2026-09-16

- [x] Audit public, tenant, landlord, agent, admin, authentication, and settings request entry points.
- [x] Route all existing client fetch call sites through one account-scoped request helper. Non-API assets and server proxy calls retain their original behavior.
- [x] Share overlapping equivalent GET requests without storing resolved responses or combining mutations.
- [x] Protect the existing user cache from account changes, logout, and late profile reads.
- [x] Clear pending-read sharing before and after writes so mutation refreshes cannot reuse older reads.
- [x] Remove unnecessary draft-to-portfolio request sequencing and repeated failed numeric property lookups.
- [x] Fetch property saved state alongside the property detail instead of waiting for the detail response.
- [x] Load public host profiles independently of their listings and guard listing pagination and retries.
- [x] Separate admin risk flags from deposit claims so filters do not refetch unrelated claims.
- [x] Guard chat polling against overlap and let unread counts resolve independently of thread lists.
- [x] Guard shortlet availability, verification refreshes, export refreshes, and host-listing event refreshes against obsolete responses.
- [x] Load listing-management availability independently with guarded refreshes and isolated errors.
- [x] Correct admin search debounce so typing from another page does not first fetch old terms at page zero.
- [x] Add Agent Tenancies incremental loading and harden Landlord Tenancies pagination.
- [x] Expose maintenance paging metadata and add incremental loading for landlord and agent repair lists.
- [x] Skip host-only verification reads in tenant and admin shells and tenant payment settings.
- [ ] Add navigation-scoped shared verification/profile revalidation beyond overlapping request sharing.
- [x] Finish collection pagination coverage, including existing backend-supported escrow, risk, claims, drafts, and tenancy-history screens. Completed in [project-status priority 3](../project-status/TODO.md#3-complete-pagination-and-reliable-active-tenancy-lookup).
- [ ] Agree on backend pagination, filtering, and aggregate contracts for the remaining collections described in BACKEND_CHANGES.md.
- [ ] Capture production browser waterfalls, account-switch checks, and desktop/mobile interaction verification.

This is a site-wide request-layer rollout, not completion of all performance requirements. Section 3 below distinguishes completed code changes from shared lifecycle and collection work that remains open.

## 1. Establish a Baseline

- [ ] Record development and production-build timings separately.
- [ ] Measure Largest Contentful Paint, Interaction to Next Paint, and Cumulative Layout Shift on representative mobile and desktop devices.
- [ ] Record route-load timing for the landing page, tenant browse, property details, Tenant My Home, Landlord Dashboard, Agent Dashboard, and listing creation.
- [ ] Capture the request waterfall for each representative route.
- [ ] Record JavaScript transferred and executed per route.
- [ ] Identify long tasks, duplicate requests, slow endpoints, and components that render repeatedly.
- [ ] Add the measurements and test conditions to a performance report so later results are comparable.

## 2. Remove Artificial Waiting

- [ ] Find timers that delay skeleton removal, navigation, submissions, or success states.
- [ ] Remove presentation-only delays when real request state is available.
- [ ] Keep intentional animation durations short and independent of data completion.
- [ ] Ensure a resolved request updates the relevant section immediately.
- [ ] Preserve minimum display time only where removing a very brief skeleton flash improves stability, and document that exception.

## 3. Improve Data Fetching

- [x] Fetch independent page dependencies in parallel across the audited request entry points.
- [x] Remove request chains where a later request does not depend on the earlier response. Keep genuine ID, upload, quote, and mutation dependencies.
- [ ] Ensure shared data such as the current user and verification status is requested once per navigation lifecycle.
- [x] Deduplicate overlapping equivalent GET requests made by layouts and child components. Explicit reloads and independently cancellable requests stay separate.
- [x] Ignore stale search, filter, quote, and availability responses across the audited entry points.
- [x] Debounce live server text searches without delaying immediate filters. Browse uses explicit submission; local-only filters make no network request while typing.
- [ ] Add pagination or incremental loading to collections that can grow without a practical limit.
- [ ] Keep server responses as the source of truth and avoid refetching unchanged data after every local interaction.

## 4. Cache Shared Server Data

- [ ] Define cache lifetimes for profile, verification status, property details, listing collections, and dashboard summaries.
- [ ] Revalidate affected cache entries after mutations instead of clearing every cached request.
- [ ] Avoid caching identity-sensitive data across users.
- [ ] Preserve explicit retry behavior for failed requests.
- [ ] Confirm that cached verification and tenancy state cannot remain stale after a successful update.

## 5. Render Useful Content Earlier

- [ ] Keep route layouts, navigation, headings, and static controls visible while data-dependent sections load.
- [ ] Split page-level loading into section-level boundaries when sections resolve independently.
- [ ] Use skeletons that match the final component dimensions to prevent layout shifts.
- [ ] Keep related sections on one coordinated loading timeline when partial rendering would look broken.
- [ ] Show an empty state only after the relevant request succeeds with no results.
- [ ] Show retryable error states without replacing unaffected page content.
- [ ] Use Next.js Server Components for read-only content that does not require browser state or event handlers.
- [ ] Stream slow server-rendered sections where route structure permits it.

## 6. Reduce Client JavaScript

- [ ] Audit files marked with `use client` and narrow client boundaries where possible.
- [ ] Keep static wrappers, headings, summaries, and display-only cards on the server when practical.
- [ ] Dynamically load maps, calendars, galleries, video tours, verification widgets, and other heavy interactive features.
- [ ] Load modal-only code when the modal is opened unless preloading materially improves the primary task.
- [ ] Review large dependencies and replace or remove those used for small features.
- [ ] Confirm that shared layout bundles do not include role-specific features unnecessarily.

## 7. Reduce React Render Work

- [ ] Profile Tenant Browse, property details, dashboards, tenancy lists, and listing creation with React Profiler.
- [ ] Prevent parent state changes from rerendering unrelated page sections.
- [ ] Memoize expensive filtering, sorting, formatting, and derived collections when profiling shows a real cost.
- [ ] Stabilize callback and object props only where they cause measurable child rerenders.
- [ ] Use stable item keys from backend identifiers.
- [ ] Virtualize long lists only when realistic data volumes make DOM size a measured problem.
- [ ] Keep form state local to the active listing-creation step where possible.

## 8. Optimize Images and Media

- [ ] Provide accurate `sizes` values for responsive listing and property images.
- [ ] Set consistent dimensions or aspect ratios so images do not shift surrounding content.
- [ ] Use image priority only for content likely to become the Largest Contentful Paint element.
- [ ] Lazy-load below-the-fold images and secondary gallery media.
- [ ] Request appropriately sized images rather than full-resolution uploads for cards and thumbnails.
- [ ] Add backend-generated image variants before relying on browser resizing for large uploads.
- [ ] Use stable placeholders or dominant-color backgrounds while property images load.

## 9. Improve Navigation Performance

- [ ] Prefetch likely internal destinations such as Browse to Property and Dashboard to Listings.
- [ ] Avoid prefetching every card in a large listing collection.
- [ ] Preserve useful route state when returning from a property to browse results.
- [ ] Confirm that authentication and role guards do not delay rendering after the current user is already known.
- [ ] Keep navigation feedback immediate when the destination still needs data.

## 10. Standardize Calendar UI

- [ ] Audit every native date input, date picker, date-range picker, availability calendar, and date filter across the website.
- [ ] Define one reusable calendar visual system using Rello's typography, colors, borders, spacing, focus rings, and motion.
- [ ] Support single-date selection for rental move-in dates and other one-day inputs.
- [ ] Support date-range selection for shortlet check-in and check-out.
- [ ] Support property availability and blocked-date management for landlords and agents.
- [ ] Support compact date filters for dashboards, tenancy lists, bookings, and reports where required.
- [ ] Display one month on small screens and up to two months on desktop when range selection benefits from it.
- [ ] Use a centered dialog, anchored popover, bottom sheet, or full-screen mobile presentation according to the surrounding workflow.
- [ ] Keep month navigation, selected dates, and the primary action visible in long mobile calendars.
- [ ] Style today, hovered dates, focused dates, selected dates, range start, range middle, range end, unavailable dates, and past dates distinctly.
- [ ] Explain unavailable dates without relying on color alone.
- [ ] Prevent invalid ranges and show minimum-stay or availability guidance close to the relevant dates.
- [ ] Provide clear labels for check-in, check-out, move-in date, and flexible-date states.
- [ ] Preserve a valid partial selection when the user moves between months.
- [ ] Show an intentional skeleton or progress state while availability is loading.
- [ ] Distinguish an availability error from a fully unavailable month and provide a retry action.
- [ ] Avoid layout shifts when calendar data, pricing, or validation messages appear.
- [ ] Support keyboard navigation, visible focus, screen-reader date labels, Escape, focus trapping, and focus restoration.
- [ ] Respect locale-aware date formatting while keeping API date values timezone safe.
- [ ] Test month boundaries, year boundaries, leap years, same-day turnover, past dates, and daylight-saving transitions where relevant.
- [ ] Replace inconsistent native date controls only after the shared calendar covers their validation and accessibility requirements.

## 11. Replace Public Database IDs

- [ ] Confirm every public property and host route that currently uses a numeric database primary key.
- [ ] Agree on the public property and host URL formats with the backend team.
- [ ] Generate property links from an immutable public identifier and a readable title slug.
- [ ] Generate host links from an immutable public identifier and a readable display-name slug.
- [ ] Treat the readable slug as presentation only and resolve records by public identifier.
- [ ] Update route parameter types, link builders, metadata generation, API calls, and canonical URLs.
- [ ] Preserve query parameters and browse state when navigating through the new routes.
- [ ] Redirect legacy numeric routes to their canonical public URLs while compatibility is supported.
- [ ] Redirect a valid public identifier with an outdated slug to its current canonical slug.
- [ ] Return the custom not-found page for unknown or malformed public identifiers.
- [ ] Confirm that frontend code does not treat a public identifier as proof of authorization.
- [ ] Update shared fixtures, mocks, tests, documentation, and analytics route grouping.

## 12. Production Verification

- [ ] Run performance checks against a production build, not only the development server.
- [ ] Test with realistic listing counts, image sizes, and network latency.
- [ ] Verify mobile performance on a mid-range device profile.
- [ ] Confirm that skeletons remain visible enough on the current white background.
- [ ] Confirm that loading changes do not introduce hydration errors or content shifts.
- [ ] Confirm that caching does not expose data between accounts or roles.
- [ ] Compare final measurements with the recorded baseline.

## Frontend Acceptance Criteria

- Representative routes have documented before and after measurements.
- Independent requests run concurrently and identical requests are deduplicated.
- Static page structure appears without waiting for unrelated API calls.
- Loading, empty, error, and loaded states are visually stable and mutually correct.
- Listing cards and primary media do not cause visible layout shifts.
- Heavy secondary features do not block initial route rendering.
- Calendar controls use consistent Rello styling and expose every selection and availability state accessibly.
- Single-date and date-range calendars work across mobile, tablet, desktop, keyboard, and screen-reader use.
- Cached user, verification, listing, and tenancy data revalidate after relevant mutations.
- Public property and host links no longer expose numeric database primary keys.
- Existing numeric links redirect to the correct canonical public URLs during migration.
- Production builds meet the performance budgets agreed from the initial baseline.
