import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[520px] flex items-center overflow-hidden">
      {/* Background hero image — replace src with your actual asset */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/landing-page-hero-pic.png"
          alt="Luxury property"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 w-full">
        <span className="inline-block border border-gray-400 text-gray-600 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
          Find, Rent, Own with Keyz
        </span>

        <h1 className="text-5xl font-bold text-gray-900 leading-tight max-w-md mb-4">
          Your Key to Finding Home.
        </h1>

        <p className="text-gray-600 text-base max-w-sm mb-8 leading-relaxed">
          Discover verified properties, secure payments and a seamless
          experience for tenants and landlords
        </p>

        <div className="flex items-center gap-6">
          <Link
            href="/join-waitlist"
            className="flex items-center gap-2 bg-[#1a237e] text-white font-semibold px-7 py-4 rounded-xl hover:bg-[#151c6b] transition-colors text-sm"
          >
            Explore Properties
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

          <button className="flex items-center gap-3 text-[#1a237e] font-semibold text-sm">
            <span className="w-10 h-10 rounded-full border-2 border-[#1a237e] flex items-center justify-center hover:bg-[#1a237e] hover:text-white transition-colors">
              ▶
            </span>
            How It Works
          </button>
        </div>
      </div>
    </section>
  );
}
