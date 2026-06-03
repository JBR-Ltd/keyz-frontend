import Image from "next/image";

const VALUES = [
  "Transparent & reliable",
  "Excellence in service",
  "Innovative technology",
];

export default function AboutUs() {
  return (
    <section className="py-16 md:py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch">
        {/* Left: property interior image */}
        <div className="relative min-h-[300px] md:min-h-[420px] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
          <Image
            src="/images/about-interior.jpg"
            alt="Luxury property interior"
            fill
            className="object-cover"
          />
        </div>

        {/* Right: copy */}
        <div className="bg-white border border-gray-100 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none p-6 sm:p-8 md:p-10 flex flex-col justify-center">
          <p className="text-accent font-bold text-sm tracking-widest uppercase mb-3">
            About Us
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Redefining Modern Real Estate Experiences.
          </h2>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-4">
            We believe finding the perfect property should feel effortless. Our
            platform combines technology, elegant design and industry expertise
            to simplify the real estate journey for buyers, renters, agents and
            investors.
          </p>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-8">
            Whether you&apos;re searching for a luxury apartment in the city, a
            peaceful family home, or your next investment opportunity. We
            provide access to premium listings and personalized support that
            makes every decision easier.
          </p>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
            {VALUES.map((v) => (
              <div key={v} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-base md:text-lg text-gray-700 font-medium">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
