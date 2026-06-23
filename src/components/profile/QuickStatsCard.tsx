"use client";

import type { QuickStat } from "@/components/profile/types";

interface QuickStatsCardProps {
  stats: QuickStat[];
}

export default function QuickStatsCard({ stats }: QuickStatsCardProps) {
  return (
    <section className="h-full border border-surface bg-[var(--color-bg)] p-5 sm:p-7">
      <p className="font-display text-3xl font-bold leading-tight text-primary">
        Quick Stats
      </p>
      <div className="mt-7 grid h-[calc(100%-4rem)] grid-cols-2 gap-x-8 gap-y-12">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`min-h-28 ${index % 2 === 0 ? "pr-4" : ""}`}
          >
            <p className="font-display text-5xl font-bold leading-none text-primary sm:text-6xl">
              {stat.value}
            </p>
            <p className="mt-4 font-body text-base font-bold leading-6 text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
