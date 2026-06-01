const AMENITIES = [
  {
    label: "Swimming Pools",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M4 26c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0 5 3 7.5 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4 20c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0 5 3 7.5 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="18" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M18 13v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Fitness Centers",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent"
      >
        <rect
          x="14"
          y="16"
          width="8"
          height="4"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="8"
          y="13"
          width="6"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="22"
          y="13"
          width="6"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="4"
          y="15"
          width="4"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="28"
          y="15"
          width="4"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: "24/7 Security",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M18 4L6 9V18C6 25.18 11.28 31.84 18 33.5C24.72 31.84 30 25.18 30 18V9L18 4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M13 18L16 21L23 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Steady Water",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M18 4C18 4 8 16 8 22C8 27.52 12.48 32 18 32C23.52 32 28 27.52 28 22C28 16 18 4 18 4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 24C12 24 14 28 18 28"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Smart Home",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent"
      >
        <path
          d="M6 16L18 6L30 16V30H23V22H13V30H6V16Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle
          cx="18"
          cy="20"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
];

export default function ExperienceSection() {
  return (
    <section className="py-20 px-4 bg-surface-soft">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div>
          <p className="text-accent font-bold text-xs tracking-widest uppercase mb-4 leading-relaxed">
            Experience Real Estate
            <br />
            Like Never Before
          </p>
          <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
            From high-end penthouses to modern smart homes equipped with premium
            amenities, we showcase properties that elevate your lifestyle
          </p>
        </div>

        {/* Right: amenity cards grid */}
        <div className="grid grid-cols-3 gap-3">
          {AMENITIES.map(({ label, icon }) => (
            <div
              key={label}
              className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col items-center gap-3 text-center hover:shadow-md transition-shadow"
            >
              {icon}
              <p className="text-gray-800 text-xs font-semibold leading-tight">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
