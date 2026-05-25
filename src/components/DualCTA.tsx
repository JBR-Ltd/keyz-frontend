import Link from "next/link";

export default function DualCTA() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden">
        {/* For Tenants */}
        <div className="bg-primary text-white p-10 flex flex-col justify-between min-h-[320px] relative overflow-hidden">
          {/* Decorative line art background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg viewBox="0 0 400 320" className="w-full h-full" fill="none">
              <rect
                x="20"
                y="40"
                width="180"
                height="220"
                rx="4"
                stroke="white"
                strokeWidth="1.5"
              />
              <rect
                x="40"
                y="60"
                width="60"
                height="80"
                rx="2"
                stroke="white"
                strokeWidth="1"
              />
              <rect
                x="120"
                y="60"
                width="60"
                height="80"
                rx="2"
                stroke="white"
                strokeWidth="1"
              />
              <rect
                x="70"
                y="160"
                width="100"
                height="80"
                rx="2"
                stroke="white"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="270"
                x2="400"
                y2="270"
                stroke="white"
                strokeWidth="1"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <p className="text-sm font-semibold text-blue-200 mb-2">
              For Tenants
            </p>
            <h3 className="text-3xl font-bold leading-tight mb-4">
              Find your next
              <br />
              perfect home
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              Explore verified rentals and enjoy a hassle-free renting
              experience
            </p>
          </div>

          <Link
            href="#"
            className="relative z-10 self-start inline-flex items-center gap-2 bg-white text-primary font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Browse Rentals
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* For Landlords */}
        <div className="bg-surface-alt p-10 flex flex-col justify-between min-h-[320px] relative overflow-hidden">
          {/* Decorative illustration placeholder */}
          <div className="absolute bottom-0 right-0 w-48 h-48 opacity-60 pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
              {/* Armchair */}
              <rect
                x="60"
                y="110"
                width="80"
                height="50"
                rx="8"
                fill="#c9b8a8"
              />
              <rect
                x="50"
                y="90"
                width="20"
                height="60"
                rx="6"
                fill="#b5a090"
              />
              <rect
                x="130"
                y="90"
                width="20"
                height="60"
                rx="6"
                fill="#b5a090"
              />
              <rect
                x="55"
                y="75"
                width="90"
                height="35"
                rx="6"
                fill="#d4c4b4"
              />
              {/* Floor lamp */}
              <line
                x1="160"
                y1="160"
                x2="160"
                y2="60"
                stroke="#888"
                strokeWidth="3"
              />
              <ellipse cx="160" cy="55" rx="20" ry="8" fill="#aaa" />
              {/* Plant */}
              <rect
                x="30"
                y="140"
                width="16"
                height="20"
                rx="3"
                fill="#9b7e5a"
              />
              <ellipse cx="38" cy="130" rx="18" ry="22" fill="#5a8a5a" />
              <ellipse cx="28" cy="118" rx="12" ry="15" fill="#4a7a4a" />
              <ellipse cx="50" cy="120" rx="12" ry="14" fill="#4a7a4a" />
            </svg>
          </div>

          <div className="relative z-10">
            <p className="text-sm font-semibold text-gray-500 mb-2">
              For Landlords
            </p>
            <h3 className="text-3xl font-bold text-primary leading-tight mb-4">
              List your property
              <br />
              with confidence
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              Reach quality tenants and grow your rental business with ease
            </p>
          </div>

          <Link
            href="#"
            className="relative z-10 self-start inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover-bg-primary-dark transition-colors"
          >
            List Your Property
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
