import ProfileSection from "@/components/settings/sections/ProfileSection";

export default function ProfileView() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-surface-soft px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <ProfileSection />
      </div>
    </main>
  );
}
