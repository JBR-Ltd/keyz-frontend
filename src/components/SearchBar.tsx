"use client";

import { useState } from "react";

const PROPERTY_TYPES = [
  "All Types",
  "Apartment",
  "House",
  "Land",
  "Commercial",
];
const PRICE_RANGES = [
  "Any",
  "₦0 – ₦500k",
  "₦500k – ₦2M",
  "₦2M – ₦10M",
  "₦10M+",
];
const BEDROOMS = ["Any", "1", "2", "3", "4", "5+"];

function Dropdown({
  label,
  sublabel,
  options,
}: {
  label: string;
  sublabel: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(sublabel);

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 py-3 px-1"
      >
        <div className="text-left">
          <p className="text-sm font-bold text-gray-800">{label}</p>
          <p className="text-base text-gray-400">{selected}</p>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            className="stroke-muted"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
          {options.map((opt) => (
            <li key={opt}>
              <button
                onClick={() => {
                  setSelected(opt);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 text-gray-700"
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SearchBar() {
  return (
    <div className="max-w-6xl mx-auto -mt-8 relative z-20 px-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-6 py-4 flex items-center gap-4">
        {/* Location */}
        <div className="flex-1 flex items-center gap-3 border-r border-gray-200 pr-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            className="fill-accent"
          >
            <path
              d="M10 2C7.24 2 5 4.24 5 7C5 10.75 10 18 10 18C10 18 15 10.75 15 7C15 4.24 12.76 2 10 2ZM10 9C8.9 9 8 8.1 8 7C8 5.9 8.9 5 10 5C11.1 5 12 5.9 12 7C12 8.1 11.1 9 10 9Z"
              fill="currentColor"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-800">Location</p>
            <input
              type="text"
              placeholder="Enter city or area"
              className="text-base text-gray-400 outline-none w-full bg-transparent"
            />
          </div>
        </div>

        <div className="flex-1 border-r border-gray-200 pr-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 10L10 3L17 10V17H13V13H7V17H3V10Z"
              stroke="currentColor"
              className="stroke-accent"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <Dropdown
            label="Property Type"
            sublabel="All Types"
            options={PROPERTY_TYPES}
          />
        </div>

        <div className="flex-1 border-r border-gray-200 pr-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              className="stroke-accent"
              strokeWidth="1.5"
            />
            <path
              d="M10 6v4l3 2"
              stroke="currentColor"
              className="stroke-accent"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <Dropdown label="Price Range" sublabel="Any" options={PRICE_RANGES} />
        </div>

        <div className="flex-1 pr-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect
              x="2"
              y="8"
              width="16"
              height="10"
              rx="1"
              stroke="currentColor"
              className="stroke-accent"
              strokeWidth="1.5"
            />
            <path
              d="M5 8V6C5 4.34 6.34 3 8 3H12C13.66 3 15 4.34 15 6V8"
              stroke="currentColor"
              className="stroke-accent"
              strokeWidth="1.5"
            />
          </svg>
          <Dropdown label="Bedrooms" sublabel="Any" options={BEDROOMS} />
        </div>

        {/* Search button — dark teal */}
        <button className="button-fill-hover bg-primary-soft text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="relative z-10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="white" strokeWidth="1.8" />
              <path
                d="M14 14L18 18"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
