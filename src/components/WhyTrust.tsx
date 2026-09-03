import ScrollReveal from "@/components/ScrollReveal";

const FEATURES = [
  {
    title: "Verified Listings",
    desc: "We ensure every property is professionally reviewed and verified to protect renters and residents from scam and misinformation",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 40 40"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M20 4L8 9V20C8 28.5 13.3 36.4 20 38C26.7 36.4 32 28.5 32 20V9L20 4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M15 20L18 23L25 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Smart Search Experience",
    desc: "Advanced filters help users discover properties based on budget, location, amenities, lifestyle preferences and investment goals.",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 40 40"
        fill="none"
        className="stroke-accent"
      >
        <circle
          cx="18"
          cy="18"
          r="10"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M26 26L34 34"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M14 18C14 15.79 15.79 14 18 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Visual property Tours",
    desc: "Experience immersive walkthroughs from anywhere before scheduling Physical inspections.",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 40 40"
        fill="none"
        className="stroke-accent"
      >
        <rect
          x="4"
          y="10"
          width="24"
          height="20"
          rx="3"
          fill="currentColor"
          className="fill-accent"
          opacity="0.15"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M28 16L36 12V28L28 24V16Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "luxury Experience",
    desc: "From the interface to customer support, every interaction is designed to feel premium, seamless and stress free.",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 40 40"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M20 6L24 14L34 15.5L27 22L29 32L20 27.5L11 32L13 22L6 15.5L16 14L20 6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function WhyTrust() {
  return (
    <section className="py-24 md:py-32 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="font-display mx-auto mb-14 max-w-3xl text-center text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Premium search, verified access, and fewer unknowns.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {FEATURES.map(({ title, desc, icon }, index) => (
            <ScrollReveal key={title} delay={index * 0.08}>
              <div className="premium-hover border border-gray-100 rounded-2xl bg-white p-7 flex flex-col items-center text-center gap-5 shadow-sm h-full">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900 text-xl">{title}</h3>
                <p className="text-gray-500 text-base leading-relaxed">
                  {desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
