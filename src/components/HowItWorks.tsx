const STEPS = [
  {
    number: 1,
    label: "Search",
    desc: "Explore thousands of verified listings using smart filters and personalized recommendations",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M17 17L21 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    number: 2,
    label: "Connect",
    desc: "Chat directly with agents, schedule inspections and ask questions instantly",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: 3,
    label: "Tour",
    desc: "Take a virtual tour or visit property physically with physical assistance",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <polyline
          points="9 22 9 12 15 12 15 22"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: 4,
    label: "Secure Property",
    desc: "Complete transactions safely with transparent processes",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-primary-dark py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-accent text-xs font-bold tracking-[0.25em] uppercase text-center mb-2">
          How It Works
        </p>
        <h2 className="text-white text-xl font-semibold text-center mb-14">
          Your Journey to the Perfect Property
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {STEPS.map(({ number, label, desc, icon }) => (
            <div key={number} className="flex flex-col gap-3">
              {/* Step number + icon row */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-sm">
                    {number}
                  </span>
                </div>
                {icon}
              </div>
              <p className="text-accent font-semibold text-sm">{label}</p>
              <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
