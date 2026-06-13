import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export default function FinalCTA() {
  return (
    <section className="relative py-24 md:py-36 px-4 overflow-hidden">
      {/* Background night-time property image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/cta-house.jpg"
          alt="Dream property at night"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 cta-overlay" />
      </div>

      <ScrollReveal className="relative z-10 max-w-3xl mx-auto">
        <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
          Your Dream Property
          <br />
          Is Closer Than You Think
        </h2>
        <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
          Join thousands of satisfied clients discovering smarter ways to buy,
          rent and invest in real estate
        </p>
        <Link
          href="#"
          className="premium-hover inline-flex justify-center bg-gradient-to-r from-accent to-accent-alt text-white font-semibold px-8 sm:px-10 py-4 rounded-full text-lg"
        >
          Start Exploring
        </Link>
      </ScrollReveal>
    </section>
  );
}
