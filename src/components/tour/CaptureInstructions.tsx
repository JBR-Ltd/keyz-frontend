"use client";

interface CaptureInstructionsProps {
  onContinue: () => void;
}

const GUIDELINES = [
  "Stand as close to the center of the room as possible.",
  "If the center is obstructed, move to the nearest open space with a clear view.",
  "Capture the entire room without cutting off important areas.",
  "Ensure good lighting and keep the phone level during capture.",
];

export default function CaptureInstructions({ onContinue }: CaptureInstructionsProps) {
  return (
    <section aria-labelledby="tour-capture-instructions">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Before You Start
      </p>
      <h2 id="tour-capture-instructions" className="mt-2 font-display text-2xl font-bold text-primary">
        Capture instructions
      </h2>

      <ul className="mt-6 grid gap-3">
        {GUIDELINES.map((guideline) => (
          <li
            key={guideline}
            className="flex gap-3 rounded-lg border border-border px-4 py-3 font-body text-sm leading-6 text-primary"
          >
            <span className="text-accent">-</span>
            {guideline}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Start Capturing
      </button>
    </section>
  );
}