"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Building2, ChevronDown, MapPin, Wallet } from "lucide-react";

const slides = [
  {
    src: "/apartment1.jpeg",
    alt: "Bright apartment living room with a modern sofa and warm lighting",
  },
  {
    src: "/apartment2.jpeg",
    alt: "Stylish bedroom with a neatly made bed and framed art",
  },
  {
    src: "/apartment3.jpeg",
    alt: "Open plan dining and kitchen area in a contemporary apartment",
  },
  {
    src: "/apartment4.jpeg",
    alt: "Cozy apartment balcony with city views at sunset",
  },
  {
    src: "/apartment5.jpeg",
    alt: "Elegant apartment exterior showing a secure residential building",
  },
];

const propertyTypes = ["Apartment", "Duplex", "Studio", "Bungalow"];
const priceRanges = [
  "Under ₦500k / year",
  "₦500k - ₦1.5m / year",
  "₦1.5m - ₦3m / year",
  "₦3m+ / year",
];

export function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState(propertyTypes[0]);
  const [priceRange, setPriceRange] = useState(priceRanges[1]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      className="relative isolate min-h-[calc(100vh-81px)] overflow-hidden bg-[#0A1628]"
    >
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,22,40,0.08)_0%,rgba(10,22,40,0.2)_45%,rgba(10,22,40,0.88)_82%,rgba(22,17,9,0.96)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-81px)] max-w-7xl items-end px-4 pb-10 pt-16 sm:px-6 sm:pb-12 lg:px-8 lg:pb-16">
        <div className="w-full">
          <div className="max-w-4xl">
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-white/80 uppercase backdrop-blur-sm">
              Trusted Renting for Nigeria
            </p>
            <h1 className="font-display max-w-3xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Your Key to Finding Home
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-semibold text-[#FDE0A6] sm:text-xl">
              Verified listings. Protected payments. Peace of mind.
            </p>
          </div>

          <form
            id="listings"
            onSubmit={(event) => event.preventDefault()}
            className="mt-10 rounded-[32px] border border-white/20 bg-white/14 p-4 shadow-[0_25px_80px_rgba(10,22,40,0.35)] backdrop-blur-xl sm:p-5"
          >
            <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
              <label className="flex min-h-16 items-center gap-3 rounded-[24px] bg-white/88 px-4 text-[#0A1628]">
                <MapPin className="h-5 w-5 text-[#F5A623]" />
                <div className="flex-1">
                  <span className="block text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                    Location
                  </span>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Lagos, Abuja, Ibadan..."
                    className="mt-1 w-full bg-transparent text-base font-semibold outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <div className="relative flex min-h-16 items-center gap-3 rounded-[24px] bg-white/88 px-4 text-[#0A1628]">
                <Building2 className="h-5 w-5 text-[#F5A623]" />
                <div className="flex-1">
                  <span className="block text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                    Property Type
                  </span>
                  <select
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value)}
                    className="mt-1 w-full appearance-none bg-transparent pr-6 text-base font-semibold outline-none"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
              </div>

              <div className="relative flex min-h-16 items-center gap-3 rounded-[24px] bg-white/88 px-4 text-[#0A1628]">
                <Wallet className="h-5 w-5 text-[#F5A623]" />
                <div className="flex-1">
                  <span className="block text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                    Price Range
                  </span>
                  <select
                    value={priceRange}
                    onChange={(event) => setPriceRange(event.target.value)}
                    className="mt-1 w-full appearance-none bg-transparent pr-6 text-base font-semibold outline-none"
                  >
                    {priceRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
              </div>

              <button
                type="submit"
                className="min-h-16 rounded-full bg-[#F5A623] px-8 text-base font-bold text-[#0A1628] transition hover:bg-[#e89a1f]"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-8 flex justify-center gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-3 rounded-full transition-all ${
                  index === activeSlide
                    ? "w-10 bg-[#F5A623]"
                    : "w-3 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
