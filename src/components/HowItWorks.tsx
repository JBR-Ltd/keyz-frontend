const STEPS = [
  {
    number: 1,
    label: "Search",
    desc: "Use smart filters to compare verified homes by location, budget, amenities and lifestyle fit.",
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent text-accent"
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
    desc: "Speak with trusted agents, ask questions and schedule viewings without the usual back and forth.",
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent text-accent"
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
    desc: "Preview homes virtually, then book guided physical inspections when a place feels right.",
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent text-accent"
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
    desc: "Move from offer to keys with transparent support, clear documentation and safer payments.",
    icon: (
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-accent text-accent"
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
    <section className="bg-primary-dark py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="text-accent text-base font-bold tracking-[0.25em] uppercase mb-3">
              How It Works
            </p>
            <h2 className="text-white text-4xl md:text-5xl font-semibold leading-tight">
              From search to keys, without the guesswork.
            </h2>
          </div>
          <p className="text-white/65 text-lg leading-relaxed max-w-md">
            A guided process built to help you discover, inspect and secure the
            right property with confidence.
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="hidden lg:block absolute left-[12%] right-[12%] top-12 h-px bg-white/15" />
          {STEPS.map(({ number, label, desc, icon }) => (
            <div
              key={number}
              className="relative rounded-xl border border-white/10 bg-white/[0.04] p-6 flex flex-col gap-5 transition-colors hover:border-accent/60 hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                  {icon}
                </div>
                <div className="w-11 h-11 rounded-full bg-primary-dark border border-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-lg">
                    {number}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold text-2xl mb-3">
                  {label}
                </h3>
                <p className="text-white/65 text-base leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
