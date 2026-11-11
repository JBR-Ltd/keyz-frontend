// === Types

export interface PolicySection {
  body: string[];
  bullets?: string[];
  heading: string;
}

export interface PolicyDocument {
  sections: PolicySection[];
  slug: string;
  summary: string;
  title: string;
  /** The date this text last changed, so a reader can tell what they agreed to. */
  updated: string;
}

// === Constants

/**
 * What Rello promises, in the same words the product behaves in.
 *
 * Every number here is a setting the system actually runs on, so a policy and the
 * code cannot drift apart without somebody noticing: the payment window, the release
 * delay, the deposit claim window and the fee are all named in both places.
 */
export const POLICY_UPDATED = "16 September 2026";

export const POLICIES: PolicyDocument[] = [
  {
    slug: "payments-and-escrow",
    title: "Payments and escrow",
    summary:
      "How money moves on Rello: who holds it, when the host is paid, and what you pay us.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "Rello holds the money, not the host",
        body: [
          "You pay Rello, not the landlord or agent. We hold the money through Paystack, a licensed Nigerian payment provider, and release it to the host only after the tenancy or stay has begun.",
          "This is the whole point of the platform. In an ordinary Nigerian letting the rent leaves your hands before you hold the keys, and getting it back depends on goodwill.",
        ],
      },
      {
        heading: "When you pay",
        body: [
          "Nothing is charged while a request is waiting on the host. Once they accept, you have a window to pay: 24 hours for a shortlet, 72 hours for a long-term let.",
          "If it is not paid in that window, the booking is released automatically, the dates or the home go back on the market, and nothing is charged. If you paid and the confirmation was slow to arrive, the system checks with Paystack before releasing anything, so a slow webhook never costs you a booking.",
        ],
      },
      {
        heading: "When the host is paid",
        body: [
          "Held money is released to the host three days after the move-in or check-in date, unless you have reported a problem first. You can also release it yourself as soon as you are happy, which is faster for the host.",
          "For a long-term let, the release runs from the move-in date the host records when they accept. If that date is in the past, the three days run from the day you paid instead, so you always get a window to raise something.",
        ],
      },
      {
        heading: "What Rello charges",
        body: [
          "Hosts pay 5% of the rent, taken when the money is released to them. Tenants pay no platform fee.",
          "Rello charges no agency fee, no inspection fee and no documentation fee. If anyone asks you for one in order to see or secure a home listed here, report it: that is not us, and it is not allowed on the platform.",
        ],
      },
      {
        heading: "Paying outside Rello",
        body: [
          "If you pay a host directly, none of the protection above applies: we are not holding the money, we cannot refund it, and we cannot help in a dispute. Asking a tenant to pay off-platform is grounds for removal.",
        ],
      },
    ],
  },
  {
    slug: "deposits",
    title: "Deposits and caution fees",
    summary:
      "The caution fee is refundable. Rello holds it, returns it automatically, and decides any claim.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "A deposit is your money",
        body: [
          "Many Nigerian lettings treat the caution fee as gone the moment it is paid. It is not: it is a security deposit against damage, and what is left of it belongs to the tenant at the end of the tenancy.",
          "On Rello the deposit is held separately from the rent. It is never paid out to the host with the rent, and we never take a fee from it.",
        ],
      },
      {
        heading: "Getting it back",
        body: [
          "When the tenancy is marked complete, the host has 7 days to claim against the deposit for damage. If they do not, the deposit goes back to the card or account you paid from automatically. Nobody has to ask.",
        ],
      },
      {
        heading: "If the host claims damage",
        body: [
          "A host claiming against a deposit has to say what was damaged and how much they are claiming, and the tenant is shown both. The deposit stays with Rello while we look at it.",
          "Rello decides the split, not the host. Fair wear and tear is not damage: a repainted wall after a year of living somewhere is wear, a broken door is damage. We ask for evidence, and receipts carry more weight than descriptions.",
        ],
      },
      {
        heading: "What a deposit is not",
        body: [
          "A deposit is not extra rent, and it cannot be used to cover the last month or year of a tenancy. It is not a fee for viewing, documenting or securing a home.",
        ],
      },
    ],
  },
  {
    slug: "cancellations-and-refunds",
    title: "Cancellations and refunds",
    summary:
      "Free cancellation until the stay or tenancy begins. After that, a problem goes to a dispute.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "Before it begins",
        body: [
          "Either side can cancel before the move-in or check-in date. If the booking was paid for, the tenant is refunded in full, deposit included. Refunds go back to the card or account the money came from, and usually arrive within a few working days depending on the bank.",
        ],
      },
      {
        heading: "After it begins",
        body: [
          "Once a paid stay or tenancy has started, it cannot be cancelled from the booking screen. Cancelling then would take money from a host whose home is already occupied.",
          "If something is wrong with the home, report a problem instead. That freezes the money where it is until Rello has looked at both sides.",
        ],
      },
      {
        heading: "When a host cancels",
        body: [
          "A host who cancels an accepted booking has to give a reason, which the tenant sees, and the tenant is refunded in full. Cancelling accepted bookings counts against a host's rating on the platform.",
        ],
      },
      {
        heading: "When nobody pays",
        body: [
          "An accepted booking that is not paid for inside its window is released automatically. Nothing is charged, and the home or the dates go back on the market.",
        ],
      },
    ],
  },
  {
    slug: "disputes",
    title: "Reporting a problem",
    summary:
      "How to raise something, what it freezes, and how Rello decides.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "Raising one",
        body: [
          "Either side of a booking can report a problem from their bookings. Say what happened and attach what you have: photographs, messages, receipts.",
          "Raising one freezes the money immediately. Nothing is released to the host and nothing is refunded to the tenant until it is settled.",
        ],
      },
      {
        heading: "How it is decided",
        body: [
          "Rello reviews what both sides send. We look at the listing as advertised, the messages between you, and the evidence. The outcome is either the money released to the host, returned to the tenant, or split.",
          "Keep everything on the platform. Messages sent here are part of the record, and a conversation moved to WhatsApp is one we cannot see when it matters.",
        ],
      },
      {
        heading: "What we do not decide",
        body: [
          "Rello is not a court and does not decide who may occupy a home. Eviction, recovery of premises and the terms of a tenancy agreement are matters for the law and, in Lagos, for the tenancy legislation that governs them.",
        ],
      },
    ],
  },
  {
    slug: "listings-and-verification",
    title: "Listings and verification",
    summary:
      "What a host has to prove before a listing goes live, and what gets a listing removed.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "Before a listing goes live",
        body: [
          "Hosts verify their identity with their NIN or BVN before they can publish. A listing itself is verified with proof of ownership or management: a document, a photograph taken at the property with its location attached, or a recent utility bill in the owner's name.",
          "Photographs are checked against listings already on the platform. A home posted twice, or a photograph lifted from another listing, is flagged and the duplicate is taken down.",
        ],
      },
      {
        heading: "What is not allowed",
        body: [],
        bullets: [
          "Listing a home you do not own or manage",
          "Photographs that are not of the home being let",
          "A price on the listing that differs from the price asked in messages",
          "Charging viewing, inspection or documentation fees",
          "Asking a tenant to pay outside Rello",
          "Refusing a tenant on grounds of ethnicity, religion, origin or disability",
        ],
      },
      {
        heading: "If a listing breaks these rules",
        body: [
          "We unpublish it. Money already held on a booking for that home is returned to the tenant. Repeat breaches end the account.",
        ],
      },
    ],
  },
  {
    slug: "identity-and-financial-crime",
    title: "Identity, money laundering and records",
    summary:
      "Who we check, what we ask for on large payments, and what we are required to keep and report.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "Why a rentals platform checks this",
        body: [
          "Under the Money Laundering (Prevention and Prohibition) Act 2022, a business dealing in property is a designated non-financial business. That puts obligations on Rello to know who its customers are, to watch for transactions that do not fit, to keep records, and to report suspicions to the authorities.",
        ],
      },
      {
        heading: "What we ask for",
        body: [
          "Everyone verifies their identity with a NIN or BVN before booking or listing. Hosts verify a bank account before they can be paid.",
          "On a payment of ₦5,000,000 or more we ask the payer for their residential address, their occupation and where the money is coming from. It is asked once, it is not shown to the other side of the booking, and it is kept securely.",
        ],
      },
      {
        heading: "Monitoring and reporting",
        body: [
          "Payments and refunds are monitored automatically for patterns that warrant a closer look, and those are reviewed by a person. Where the law requires it, we report to the Nigerian Financial Intelligence Unit and to SCUML. We are not permitted to tell a customer that a report has been made.",
          "Transaction records are kept for at least five years, as the Act requires, even where an account is later closed.",
        ],
      },
    ],
  },
  {
    slug: "privacy-and-data",
    title: "Privacy and your data",
    summary:
      "What we hold, why, and the rights the Nigeria Data Protection Act gives you.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "What we hold",
        body: [
          "Your account details, the listings and bookings you take part in, the messages you send on the platform, your verification results, and your payment records. Card details are never held by Rello: payments run through Paystack.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Under the Nigeria Data Protection Act 2023 you can ask for a copy of your data, correct it, or ask us to delete your account. All three are in your settings: export your data, edit your profile, or delete the account.",
          "Some records survive a deletion request because the law requires it. Transaction and verification records are kept for five years under the money laundering rules, and we cannot shorten that.",
        ],
      },
      {
        heading: "Who sees what",
        body: [
          "A host sees a tenant's name and whether they are verified, not their identity documents. A tenant sees the same about a host. Compliance details are visible only to Rello.",
        ],
      },
    ],
  },
  {
    slug: "tenancies-and-renewals",
    title: "Tenancies and renewals",
    summary:
      "Move-in dates, how a tenancy ends, and when we remind you about renewal.",
    updated: POLICY_UPDATED,
    sections: [
      {
        heading: "The move-in date",
        body: [
          "A host records the move-in date when they accept a long-term request, and it is what everything else runs from: the release of the money, the tenancy dates, and the renewal reminders. It can be changed until the payment settles, and the tenant is told when it changes.",
        ],
      },
      {
        heading: "Renewal",
        body: [
          "Nigerian rent is usually paid a year at a time, which means the end of a tenancy arrives as a large sum for a tenant and a vacancy for a host. Rello reminds both sides 60, 30 and 7 days before a tenancy is due to end.",
          "Renewing is an agreement between tenant and host. Rello does not raise your rent or renew anything on your behalf.",
        ],
      },
      {
        heading: "Ending a tenancy",
        body: [
          "A host marks a tenancy complete when it ends, which starts the deposit clock. Notice periods, rent increases and recovery of premises are governed by the tenancy law of the state the property is in, not by this platform.",
        ],
      },
    ],
  },
];

// === Helpers

export function findPolicy(slug: string): PolicyDocument | null {
  return POLICIES.find((policy) => policy.slug === slug) ?? null;
}
