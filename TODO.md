# Rello Frontend TODO

## Landlord dashboard

Source: `src/app/(landlord)/landlord/dashboard/page.tsx`

### Critical

- [x] Render four summary card skeletons while dashboard data is loading.
  - Do not derive the loading placeholders from `summaryItems` because that array is empty before the portfolio request resolves.
  - Keep the summary grid height stable when real values replace the placeholders.
  - Match the final card icon, label, value, and supporting text positions.

- [x] Remove the major layout shift between loading and populated states.
  - The Action Centre and Portfolio sections must remain at approximately the same vertical positions before and after data loads.
  - Verify the transition at desktop and mobile widths.

### High priority

- [x] Use a compact two-column summary grid on small mobile screens.
  - Keep all values readable at a 390 px viewport.
  - Prevent large currency values from colliding with their icon tiles.
  - Ensure the Action Centre becomes visible sooner without horizontal scrolling.

- [x] Improve the initial loading transition.
  - Avoid showing empty placeholder regions before the delayed skeletons appear.
  - Preserve the current protection against skeleton flashes for fast responses.
  - Confirm that slow requests display a complete and intentional page structure.

- [x] Load dashboard sections according to their own request state.
  - Portfolio, bookings, payments, verification, and account data should not all remain blocked by the slowest request.
  - Each section should replace only its own skeleton when its data resolves.
  - A failure in one section must not hide successfully loaded sections.

### Visual refinements

- [x] Increase the contrast of skeletons inside the dark escrow card.
  - The placeholders must remain visible against the primary background.
  - Maintain sufficient contrast without making the skeleton brighter than loaded content.

- [x] Reduce horizontal scanning in Action Centre rows on wide screens.
  - Keep the task description and action visually connected.
  - Preserve clear alignment across multiple tasks.

- [x] Verify skeleton fidelity for every dashboard section.
  - Compare the loaded and loading states for the header, summary cards, Action Centre, property rows, tenancies, and escrow activity.
  - Match final dimensions, spacing, border radius, and responsive stacking.
  - Test with reduced motion enabled.

### Completion checks

- [ ] Inspect populated and loading states at 390 px, 768 px, 1024 px, and 1440 px widths.
- [ ] Confirm there is no horizontal overflow.
- [ ] Confirm loading content uses appropriate `aria-busy` and hidden decorative skeletons.
- [ ] Run Prettier, ESLint, TypeScript, and `git diff --check`.
