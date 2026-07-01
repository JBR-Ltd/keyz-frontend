import type { ReactElement } from "react";
import type { StaticImageData } from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  DoorOpen,
  MapPin,
  MessageSquareText,
} from "lucide-react";
import Image from "next/image";
import propertyOne from "../../../../../public/images/about-interior.jpg";
import propertyTwo from "../../../../../public/images/cta-house.jpg";
import propertyThree from "../../../../../public/images/newsletter-house.jpg";

interface StayCard {
  title: string;
  location: string;
  date: string;
  status: string;
  image: StaticImageData;
}

const STAYS: StayCard[] = [
  {
    title: "Maitama Courtyard",
    location: "Maitama, Abuja",
    date: "Jul 22",
    status: "Viewing",
    image: propertyTwo,
  },
  {
    title: "Harbour View Residence",
    location: "Victoria Island, Lagos",
    date: "Aug 14",
    status: "Confirmed",
    image: propertyThree,
  },
];

const MOMENTS = [
  { time: "09:00", title: "Keys pickup", detail: "Meet host at reception" },
  { time: "10:30", title: "Room inspection", detail: "Upload photos before escrow release" },
  { time: "12:00", title: "Move-in note", detail: "Confirm utilities and access cards" },
];

export default function TenantBookingsPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <section className="grid min-h-[28rem] overflow-hidden rounded-lg border border-primary/15 bg-primary text-white shadow-sm xl:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Booking itinerary
          </p>
          <h1 className="mt-5 max-w-xl font-display text-5xl font-bold leading-[0.9] sm:text-6xl">
            Your next stay is almost ready.
          </h1>
          <p className="mt-5 max-w-lg font-body text-base leading-7 text-white/70">
            The Glass House is in the final handoff stage. Finish inspection,
            confirm keys, and escrow can move to release review.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Check-in", "Jul 04"],
              ["Duration", "14 nights"],
              ["Escrow", "Funded"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/15 bg-white/[0.08] p-4">
                <p className="font-accent text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/50">
                  {label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-accent">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-80">
          <Image
            src={propertyOne}
            alt="The Glass House living room"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/20 bg-primary/85 p-5 backdrop-blur">
            <p className="font-body text-sm font-bold text-accent">The Glass House, Lekki</p>
            <p className="mt-2 flex items-center gap-2 font-body text-sm text-white/70">
              <MapPin size={15} />
              Lekki Phase 1, Lagos
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[22rem_1fr]">
        <aside className="rounded-lg border border-primary/15 bg-[var(--color-bg)] p-6 shadow-sm">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
            Handoff day
          </p>
          <div className="mt-6 space-y-6">
            {MOMENTS.map((moment, index) => (
              <div key={moment.title} className="grid grid-cols-[4rem_1fr] gap-4">
                <p className="font-display text-xl font-bold text-primary">{moment.time}</p>
                <div className="border-l border-primary/20 pl-4">
                  <p className="flex items-center gap-2 font-body text-sm font-bold text-primary">
                    {index === 0 ? <DoorOpen size={16} className="text-accent-alt" /> : null}
                    {index === 1 ? <CheckCircle2 size={16} className="text-accent-alt" /> : null}
                    {index === 2 ? <MessageSquareText size={16} className="text-accent-alt" /> : null}
                    {moment.title}
                  </p>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">{moment.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="grid gap-5 md:grid-cols-2">
          {STAYS.map((stay) => (
            <article key={stay.title} className="group overflow-hidden rounded-lg border border-primary/15 bg-[var(--color-bg)] shadow-sm">
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={stay.image}
                  alt={stay.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 34vw"
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-lg font-bold text-primary">{stay.title}</p>
                    <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                      <MapPin size={15} className="text-accent-alt" />
                      {stay.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    {stay.status}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-primary/10 pt-5">
                  <span className="flex items-center gap-2 font-body text-sm text-muted">
                    <CalendarDays size={15} className="text-accent-alt" />
                    {stay.date}
                  </span>
                  <ArrowUpRight size={18} className="text-primary" />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
