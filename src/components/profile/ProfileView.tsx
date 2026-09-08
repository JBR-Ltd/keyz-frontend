import ProfileSection from "@/components/settings/sections/ProfileSection";

export default function ProfileView() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-surface-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
            Profile
          </h1>
          <p className="mt-3 font-body text-base text-muted">
            Manage your personal information and account identity
          </p>
        </header>

        <div className="mt-8">
          <ProfileSection />
        </div>
      </div>
    </main>
  );
}
