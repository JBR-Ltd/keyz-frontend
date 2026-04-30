import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { HeroCarousel } from "./components/hero-carousel";
import { MarketingNavbar } from "./components/marketing-navbar";

const steps = [
  {
    number: "01",
    title: "Verify once",
    description:
      "A quick identity check so everyone on Keyz is who they say they are.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Browse with confidence",
    description:
      "Every listing is verified before it goes live. No fakes, no surprises.",
    icon: SearchCheck,
  },
  {
    number: "03",
    title: "Pay safely",
    description:
      "Your money is held in escrow and only releases when you're happy.",
    icon: CreditCard,
  },
];

const tenantFeatures = [
  "Verified listings only",
  "Escrow payment protection",
  "Raise a dispute if something's wrong",
  "Honest reviews from real tenants",
];

const landlordFeatures = [
  "List for free",
  "Get paid automatically on move-in",
  "Founding Landlord offer: 6 months free service charge",
  "Build a verified reputation",
];

export default function MarketingPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />
      <HeroCarousel />

      <section id="how-it-works" className="bg-[#F9F6F0] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-[#C38A1D] uppercase">
              A kinder rental process
            </p>
            <h2 className="font-display mt-4 text-4xl font-bold text-[#0A1628] sm:text-5xl">
              How Keyz Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              We help both sides of the rental journey feel safer from the very
              first click.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="rounded-[24px] bg-white p-8 shadow-[0_20px_60px_rgba(10,22,40,0.08)] transition duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE7BF] text-[#C98200]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mt-6 text-sm font-bold tracking-[0.18em] text-[#C38A1D] uppercase">
                    Step {step.number}
                  </p>
                  <h3 className="font-display mt-3 text-3xl font-bold text-[#0A1628]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-lg leading-8 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-[24px] bg-[#0A1628] p-8 text-white shadow-[0_24px_70px_rgba(10,22,40,0.18)] sm:p-10">
              <p className="text-sm font-bold tracking-[0.18em] text-[#F5C96A] uppercase">
                Tenant-first protection
              </p>
              <h2 className="font-display mt-4 text-4xl font-bold sm:text-5xl">
                For Tenants
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-8 text-slate-200">
                Find a home you can actually trust.
              </p>

              <ul className="mt-8 space-y-4">
                {tenantFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-lg">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5A623] text-[#0A1628]">
                      <Check className="h-4 w-4" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="#hero"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-6 py-4 text-base font-bold text-[#0A1628] transition hover:bg-[#e89a1f]"
              >
                Find a Home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <article
              id="for-landlords"
              className="rounded-[24px] bg-[#F9F6F0] p-8 text-[#0A1628] shadow-[0_24px_70px_rgba(10,22,40,0.08)] sm:p-10"
            >
              <span className="inline-flex rounded-full bg-[#FDE7BF] px-4 py-2 text-sm font-bold text-[#9A6700]">
                Founding Landlord Offer
              </span>
              <h2 className="font-display mt-4 text-4xl font-bold sm:text-5xl">
                For Landlords
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-8 text-slate-700">
                Reach tenants who are serious.
              </p>

              <ul className="mt-8 space-y-4">
                {landlordFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-lg">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5A623] text-[#0A1628]">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="#cta"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0A1628] px-6 py-4 text-base font-bold text-white transition hover:bg-[#13233c]"
              >
                List Your Property
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="cta" className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[32px] bg-[#0A1628] px-6 py-16 text-center text-white shadow-[0_30px_90px_rgba(10,22,40,0.22)] sm:px-10 lg:px-16">
            <div className="absolute -right-12 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#F5A623]/20 blur-3xl" />
            <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-[#F5A623]/10 blur-2xl" />

            <div className="relative mx-auto max-w-3xl">
              <p className="text-sm font-bold tracking-[0.22em] text-[#F5C96A] uppercase">
                Built on trust
              </p>
              <h2 className="font-display mt-4 text-4xl font-bold leading-tight text-[#FFF1D0] sm:text-5xl">
                Nigeria&apos;s most trusted way to find and rent a home.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-200">
                Join the landlords and tenants already building trust on Keyz.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="#hero"
                  className="inline-flex min-w-44 items-center justify-center rounded-full bg-[#F5A623] px-6 py-4 text-base font-bold text-[#0A1628] transition hover:bg-[#e89a1f]"
                >
                  Get Started
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex min-w-44 items-center justify-center rounded-full border border-white px-6 py-4 text-base font-bold text-white transition hover:bg-white hover:text-[#0A1628]"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
