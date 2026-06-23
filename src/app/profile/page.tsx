"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import AuthGate from "@/components/auth/AuthGate";
import ProfileOverviewCard from "@/components/profile/ProfileOverviewCard";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileTabs from "@/components/profile/ProfileTabs";
import QuickStatsCard from "@/components/profile/QuickStatsCard";
import NotificationTab from "@/components/profile/tabs/NotificationTab";
import PaymentsTab from "@/components/profile/tabs/PaymentsTab";
import PrivacyTab from "@/components/profile/tabs/PrivacyTab";
import ProfileTab from "@/components/profile/tabs/ProfileTab";
import SecurityTab from "@/components/profile/tabs/SecurityTab";
import type {
  ProfileTabId,
  ProfileTabItem,
  QuickStat,
  UserProfile,
} from "@/components/profile/types";

const PROFILE_TABS: ProfileTabItem[] = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "notification", label: "Notification" },
  { id: "payments", label: "Payments" },
  { id: "privacy", label: "Privacy" },
];

const INITIAL_PROFILE: UserProfile = {
  name: "Adaora Martins",
  email: "adaora.martins@example.com",
  phone: "+234 801 234 5678",
  verified: true,
};

const QUICK_STATS: QuickStat[] = [
  { label: "Upcoming Bookings", value: "3" },
  { label: "Completed Trips", value: "18" },
  { label: "Saved Properties", value: "12" },
  { label: "Average Rating", value: "4.9" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("profile");
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleOverviewEdit = (): void => {
    setActiveTab("profile");
    setEditingProfile(true);
  };

  return (
    <AuthGate>
      <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <ProfileSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <section
          className={`px-4 py-8 transition-all duration-200 ease-in-out sm:px-6 lg:px-10 lg:py-12 ${
            sidebarCollapsed ? "lg:ml-24" : "lg:ml-72"
          }`}
        >
          <div className="mx-auto max-w-6xl">
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)] lg:items-stretch">
              <ProfileOverviewCard
                profile={profile}
                onEdit={handleOverviewEdit}
              />
              <QuickStatsCard stats={QUICK_STATS} />
            </div>

            <section className="mt-10">
              <ProfileTabs
                tabs={PROFILE_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <div className="mt-8">
                <AnimatePresence mode="wait">
                  {activeTab === "profile" ? (
                    <ProfileTab
                      key="profile"
                      profile={profile}
                      editing={editingProfile}
                      onEditingChange={setEditingProfile}
                      onSave={setProfile}
                    />
                  ) : null}
                  {activeTab === "security" ? (
                    <SecurityTab key="security" />
                  ) : null}
                  {activeTab === "notification" ? (
                    <NotificationTab key="notification" />
                  ) : null}
                  {activeTab === "payments" ? (
                    <PaymentsTab key="payments" />
                  ) : null}
                  {activeTab === "privacy" ? (
                    <PrivacyTab key="privacy" />
                  ) : null}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </section>
      </main>
    </AuthGate>
  );
}
