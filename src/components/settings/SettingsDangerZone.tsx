"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmActionModal from "@/components/settings/ConfirmActionModal";
import { useToast } from "@/components/ui/toast";
import { deleteAccount } from "@/lib/account";

type AccountAction = "deactivate" | "delete";

const ACTION_CONTENT: Record<
  AccountAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
  }
> = {
  deactivate: {
    title: "Deactivate account?",
    description: "Your profile will be hidden until you sign in again.",
    confirmLabel: "Deactivate account",
  },
  delete: {
    title: "Delete account?",
    description: "This permanently removes your profile and account data.",
    confirmLabel: "Delete account",
  },
};

export default function SettingsDangerZone() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingAction, setPendingAction] = useState<AccountAction | null>(
    null,
  );
  const { notify } = useToast();

  const handleActionRequest = (action: AccountAction): void => {
    setIsOpen(false);

    if (action === "deactivate") {
      notify({
        title: "Deactivation unavailable",
        description:
          "The server does not support temporary account deactivation yet.",
        variant: "error",
      });
      return;
    }

    setPendingAction(action);
  };

  const handleConfirm = async (): Promise<void> => {
    if (pendingAction !== "delete") {
      return;
    }

    setIsDeleting(true);
    const result = await deleteAccount();
    setIsDeleting(false);

    notify({
      title: result.success ? "Account deleted" : "Account not deleted",
      description: result.message,
      variant: result.success ? "success" : "error",
    });

    if (result.success) {
      setPendingAction(null);
      router.replace("/login");
    }
  };

  const pendingContent = pendingAction ? ACTION_CONTENT[pendingAction] : null;

  return (
    <div className="grid gap-5 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex items-center gap-3 text-red-700">
          <AlertTriangle size={20} />
          <h2 className="font-body text-xl font-bold">Danger Zone</h2>
        </div>
        <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
          Temporarily disable or permanently delete your account.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-12 rounded-full border border-red-700 px-6 py-3 font-body text-sm font-medium text-red-700 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-red-700 hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        Manage Account
      </button>

      <ConfirmActionModal
        isOpen={isOpen}
        mode="account"
        onCancel={() => setIsOpen(false)}
        onAction={handleActionRequest}
      />

      <ConfirmActionModal
        isOpen={pendingContent !== null}
        mode="confirm"
        title={pendingContent?.title ?? "Confirm account action?"}
        description={
          pendingContent?.description ?? "Confirm this account action."
        }
        confirmLabel={pendingContent?.confirmLabel ?? "Confirm"}
        isLoading={isDeleting}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
