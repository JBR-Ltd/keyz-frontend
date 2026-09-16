# Policies

The public text lives in [`src/lib/policies.ts`](../src/lib/policies.ts) and renders
at `/policies`. Edit it there, not here: this file is the operational reference for
support and engineering, and it explains where each promise comes from in the code.

A policy that the product does not actually follow is worse than no policy, so every
number below appears in both places.

## The numbers, and where they live

| Promise | Value | Set by |
| --- | --- | --- |
| Time to pay after a host accepts, shortlet | 24 hours | `rello.payments.shortlet-window-hours` |
| Time to pay after a host accepts, long-term let | 72 hours | `rello.payments.rental-window-hours` |
| Held money released to the host | 3 days after move-in or check-in | `rello.escrow.auto-release-days` |
| Rello's fee | 5% of rent, host side, deposit excluded | `rello.escrow.commission-percent` |
| Host window to claim against a deposit | 7 days after the tenancy ends | `rello.deposit.claim-days` |
| Due diligence needed above | ₦5,000,000 | `rello.compliance.high-value-threshold` |
| Renewal reminders | 60, 30 and 7 days before the end | `TenancyRenewalJob.STAGES` |
| Viewing reminder | 24 hours before | `ViewingReminderJob` |

Changing any of these means changing the policy text in the same commit.

## What each policy covers

- **Payments and escrow** — who holds the money, when the host is paid, what Rello
  charges, and why paying off-platform voids all of it.
- **Deposits and caution fees** — the deposit is refundable and returns
  automatically; the host may claim against it with evidence; Rello decides.
- **Cancellations and refunds** — free until the stay begins, a dispute after that,
  automatic release of bookings nobody pays for.
- **Reporting a problem** — how disputes work, what they freeze, what Rello will and
  will not decide.
- **Listings and verification** — what a host proves before publishing, and what
  gets a listing removed.
- **Identity, money laundering and records** — the checks, the threshold, and the
  five-year retention. Backed by the compliance programme in the `keyz-backend` repository, `docs/COMPLIANCE_AML.md`.
- **Privacy and your data** — what is held, NDPA rights, and why some records
  survive a deletion request.
- **Tenancies and renewals** — move-in dates, renewal reminders, and the line
  between platform rules and state tenancy law.

## Still to do

- A lawyer in Nigeria should review the published text, the terms of service and
  the privacy policy together before launch.
- Terms of service and a full privacy notice are not written yet. The policy pages
  cover behaviour, not the contract.
- Lagos tenancy legislation has been changing, including proposals around
  non-refundable charges. Whoever owns policy should re-read the deposits and
  tenancies pages when the current bill settles.
