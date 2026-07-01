import { BadgeCheck, Mail, MapPin } from "lucide-react";

interface SettingsHeroProps {
  onViewProfile: () => void;
}

export default function SettingsHero({ onViewProfile }: SettingsHeroProps) {
  return (
    <section className="settings-hero-surface grid overflow-hidden rounded-b-2xl text-white lg:grid-cols-[8rem_1fr_19rem] lg:items-center">
      <div className="flex min-h-40 items-center justify-center px-6 pt-10 sm:justify-start sm:px-8 lg:min-h-0 lg:px-10 lg:py-10">
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[var(--color-bg)] font-display text-5xl font-bold text-primary shadow-md ring-4 ring-white/10">
          AO
        </div>
      </div>

      <div className="px-6 py-8 sm:px-8 lg:px-6 lg:py-12">
        <p className="font-body text-sm text-white/60">Welcome back,</p>
        <h2 className="mt-3 font-display text-6xl font-bold leading-[0.88] tracking-[-0.03em] sm:text-7xl">
          Jemimah
        </h2>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 font-body text-xs font-medium text-white">
          <BadgeCheck size={17} />
          Verified
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 pb-10 pt-2 lg:px-8 lg:py-8">
        <div className="space-y-4 font-body text-sm text-white/70">
          <p className="flex items-center gap-3 break-all">
            <Mail size={17} className="shrink-0 text-accent" />
            amara.okafor@example.com
          </p>
          <p className="flex items-center gap-3">
            <MapPin size={17} className="shrink-0 text-accent" />
            Lagos, Nigeria
          </p>
        </div>
        <button
          type="button"
          onClick={onViewProfile}
          className="mt-6 min-h-12 self-start rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View profile
        </button>
      </div>
    </section>
  );
}
