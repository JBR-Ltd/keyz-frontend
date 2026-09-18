# Logged-in screens: test checklist

Step-by-step checks for every screen added in the September 2026 round. Each step says what to do and what you should see. Tick it, or note what happened instead.

## Before you start

- **Start the backend with jobs off:** `rello-api-no-jobs` in `keyz-frontend/.claude/launch.json`, or
  `mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local -Dspring-boot.run.arguments=--rello.scheduling.enabled=false`.
  Jobs off means no real payouts, emails or texts. Some steps below say where a job would normally act.
- **Start the frontend:** `npm run dev` in `keyz-frontend`, then open http://localhost:3000.
- **Accounts:** a tenant, a landlord, an agent and an admin, all with verified email and identity.
- **Payment accounts:** give the landlord and the agent verified payout accounts.
- **Paystack:** use its test mode for any step that pays. Confirm `PAYSTACK_SECRET_KEY` starts with `sk_test_` before paying anything.
- **Listing:** as the landlord, create a yearly listing with a deposit and "Let tenants pay the rent in parts" on (4 parts). Wait for it to be verified.

## 1. Notifications

- [ ] **Any role:** the bell sits next to the messages icon in the header. It shows a count when there are unread notifications.
- [ ] **Open the bell:** the newest notifications are listed. Clicking one marks it read and goes to its page.
- [ ] **Mark all read:** the count clears and every dot disappears.
- [ ] **More than 20 notifications:** "Load older" appears and adds the next set with no repeats.
- [ ] **Settings, Notifications:** "Text messages" and "Send texts by WhatsApp" switches are there. Reload the page and they keep their state.

## 2. Reviews

- [ ] **Tenant, completed stay:** Ratings offers that stay. Submitting shows "It stays hidden until your host reviews you too".
- [ ] **Same stay again:** it is no longer offered.
- [ ] **Host, Ratings:** the host can rate that tenant. Once both have written reviews, they are published (the publish job, or the second review, releases them).
- [ ] **Host, a published tenant review:** "Reply publicly" posts once. The reply then shows under the review.
- [ ] **Listing page, logged out:** published reviews and the host reply appear. The count reads "1 review" or "N reviews".

## 3. Instalments, receipts and statements

- [ ] **Tenant:** request the listing.
- [ ] **Landlord:** accept it with a move-in date.
- [ ] **Tenant, My Home:** the payment panel shows "How you pay the rent" with All at once, 2 parts and Quarterly. Monthly is not offered, because the host allows up to 4.
- [ ] **Choose Quarterly:** the schedule shows 4 parts. Part 1 is marked "with deposit" and equals a quarter of the rent plus the deposit.
- [ ] **Pay** (Paystack test card): the return page says "Payment received". Part 1 shows as Paid.
- [ ] **Change the plan after paying:** the plan buttons are gone.
- [ ] **"Pay part 2 now":** opens checkout. After paying, the return page confirms it, and part 2 shows as Paid with a receipt icon.
- [ ] **Receipt icon:** the receipt page shows rent and deposit lines, the total and a reference. "Print or save as PDF" opens the print dialog. A tenant never sees the Rello fee.
- [ ] **Tenant and landlord, Statement:** the payment rows appear for the date range. "Download CSV" saves a file that opens in a spreadsheet.
- [ ] **Escrow pages, both sides:** each paid row has a "Receipt" link.

## 4. Tenancy agreement

- [ ] **Landlord, Tenancies, booking drawer:** "Agreement and reports" opens the records dialog on the agreement tab.
- [ ] **Add terms and save the draft:** the text shows both names, the address, the rent, the deposit and the 4 instalments.
- [ ] **Tenant, before it is sent:** "Your host has not sent a tenancy agreement yet".
- [ ] **Landlord, sign and send:** type a single name and the button stays disabled. Type the full name and tick the box to sign. Status becomes "Waiting for the tenant".
- [ ] **Tenant, decline:** "Something needs changing" with a reason. Status becomes "Declined by the tenant".
- [ ] **Landlord, "Start a new version":** version 2 is created. Sign and send it again.
- [ ] **Tenant, sign:** status becomes "Signed by both". Both signatures show with names and times.
- [ ] **Print or save as PDF:** the text, signatures and fingerprint print.
- [ ] **Landlord, after signing:** the terms can no longer be edited.

## 5. Condition reports

- [ ] **Tenant, records dialog, Condition reports tab:** "Start move-in report" gives a draft with starter rooms.
- [ ] **Edit lines:** set one to Damaged and a note field appears. Add a photo with a room name. Save the draft.
- [ ] **Landlord, while it is a draft:** the tenant's report is not visible.
- [ ] **Tenant, submit:** a confirmation appears. The report then shows "Unchanged since submitted" and can no longer be edited.
- [ ] **Landlord, Contest:** blocked until a note is written. Once contested, the note shows on the report.
- [ ] **Move-out report before move-in day:** refused with a clear message.

## 6. Disputes

- [ ] **Tenant, open a dispute on the paid booking:** the case detail shows "Evidence (0 of 10)".
- [ ] **Add a photo, then a PDF:** both are listed and open in a new tab.
- [ ] **Add a Word document:** refused.

## 7. Reports

- [ ] **Logged in, listing page:** "Report this listing" opens the dialog. Sending without a reason shows "Choose what is wrong". Choose "Asked to pay outside Rello" and send: a confirmation appears.
- [ ] **Report the same listing again:** "You have already reported this listing".
- [ ] **Host page:** "Report this host" works the same way.
- [ ] **Admin, Reports:** the report is listed. "Actioned" needs a note. Once saved, it moves to the Actioned filter.

## 8. Saved searches

- [ ] **Tenant, Browse:** set a price range and bedrooms. "Save search and get alerts" appears and saves.
- [ ] **Profile menu, Saved searches:** the search is listed.
- [ ] **Alerts toggle:** switches between on and off.
- [ ] **See homes:** Browse opens with the same filters.
- [ ] **Alert email:** with jobs off, none is sent. With jobs on, a new matching verified listing sends one within a day.

## 9. Agent mandates

- [ ] **Agent, profile menu, Mandates:** invite the landlord's email with a 25% fee and it is refused. Invite at 10% and it shows "Waiting for the landlord".
- [ ] **Landlord, profile menu, Agent mandates:** the invite is listed. Accept it; the agent sees Active.
- [ ] **Agent:** add one of their own listings by its public id (`p_...`); the listing count updates.
- [ ] **Removing a listing with an active booking:** refused.
- [ ] **Landlord, overview:** the listing, its bookings and any agent fees are shown.
- [ ] **End the mandate:** a reason is required. The listing leaves Browse, and a new rental request on it is refused.
- [ ] **Money (needs jobs on, or an admin release):** the rent is paid to the landlord's account less 5% and 10%, and the agent's statement shows an "Agent fee" row.

## 10. Compliance

- [ ] **Tenant, payment at or above ₦5,000,000:** the due diligence dialog opens and now has a date of birth field. Saving it continues to checkout.
- [ ] **Admin, Compliance:** "Large payments" downloads a CSV with that payment. "Risk flags" and "Screening exceptions" download.
- [ ] **Screen now** with a user id: shows a result, and a possible match adds a flag on the Risk page.
- [ ] **Admin, Risk:** the new flag types read "Reported by several people" and "Possible sanctions or PEP match".
- [ ] **Tenant, `/api/users/me` response in the browser's network tab:** no screening fields and no date of birth.

## 11. Listing form

- [ ] **Landlord, new yearly listing:** the "Let tenants pay the rent in parts" checkbox shows the parts selector.
- [ ] **Switch the listing to per night:** the section disappears.
- [ ] **Save a draft and reopen it:** the instalment settings are kept.

## Record the results

For anything that fails, note the step, the account role, what you saw, and the `X-Request-Id` from the browser's network tab. That id finds the matching server log lines.
