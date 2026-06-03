import Image from "next/image";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="relative py-20 md:py-28 px-4 overflow-hidden">
      {/* Background night-time property image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/cta-house.jpg"
          alt="Dream property at night"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 cta-overlay" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Your Dream Property
          <br />
          Is closer Than You Think
        </h2>
        <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
          Join thousands of satisfied clients discovering smarter ways to buy,
          rent and invest in real estate
        </p>
        <Link
          href="#"
          className="inline-flex justify-center bg-accent hover:bg-accent-alt transition-colors text-white font-semibold px-8 sm:px-10 py-4 rounded text-lg"
        >
          Start Exploring
        </Link>
      </div>
    </section>
  );
}
