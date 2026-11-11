"use client";

import { Handshake, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  acceptMandate,
  attachListing,
  declineMandate,
  detachListing,
  endMandate,
  getMandateOverview,
  getMandates,
  inviteLandlord,
  type Mandate,
  type MandateOverview,
} from "@/lib/marketplace";

interface MandatesViewProps {
  role: "agent" | "landlord";
}

const STATUS_LABELS: Record<Mandate["status"], string> = {
  INVITED: "Waiting for the landlord",
  ACTIVE: "Active",
  DECLINED: "Declined",
  ENDED: "Ended",
};

/**
 * Agents managing homes for landlords. The agent invites; the landlord accepts; rent
 * for managed listings goes to the landlord and the agreed fee to the agent.
 */
export default function MandatesView({ role }: MandatesViewProps): ReactElement {
  const { notify } = useToast();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [overview, setOverview] = useState<MandateOverview | null>(null);
  const [busy, setBusy] = useState("");
  const [email, setEmail] = useState("");
  const [fee, setFee] = useState("10");
  const [note, setNote] = useState("");
  const [listingRef, setListingRef] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    let active = true;

    void getMandates().then((result) => {
      if (!active) {
        return;
      }

      setMandates(result.data);
      setError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (openId === null) {
      return;
    }

    let active = true;

    void getMandateOverview(openId).then((result) => {
      if (active) {
        setOverview(result.data);
      }
    });

    return () => {
      active = false;
    };
  }, [openId]);

  const replace = (updated: Mandate | null, message: string | undefined, success: string): boolean => {
    if (!updated) {
      notify({ title: "That did not work", description: message ?? "Try again in a moment.", variant: "error" });
      return false;
    }

    setMandates((current) =>
      current.some((item) => item.id === updated.id)
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [updated, ...current],
    );
    setOverview((current) => (current && current.mandate.id === updated.id ? { ...current, mandate: updated } : current));
    notify({ title: success, variant: "success" });
    return true;
  };

  const invite = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy("invite");
    const result = await inviteLandlord(email.trim(), Number(fee), note.trim());
    setBusy("");

    if (replace(result.data, result.message, "Invitation sent")) {
      setEmail("");
      setNote("");
    }
  };

  const act = async (
    key: string,
    call: Promise<{ data: Mandate | null; message?: string }>,
    success: string,
  ): Promise<void> => {
    setBusy(key);
    const result = await call;
    setBusy("");

    if (replace(result.data, result.message, success) && openId !== null) {
      setReason("");
      setListingRef("");
      const refreshed = await getMandateOverview(openId);
      setOverview(refreshed.data);
    }
  };

  const selected = mandates.find((item) => item.id === openId) ?? null;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">Management</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-primary sm:text-5xl">
        {role === "agent" ? "Mandates" : "Agent mandates"}
      </h1>
      <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
        {role === "agent"
          ? "Ask a landlord for permission to let their homes on Rello. Once they accept, add the listings you manage for them: rent goes to their verified account and your fee comes to you."
          : "Agents who want to let your homes on Rello ask here. Only accept an agent you know and agreed terms with. Rent for managed homes is paid into your own verified account."}
      </p>

      {role === "agent" ? (
        <form onSubmit={(event) => void invite(event)} className="mt-8 grid max-w-2xl gap-3 rounded-lg bg-bg p-5 shadow-sm sm:grid-cols-[1fr_8rem]">
          <label htmlFor="mandate-email" className="font-body text-sm font-bold text-primary">
            Landlord email
            <input
              id="mandate-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-bg px-3 font-body text-sm font-normal text-primary outline-none focus:border-accent"
            />
          </label>
          <label htmlFor="mandate-fee" className="font-body text-sm font-bold text-primary">
            Your fee (%)
            <input
              id="mandate-fee"
              type="number"
              min="0"
              max="20"
              step="0.5"
              required
              value={fee}
              onChange={(event) => setFee(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-bg px-3 font-body text-sm font-normal text-primary outline-none focus:border-accent"
            />
          </label>
          <label htmlFor="mandate-note" className="font-body text-sm font-bold text-primary sm:col-span-2">
            Note to the landlord (optional)
            <input
              id="mandate-note"
              value={note}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-bg px-3 font-body text-sm font-normal text-primary outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={busy !== ""}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 sm:col-span-2 sm:w-fit"
          >
            {busy === "invite" ? <Loader2 size={15} className="animate-spin" /> : <Handshake size={15} aria-hidden="true" />}
            Send invitation
          </button>
        </form>
      ) : null}

      {isLoading ? (
        <div className="mt-10 flex justify-center" role="status">
          <Loader2 size={22} className="animate-spin text-muted" />
          <span className="sr-only">Loading mandates</span>
        </div>
      ) : error ? (
        <p className="mt-8 font-body text-sm text-red-700">{error}</p>
      ) : mandates.length === 0 ? (
        <p className="mt-8 rounded-lg bg-surface-soft p-8 text-center font-body text-sm text-muted">No mandates yet.</p>
      ) : (
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul className="grid content-start gap-3">
            {mandates.map((mandate) => (
              <li key={mandate.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOverview(null);
                    setOpenId(mandate.id);
                  }}
                  aria-pressed={openId === mandate.id}
                  className={`w-full rounded-lg p-4 text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    openId === mandate.id ? "bg-primary/5 ring-1 ring-primary/20" : "bg-bg hover:bg-primary/5"
                  }`}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-body text-base font-bold text-primary">
                      {role === "agent" ? mandate.landlordName ?? mandate.landlordEmail : mandate.agentName}
                    </span>
                    <StatusBadge tone={mandate.status === "ACTIVE" ? "primary" : mandate.status === "INVITED" ? "accent" : "neutral"}>
                      {STATUS_LABELS[mandate.status]}
                    </StatusBadge>
                  </span>
                  <span className="mt-1 block font-body text-sm text-muted">
                    {mandate.agentFeePercent}% agent fee · {mandate.propertyCount} listing{mandate.propertyCount === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <article className="rounded-lg bg-bg p-5 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-primary">
                {role === "agent" ? selected.landlordName ?? selected.landlordEmail : selected.agentName}
              </h2>
              {selected.note ? <p className="mt-2 font-body text-sm text-muted">“{selected.note}”</p> : null}
              {selected.endReason ? (
                <p className="mt-2 font-body text-sm text-muted">
                  <span className="font-bold text-primary">Reason: </span>
                  {selected.endReason}
                </p>
              ) : null}

              {selected.viewerRole === "LANDLORD" && selected.status === "INVITED" ? (
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => void act("accept", acceptMandate(selected.id), "Mandate accepted")}
                    disabled={busy !== ""}
                    className="min-h-11 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                  >
                    Accept this agent
                  </button>
                  <button
                    type="button"
                    onClick={() => void act("decline", declineMandate(selected.id, reason.trim()), "Mandate declined")}
                    disabled={busy !== ""}
                    className="min-h-11 rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              ) : null}

              {overview && overview.mandate.id === selected.id ? (
                <div className="mt-6 grid gap-5">
                  <div>
                    <h3 className="font-body text-sm font-bold uppercase tracking-[0.12em] text-muted">Listings</h3>
                    {overview.properties.length === 0 ? (
                      <p className="mt-2 font-body text-sm text-muted">No listings under this mandate yet.</p>
                    ) : (
                      <ul className="mt-2 grid gap-2">
                        {overview.properties.map((property) => (
                          <li key={property.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-soft px-3 py-2">
                            <span className="min-w-0">
                              <span className="block truncate font-body text-sm font-bold text-primary">{property.title}</span>
                              <span className="block truncate font-body text-xs text-muted">{property.address}</span>
                            </span>
                            {selected.viewerRole === "AGENT" && selected.status === "ACTIVE" ? (
                              <button
                                type="button"
                                onClick={() => void act(`detach-${property.id}`, detachListing(selected.id, property.publicId), "Listing removed")}
                                disabled={busy !== ""}
                                className="shrink-0 font-body text-xs font-bold text-muted hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                Remove
                              </button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                    {selected.viewerRole === "AGENT" && selected.status === "ACTIVE" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label htmlFor="mandate-listing" className="sr-only">
                          Listing id
                        </label>
                        <input
                          id="mandate-listing"
                          value={listingRef}
                          onChange={(event) => setListingRef(event.target.value)}
                          placeholder="Listing id, such as p_8f3k2"
                          className="min-h-10 flex-1 rounded-lg border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent"
                        />
                        <button
                          type="button"
                          onClick={() => void act("attach", attachListing(selected.id, listingRef.trim()), "Listing added")}
                          disabled={busy !== "" || !listingRef.trim()}
                          className="min-h-10 rounded-full bg-primary px-4 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                        >
                          Add listing
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="font-body text-sm font-bold uppercase tracking-[0.12em] text-muted">Bookings</h3>
                    {overview.bookings.length === 0 ? (
                      <p className="mt-2 font-body text-sm text-muted">No bookings on these listings yet.</p>
                    ) : (
                      <ul className="mt-2 grid gap-2">
                        {overview.bookings.map((booking) => (
                          <li key={booking.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-soft px-3 py-2 font-body text-sm">
                            <span className="min-w-0">
                              <span className="block truncate font-bold text-primary">{booking.propertyTitle}</span>
                              <span className="block text-xs text-muted">
                                {booking.tenantName} · {booking.status.toLowerCase()}
                              </span>
                            </span>
                            <span className="shrink-0 font-bold text-primary">
                              <PropertyPrice value={booking.totalPrice} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {overview.agentFees.length > 0 ? (
                    <div>
                      <h3 className="font-body text-sm font-bold uppercase tracking-[0.12em] text-muted">Agent fees</h3>
                      <ul className="mt-2 grid gap-2">
                        {overview.agentFees.map((feeRow) => (
                          <li key={feeRow.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-soft px-3 py-2 font-body text-sm">
                            <span className="text-muted">
                              Booking {feeRow.bookingId} · {feeRow.status.toLowerCase().replace(/_/g, " ")}
                            </span>
                            <span className="font-bold text-primary">
                              <PropertyPrice value={feeRow.amount} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : openId !== null ? (
                <div className="mt-6 flex justify-center" role="status">
                  <Loader2 size={18} className="animate-spin text-muted" />
                  <span className="sr-only">Loading mandate</span>
                </div>
              ) : null}

              {selected.status === "ACTIVE" || (selected.status === "INVITED" && selected.viewerRole === "AGENT") ? (
                <div className="mt-6 grid gap-2 border-t border-border pt-5">
                  <label htmlFor="mandate-reason" className="font-body text-sm font-bold text-primary">
                    {selected.status === "INVITED" ? "Withdraw the invitation" : "End this mandate"}
                  </label>
                  <input
                    id="mandate-reason"
                    value={reason}
                    maxLength={500}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Why it is ending"
                    className="min-h-10 rounded-lg border border-border bg-bg px-3 font-body text-sm text-primary outline-none focus:border-accent"
                  />
                  <p className="font-body text-xs leading-5 text-muted">
                    Its listings stop taking new bookings. Rent on bookings already made still goes to the landlord.
                  </p>
                  <button
                    type="button"
                    onClick={() => void act("end", endMandate(selected.id, reason.trim()), "Mandate ended")}
                    disabled={busy !== "" || !reason.trim()}
                    className="min-h-10 w-fit rounded-full border border-red-700/40 px-4 font-body text-sm font-bold text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                  >
                    {selected.status === "INVITED" ? "Withdraw" : "End mandate"}
                  </button>
                </div>
              ) : null}
            </article>
          ) : (
            <p className="rounded-lg bg-surface-soft p-8 text-center font-body text-sm text-muted">
              Choose a mandate to see its listings, bookings and fees.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
