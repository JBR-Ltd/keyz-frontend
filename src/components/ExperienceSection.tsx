"use client";

import { useState, useEffect } from "react";

const AMENITIES = [
  {
    label: "Swimming Pools",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent text-accent"
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
        width="48"
        height="48"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent text-accent"
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
        width="48"
        height="48"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent text-accent"
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
        width="48"
        height="48"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent text-accent"
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
        width="48"
        height="48"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent text-accent"
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
  {
    label: "Concierge Service",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent text-accent"
      >
        <path
          d="M10 12H26M14 12V9a4 4 0 1 1 8 0v3M8 18h20v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Green Spaces",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 36 36"
        fill="none"
        className="stroke-accent text-accent"
      >
        <path
          d="M18 4C12.48 4 8 8.48 8 14c0 3.14 1.5 5.94 3.85 7.72l-1.03 4.13 4.96-2.24A9.98 9.98 0 0 0 18 24c5.52 0 10-4.48 10-10S23.52 4 18 4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M14 18c1.71-1.71 4-2.5 6-2.5s4.29.79 6 2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function ExperienceSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Create an infinite carousel by tripling the array (for 3 visible cards)
  const extendedAmenities = [...AMENITIES, ...AMENITIES, ...AMENITIES];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        // When we reach the end of the first set, jump back to start seamlessly
        if (nextIndex === AMENITIES.length) {
          setTimeout(() => {
            setIsTransitioning(false);
          }, 1000); // After transition completes
          return nextIndex;
        }
        return nextIndex;
      });
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isTransitioning && currentIndex === AMENITIES.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(0);
        setIsTransitioning(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, currentIndex]);

  return (
    <section className="py-20 px-4 bg-surface-soft">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div>
          <p className="text-accent font-bold text-xl tracking-widest uppercase mb-4 leading-relaxed">
            Experience Real Estate
            <br />
            Like Never Before
          </p>
          <p className="text-gray-600 text-xl leading-relaxed max-w-xl">
            From high-end penthouses to modern smart homes equipped with premium
            amenities, we showcase properties that elevate your lifestyle
          </p>
        </div>

        {/* Right: carousel */}
        <div className="relative h-64 overflow-hidden">
          <div
            className={`flex h-full ${isTransitioning ? "transition-transform duration-1000 ease-in-out" : "transition-none"}`}
            style={{
              transform: `translateX(calc(-${currentIndex * 33.333}% - ${currentIndex * 4}px))`,
            }}
          >
            {extendedAmenities.map(({ label, icon }, idx) => (
              <div
                key={`${label}-${idx}`}
                className="flex-shrink-0 w-1/3 h-full px-1.5 flex items-center justify-center"
              >
                <div className="bg-white border border-gray-100 rounded-xl p-8 flex flex-col items-center gap-4 text-center w-full h-full shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex justify-center items-center h-20 w-20">
                    {icon}
                  </div>
                  <p className="text-accent text-xl md:text-2xl font-semibold leading-tight">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
