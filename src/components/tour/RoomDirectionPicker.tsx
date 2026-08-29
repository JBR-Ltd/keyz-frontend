"use client";

import { useState } from "react";
import type { Direction } from "@/lib/types/tour";

interface RoomDirectionPickerProps {
  fromRoomName: string;
  toRoomName: string;
  onSelect: (direction: Direction) => void;
}

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "NORTH", label: "North" },
  { value: "SOUTH", label: "South" },
  { value: "EAST", label: "East" },
  { value: "WEST", label: "West" },
];

export default function RoomDirectionPicker({
  fromRoomName,
  toRoomName,
  onSelect,
}: RoomDirectionPickerProps) {
  const [selected, setSelected] = useState<Direction | null>(null);

  return (
    <section aria-labelledby="tour-direction-picker">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Floor Plan
      </p>
      <h2 id="tour-direction-picker" className="mt-2 font-display text-2xl font-bold text-primary">
        Where is the {toRoomName}?
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Relative to the {fromRoomName}, which direction is the {toRoomName} in?
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {DIRECTIONS.map((direction) => (
          <button
            key={direction.value}
            type="button"
            onClick={() => setSelected(direction.value)}
            className={`min-h-12 rounded-lg border font-body text-sm font-bold transition-all duration-200 ${
              selected === direction.value
                ? "border-accent bg-accent text-primary"
                : "border-border text-primary hover:border-accent"
            }`}
          >
            {direction.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={() => selected && onSelect(selected)}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirm Position
      </button>
    </section>
  );
}