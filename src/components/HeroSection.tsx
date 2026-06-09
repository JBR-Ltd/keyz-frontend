import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[560px] md:min-h-[420px] flex items-center overflow-hidden">
      {/* Background property image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-house.jpg"
          alt="Luxury property with pool"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-12 w-full">
        <div className="max-w-lg">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-4xl font-bold text-white leading-tight md:leading-snug mb-4">
            Find More Than a Home
            <br />
            Discover a{" "}
            <span className="text-accent">
              Lifestyle Designed For You
            </span>
          </h1>

          {/* Badge */}
          {/* <div className="inline-block border border-white/40 text-white/80 text-xs tracking-widest uppercase px-4 py-2 rounded mb-5">
            Find, Rent, Own with Keyz
          </div> */}

          {/* Sub-headline + body */}
          <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-sm">
            Explore premium apartments, penthouses and investment properties in
            the most desirable locations. Whether you&apos;re buying, renting or
            investing, we help you unlock luxury living with confidence.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Link
              href="#"
              className="inline-flex justify-center bg-accent hover:bg-accent-alt transition-colors text-white font-semibold px-7 py-4 rounded text-base"
            >
              Browse Properties
            </Link>

            {/* <button className="flex items-center gap-3 text-accent font-semibold text-base">
              <span className="w-11 h-11 rounded-full border-2 border-white/60 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white text-base">
                ▶
              </span>
              How It Works
            </button> */}
          </div>
        </div>
      </div>
    </section>
  );
}
