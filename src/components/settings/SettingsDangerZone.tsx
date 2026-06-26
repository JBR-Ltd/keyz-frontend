"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import ConfirmActionModal from "@/components/settings/ConfirmActionModal";
import { useToast } from "@/components/ui/toast";

export default function SettingsDangerZone() {
  const [isOpen, setIsOpen] = useState(false);
  const { notify } = useToast();

  const handleAction = (action: "deactivate" | "delete") => {
    setIsOpen(false);
    notify({
      title: action === "deactivate" ? "Account deactivated" : "Deletion requested",
      description: "This is a simulated account action.",
      variant: "success",
    });
  };

  return (
    <>
      <section className="grid border border-red-700 bg-red-500/10 lg:grid-cols-[4rem_1fr_auto] lg:items-center">
        <div className="hidden h-full items-center justify-center border-r border-red-700 text-red-700 lg:flex">
          <AlertTriangle size={24} />
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-3 text-red-700 lg:block">
            <AlertTriangle size={22} className="lg:hidden" />
            <h2 className="font-body text-lg font-bold">Danger Zone</h2>
          </div>
          <p className="mt-3 font-body text-sm leading-6 text-muted">
            Temporarily disable or permanently delete your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="min-h-16 self-stretch border-t border-red-700 bg-red-700 px-8 py-4 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500 lg:min-w-52 lg:border-l lg:border-t-0"
        >
          Manage Account
        </button>
      </section>

      <ConfirmActionModal
        isOpen={isOpen}
        mode="account"
        onCancel={() => setIsOpen(false)}
        onAction={handleAction}
      />
    </>
  );
}
