import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  CalendarCheck,
  Clock3,
  Landmark,
  MapPin,
  MessageSquareText,
  WalletCards,
} from "lucide-react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import propertyOne from "../../../../../public/images/about-interior.jpg";
import propertyTwo from "../../../../../public/images/cta-house.jpg";
import propertyThree from "../../../../../public/images/newsletter-house.jpg";

interface Booking {
  title: string;
  location: string;
  status: "Escrow Held" | "Upcoming" | "Confirmed";
  dates: string;
  price: string;
  image: StaticImageData;
}

const STATS = [
  {
    label: "Active Bookings",
    value: "03",
    trend: "+1 this month",
    direction: "up",
    icon: CalendarCheck,
    tone: "bg-primary text-white",
    tile: "border-white/30 bg-white/[0.12] text-accent",
  },
  {
    label: "Incoming Requests",
    value: "05",
    trend: "+12% this week",
    direction: "up",
    icon: MessageSquareText,
    tone: "bg-accent text-primary",
    tile: "border-primary/30 bg-primary text-white",
  },
  {
    label: "Escrow Held",
    value: "₦1.2m",
    trend: "No change",
    direction: "down",
    icon: Landmark,
    tone: "bg-surface-soft text-primary",
    tile: "border-primary bg-primary text-white",
  },
  {
    label: "Saved Listings",
    value: "12",
    trend: "+3 this week",
    direction: "up",
    icon: Bookmark,
    tone: "bg-[var(--color-bg)] text-primary",
    tile: "border-accent bg-accent text-primary",
  },
];

const BOOKINGS: Booking[] = [
  {
    title: "The Glass House, Lekki",
    location: "Lekki Phase 1, Lagos",
    status: "Escrow Held",
    dates: "Jul 04 to Jul 18",
    price: "₦480,000",
    image: propertyOne,
  },
  {
    title: "Maitama Courtyard",
    location: "Maitama, Abuja",
    status: "Upcoming",
    dates: "Jul 22 to Aug 05",
    price: "₦620,000",
    image: propertyTwo,
  },
  {
    title: "Harbour View Residence",
    location: "Victoria Island, Lagos",
    status: "Confirmed",
    dates: "Aug 14 to Aug 28",
    price: "₦710,000",
    image: propertyThree,
  },
];

const ACTIVITIES = [
  {
    title: "Escrow funded",
    description: "Payment secured for The Glass House.",
    time: "18 minutes ago",
    icon: WalletCards,
    tone: "bg-primary text-accent",
  },
  {
    title: "Viewing confirmed",
    description: "Your Maitama Courtyard viewing is booked.",
    time: "2 hours ago",
    icon: CalendarCheck,
    tone: "bg-accent text-primary",
  },
  {
    title: "Host replied",
    description: "A new message is waiting in your booking.",
    time: "Yesterday",
    icon: MessageSquareText,
    tone: "bg-surface-soft text-primary",
  },
];

const STATUS_STYLES: Record<Booking["status"], string> = {
  "Escrow Held": "bg-primary text-white",
  Upcoming: "bg-accent text-primary",
  Confirmed: "border border-primary bg-[var(--color-bg)] text-primary",
};

export default function TenantDashboardPage() {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <header className="border-b border-primary pb-9">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Your rental desk
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-[0.92] text-primary sm:text-6xl">
          Tenant Dashboard
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Welcome back, Amara! Here&apos;s what&apos;s happening with your
          bookings.
        </p>
      </header>

      <section className="mt-8 grid border border-primary sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(({ label, value, trend, direction, icon: Icon, tone, tile }, index) => {
          const TrendIcon = direction === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <article
              key={label}
              className={`min-w-0 p-5 sm:p-6 ${tone} ${
                index > 0
                  ? "border-t border-primary sm:border-t-0 sm:odd:border-l xl:border-l"
                  : ""
              } ${index === 2 ? "sm:border-t xl:border-t-0" : ""}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center border ${tile}`}>
                <Icon size={22} />
              </div>
              <p className="mt-7 font-accent text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                {label}
              </p>
              <p className="mt-2 break-words font-display text-4xl font-bold leading-none">
                {value}
              </p>
              <p className="mt-5 flex items-center gap-2 font-body text-xs font-bold">
                <TrendIcon size={15} />
                {trend}
              </p>
            </article>
          );
        })}
      </section>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.55fr_0.75fr]">
        <section className="min-w-0 border border-primary">
          <div className="flex items-end justify-between gap-5 border-b border-primary px-5 py-6 sm:px-7">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
                Next stays
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">
                Upcoming Bookings
              </h2>
            </div>
            <Link
              href="/tenant/bookings"
              className="shrink-0 font-accent text-xs font-bold uppercase tracking-[0.18em] text-primary hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              View all
            </Link>
          </div>

          <div>
            {BOOKINGS.map((booking) => (
              <article
                key={booking.title}
                className="grid gap-5 border-b border-primary p-5 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:p-7"
              >
                <div className="relative aspect-[4/3] overflow-hidden border border-primary sm:aspect-auto sm:min-h-28">
                  <Image
                    src={booking.image}
                    alt={booking.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 144px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-body text-lg font-bold text-primary">
                        {booking.title}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                        <MapPin size={15} className="shrink-0 text-accent-alt" />
                        {booking.location}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] ${STATUS_STYLES[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-surface pt-4">
                    <p className="flex items-center gap-2 font-body text-sm text-muted">
                      <Clock3 size={15} className="text-accent-alt" />
                      {booking.dates}
                    </p>
                    <p className="font-display text-2xl font-bold text-primary">
                      {booking.price}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="self-start border border-primary">
          <div className="border-b border-primary bg-primary px-5 py-6 text-white sm:px-7">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent">
              Timeline
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Recent Activity
            </h2>
          </div>
          <div>
            {ACTIVITIES.map(({ title, description, time, icon: Icon, tone }) => (
              <article
                key={title}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-primary p-5 last:border-b-0 sm:p-6"
              >
                <span className={`flex h-12 w-12 items-center justify-center ${tone}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="font-body text-sm font-bold text-primary">
                    {title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">
                    {description}
                  </p>
                  <p className="mt-3 font-accent text-xs font-bold uppercase tracking-[0.14em] text-accent-alt">
                    {time}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
