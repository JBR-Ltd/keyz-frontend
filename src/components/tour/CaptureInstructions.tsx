"use client";

import type { ReactElement } from "react";
import { Camera, DoorOpen, Move3d, Sun } from "lucide-react";

interface CaptureInstructionsProps {
  onContinue: () => void;
}

const GUIDELINES = [
  {
    icon: DoorOpen,
    title: "Stand at the door you walked in through",
    detail:
      "Stay just inside the doorway, facing into the room. The wizard's " +
      "door-pin diagram uses this as your starting point and draws a cone " +
      "in front of you.",
  },
  {
    icon: Move3d,
    title: "Sweep slowly in a full circle",
    detail:
      "Use your phone's built-in panorama mode. Move at a steady pace so the " +
      "photo doesn't blur.",
  },
  {
    icon: Sun,
    title: "Watch the lighting",
    detail:
      "Turn on the lights. If you're shooting at night, keep a light source " +
      "behind you.",
  },
  {
    icon: Camera,
    title: "Get the whole room",
    detail:
      "Floor to ceiling, wall to wall. If something is cut off, step back and " +
      "re-sweep.",
  },
];

export default function CaptureInstructions({
  onContinue,
}: CaptureInstructionsProps): ReactElement {
  return (
    <section aria-labelledby="tour-capture-instructions">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Before you start
      </p>
      <h2
        id="tour-capture-instructions"
        className="mt-2 font-display text-2xl font-bold text-primary"
      >
        Before you start capturing
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        A few seconds of care here saves a lot of clean-up later.
      </p>

      <ul className="mt-6 grid gap-3">
        {GUIDELINES.map((guideline, index) => {
          const Icon = guideline.icon;
          return (
            <li
              key={guideline.title}
              className="flex gap-4 rounded-lg border border-border bg-bg px-4 py-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-alt">
                <Icon size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-body text-sm font-bold text-primary">
                  {index + 1}. {guideline.title}
                </p>
                <p className="mt-1 font-body text-xs leading-5 text-muted">
                  {guideline.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Start capturing
      </button>
    </section>
  );
}
