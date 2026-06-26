import { BadgeCheck, Mail, MapPin } from "lucide-react";

interface SettingsHeroProps {
  onViewProfile: () => void;
}

export default function SettingsHero({ onViewProfile }: SettingsHeroProps) {
  return (
    <section className="grid border-x border-primary bg-primary text-white lg:grid-cols-[1fr_10rem_19rem] lg:items-center">
      <div className="px-6 py-10 sm:px-8 sm:py-12 lg:px-10">
        <p className="font-body text-sm text-white/60">Welcome back,</p>
        <h2 className="mt-3 font-display text-6xl font-bold leading-[0.88] tracking-[-0.03em] sm:text-7xl">
          Amara.
        </h2>
        <div className="mt-6 inline-flex items-center gap-2 bg-accent px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.18em] text-primary">
          <BadgeCheck size={17} />
          Verified
        </div>
      </div>

      <div className="flex min-h-36 items-center justify-center border-t border-white/20 px-6 py-8 sm:justify-start lg:min-h-0 lg:border-l lg:border-t-0 lg:px-4">
        <div className="flex h-32 w-32 items-center justify-center border border-white/30 bg-[var(--color-bg)] font-display text-5xl font-bold text-primary">
          AO
        </div>
      </div>

      <div className="flex flex-col justify-center border-t border-white/20 px-6 py-8 lg:border-l lg:border-t-0">
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
          className="mt-6 min-h-11 self-start border border-white px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View profile
        </button>
      </div>
    </section>
  );
}
