interface RoleDashboardStubProps {
  role: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Agent:
    "List and sell properties. Verified agents connect buyers with quality FOR_SALE listings.",
  Admin:
    "Admin backend support is not connected yet. This dashboard uses placeholder data for design review.",
};

export default function RoleDashboardStub({ role }: RoleDashboardStubProps) {
  const description = ROLE_DESCRIPTIONS[role] ?? "Coming soon";
  return (
    <main className="min-h-[calc(100vh-5rem)] px-5 py-14 sm:px-8 lg:min-h-screen lg:px-12 lg:py-20">
      <div className="max-w-4xl border-b border-primary pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          {role} portal
        </p>
        <h1 className="mt-5 font-display text-5xl font-bold leading-[0.92] text-primary sm:text-6xl">
          {role} Dashboard
        </h1>
        <p className="mt-5 max-w-2xl font-body text-lg leading-8 text-muted">
          {description}
        </p>
      </div>
    </main>
  );
}
