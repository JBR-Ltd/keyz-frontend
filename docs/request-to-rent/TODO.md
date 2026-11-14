# Rental Request and Shortlet Flow TODO

## Goal

Give long-term rentals and shortlets separate request experiences that match how each type of property is actually occupied.

- Long-term rentals collect move-in intent without asking for an end date.
- Shortlets collect an exact check-in and check-out range.
- The property's `rentalMode` selects the flow. Tenants do not choose the mode themselves.

## Current Contract Audit

- [x] Confirm that listings expose `ANNUAL`, `MONTHLY`, and `SHORT_STAY` rental modes.
- [x] Confirm that the property page passes `rentalMode` into the request dialog.
- [x] Confirm that the current booking request requires `startDate` and `endDate` for every rental mode.
- [x] Confirm that current quote and availability rules are date-range based.
- [x] Record the required server changes in [BACKEND_CHANGES.md](./BACKEND_CHANGES.md).

## 1. Agree on the API Contract

- [ ] Review the proposed contracts in `BACKEND_CHANGES.md` with the backend collaborator.
- [ ] Confirm the final `BookingKind` and `MoveInPreference` enum names.
- [ ] Confirm whether guest count belongs in the first shortlet release.
- [ ] Confirm how an accepted long-term request becomes an active tenancy.
- [ ] Confirm whether existing `/api/bookings` creation remains temporarily supported.
- [ ] Publish example success and error responses for frontend integration.

## 2. Implement the Backend Dependency

- [ ] Add a booking kind that distinguishes long-term rental requests from shortlet bookings.
- [ ] Allow long-term rental requests without an end date.
- [ ] Store move-in preference, optional preferred date, and optional tenant message.
- [ ] Keep exact check-in and check-out dates mandatory for shortlets.
- [ ] Restrict date-range quote and availability checks to shortlets.
- [ ] Return the booking kind and mode-specific fields from tenant and host booking endpoints.
- [ ] Make activity, export, availability, and lifecycle code null-safe for long-term dates.
- [ ] Add migration and service tests.

## 3. Split the Frontend Request Models

- [x] Replace the single date-range submission shape with separate rental-request and shortlet-booking inputs.
- [x] Add response guards for nullable mode-specific fields.
- [x] Add dedicated API functions for rental requests and shortlet bookings.
- [x] Keep server-calculated shortlet totals as the source of truth.
- [x] Do not calculate or manufacture a rental end date in the browser.

## 4. Build the Long-Term Rental Flow

- [x] Create a focused “Request to rent” dialog for `ANNUAL` and `MONTHLY` listings.
- [x] Show the property name, rent amount, rental period, and host summary.
- [x] Offer move-in choices for as soon as possible, within 30 days, exact date, and flexible.
- [x] Show a date field only when the tenant chooses an exact date.
- [x] Add an optional introductory message with a clear character limit.
- [x] Explain that this is a request, no payment is taken, and the host must respond.
- [x] Add review, submitting, success, validation, and server-error states.
- [x] Use a centered dialog on desktop and a bottom sheet or full-screen flow on mobile.

## 5. Build the Shortlet Flow

- [x] Create a separate “Request to book” dialog for `SHORT_STAY` listings.
- [x] Replace native date inputs with an accessible date-range calendar.
- [x] Display two months on wide screens and one month on mobile.
- [x] Disable past dates, property blocks, and unavailable booking ranges.
- [x] Enforce the listing's minimum-night rule before requesting a quote.
- [x] Show check-in, check-out, night count, nightly price, cleaning fee, and total.
- [ ] Add guest count after the backend exposes and validates maximum occupancy.
- [x] Keep the primary action visible while scrolling on mobile.
- [x] Add loading, unavailable-date, quote-error, submission, and success states.
- [ ] Treat flexible dates as a later discovery enhancement unless the backend provides alternative-range suggestions.

## 6. Update Downstream Tenancy Screens

- [ ] Update Tenant My Home to render long-term requests without an end date.
- [ ] Update Landlord Tenancies to distinguish rental requests from shortlet bookings.
- [ ] Update Agent Tenancies to distinguish rental requests from shortlet bookings.
- [ ] Replace client-derived long-term stages with backend lifecycle data.
- [ ] Label long-term amounts as monthly or annual rent instead of booking totals.
- [ ] Show check-in and check-out only for shortlets.
- [ ] Show move-in preference or preferred move-in date for long-term requests.
- [ ] Update tenancy details drawers, notifications, and activity descriptions.

## 7. Verification and Accessibility

- [ ] Test annual, monthly, and short-stay listings independently.
- [ ] Test verified and unverified tenant entry points.
- [ ] Test keyboard calendar navigation, focus trapping, Escape, and focus restoration.
- [ ] Test mobile, tablet, and desktop layouts.
- [ ] Test unavailable dates, minimum nights, quote refreshes, and stale responses.
- [ ] Test rental requests with every move-in preference.
- [ ] Test loading, empty, error, retry, duplicate-request, and success states.
- [ ] Confirm that no frontend path sends a fabricated end date.

## 8. Release Sequence

- [ ] Deploy the database migration and backward-compatible response fields.
- [ ] Deploy the new backend creation endpoints.
- [ ] Verify the new endpoints in the shared development environment.
- [ ] Deploy the frontend flow split.
- [ ] Monitor booking creation, validation failures, and lifecycle transitions.
- [ ] Remove the legacy universal date-range creation endpoint after all clients migrate.
