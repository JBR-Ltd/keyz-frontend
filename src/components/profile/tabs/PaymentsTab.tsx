"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CreditCard, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ConfirmActionModal from "@/components/profile/ConfirmActionModal";
import type {
  BillingTransaction,
  ConfirmAction,
  PaymentMethod,
} from "@/components/profile/types";
import { useToast } from "@/components/ui/toast";

const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "visa-4242", brand: "Visa", last4: "4242", expiry: "08/28" },
  { id: "mastercard-1881", brand: "Mastercard", last4: "1881", expiry: "11/27" },
];

const BILLING_HISTORY: BillingTransaction[] = [
  {
    id: "inv-001",
    date: "June 12, 2026",
    description: "Lekki short stay booking",
    amount: "NGN 420,000",
    status: "Paid",
  },
  {
    id: "inv-002",
    date: "May 28, 2026",
    description: "Victoria Island inspection",
    amount: "NGN 35,000",
    status: "Paid",
  },
  {
    id: "inv-003",
    date: "April 19, 2026",
    description: "Ikoyi apartment deposit",
    amount: "NGN 950,000",
    status: "Refunded",
  },
];

interface CardFormValues {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

interface CardFormErrors {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  cardholderName?: string;
}

function waitForMockAction(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 650));
}

function validateCard(values: CardFormValues): CardFormErrors {
  const errors: CardFormErrors = {};

  if (values.cardNumber.replace(/\s/g, "").length < 12) {
    errors.cardNumber = "Enter a valid card number";
  }

  if (!values.expiry.trim()) {
    errors.expiry = "Expiry is required";
  }

  if (values.cvv.length < 3) {
    errors.cvv = "CVV is required";
  }

  if (!values.cardholderName.trim()) {
    errors.cardholderName = "Cardholder name is required";
  }

  return errors;
}

export default function PaymentsTab() {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const [paymentMethods, setPaymentMethods] = useState(INITIAL_PAYMENT_METHODS);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardValues, setCardValues] = useState<CardFormValues>({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
  });
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({});
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  useEffect(() => {
    if (!addOpen) {
      return;
    }

    modalRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setAddOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addOpen]);

  const handleCardChange = (
    field: keyof CardFormValues,
    value: string,
  ): void => {
    setCardValues((current) => ({ ...current, [field]: value }));
  };

  const handleCardSave = async (): Promise<void> => {
    const nextErrors = validateCard(cardValues);

    setCardErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    await waitForMockAction();
    setPaymentMethods((current) => [
      ...current,
      {
        id: `card-${Date.now()}`,
        brand: "Card",
        last4: cardValues.cardNumber.replace(/\s/g, "").slice(-4),
        expiry: cardValues.expiry,
      },
    ]);
    setSaving(false);
    setAddOpen(false);
    setCardValues({
      cardNumber: "",
      expiry: "",
      cvv: "",
      cardholderName: "",
    });
    setCardErrors({});
    notify({
      title: "Payment method added",
      description: "This card exists only in local UI state.",
      variant: "success",
    });
  };

  const requestRemoveCard = (method: PaymentMethod): void => {
    setPendingAction({
      title: "Remove payment method?",
      description: `${method.brand} ending in ${method.last4} will be removed from this mock list.`,
      confirmLabel: "Remove Card",
      onConfirm: async () => {
        await waitForMockAction();
        setPaymentMethods((current) =>
          current.filter((item) => item.id !== method.id),
        );
        setPendingAction(null);
        notify({
          title: "Payment method removed",
          description: `${method.brand} ending in ${method.last4} was removed.`,
          variant: "success",
        });
      },
    });
  };

  const fields = [
    { id: "cardNumber", label: "Card Number", autoComplete: "cc-number" },
    { id: "expiry", label: "Expiry", autoComplete: "cc-exp" },
    { id: "cvv", label: "CVV", autoComplete: "cc-csc" },
    {
      id: "cardholderName",
      label: "Cardholder Name",
      autoComplete: "cc-name",
    },
  ] as const;

  return (
    <motion.section
      id="profile-panel-payments"
      role="tabpanel"
      aria-labelledby="profile-tab-payments"
      className="grid gap-8"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <section className="border border-primary bg-[var(--color-bg)] p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-surface pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Payments
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-primary">
              Saved payment methods
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={18} />
            Add Payment Method
          </button>
        </div>

        <div className="mt-6 border border-surface">
          {paymentMethods.map((method, index) => (
            <div
              key={method.id}
              className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
                index > 0 ? "border-t border-surface" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center border border-primary text-primary">
                  <CreditCard size={20} />
                </span>
                <div>
                  <h3 className="font-body text-base font-bold text-primary">
                    {method.brand} ending in {method.last4}
                  </h3>
                  <p className="mt-1 font-body text-sm text-muted">
                    Expires {method.expiry}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => requestRemoveCard(method)}
                className="inline-flex min-h-11 items-center justify-center bg-red-500 px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-primary bg-[var(--color-bg)] p-5 sm:p-7">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Billing History
        </p>
        <div className="mt-6 overflow-x-auto border border-surface">
          <table className="min-w-[42rem] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface">
                {["Date", "Description", "Amount", "Status"].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 font-accent text-xs font-bold uppercase tracking-[0.22em] text-primary"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BILLING_HISTORY.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className={index > 0 ? "border-t border-surface" : ""}
                >
                  <td className="px-4 py-4 font-body text-sm text-muted">
                    {transaction.date}
                  </td>
                  <td className="px-4 py-4 font-body text-sm font-bold text-primary">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-4 font-body text-sm text-[var(--color-text)]">
                    {transaction.amount}
                  </td>
                  <td className="px-4 py-4 font-body text-sm font-bold text-accent">
                    {transaction.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {addOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-black/50 p-4"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setAddOpen(false);
              }
            }}
          >
            <motion.div
              ref={modalRef}
              className="w-full max-w-xl border border-primary bg-[var(--color-bg)] p-6 shadow-[6px_6px_0_var(--color-primary)] outline-none"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-card-title"
              tabIndex={-1}
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="add-card-title"
                  className="font-display text-3xl font-bold leading-tight text-primary"
                >
                  Add payment method
                </h2>
                <button
                  type="button"
                  aria-label="Close payment dialog"
                  onClick={() => setAddOpen(false)}
                  className="flex h-10 w-10 items-center justify-center border border-surface text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-6 grid gap-5">
                {fields.map((field) => {
                  const error = cardErrors[field.id];

                  return (
                    <label
                      key={field.id}
                      className="block"
                      htmlFor={`payment-${field.id}`}
                    >
                      <span className="font-body text-sm font-bold text-primary">
                        {field.label}
                      </span>
                      <input
                        id={`payment-${field.id}`}
                        value={cardValues[field.id]}
                        autoComplete={field.autoComplete}
                        onChange={(event) =>
                          handleCardChange(field.id, event.currentTarget.value)
                        }
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={
                          error ? `payment-${field.id}-error` : undefined
                        }
                        className="mt-2 min-h-14 w-full border border-surface bg-[var(--color-bg)] px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out focus:border-primary focus:ring-2 focus:ring-accent/30"
                      />
                      {error ? (
                        <p
                          id={`payment-${field.id}-error`}
                          className="mt-2 font-body text-sm font-bold text-red-500"
                        >
                          {error}
                        </p>
                      ) : null}
                    </label>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center border border-primary px-5 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCardSave}
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center bg-primary px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Please wait..." : "Save Card"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmActionModal
        open={pendingAction !== null}
        title={pendingAction?.title ?? ""}
        description={pendingAction?.description ?? ""}
        confirmLabel={pendingAction?.confirmLabel ?? "Confirm"}
        onCancel={() => setPendingAction(null)}
        onConfirm={pendingAction?.onConfirm ?? waitForMockAction}
      />
    </motion.section>
  );
}
