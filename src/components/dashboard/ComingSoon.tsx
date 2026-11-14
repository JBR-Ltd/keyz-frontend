interface ComingSoonProps {
  eyebrow: string;
  title: string;
}

export default function ComingSoon({ eyebrow, title }: ComingSoonProps) {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-16 lg:min-h-screen">
      <div className="w-full max-w-2xl rounded-lg border border-primary bg-[var(--color-bg)] p-8 text-center shadow-md sm:p-12">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          {eyebrow}
        </p>
        <h1 className="mt-5 font-display text-5xl font-bold leading-[0.92] text-primary sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 font-body text-lg text-muted">Coming soon</p>
      </div>
    </main>
  );
}
