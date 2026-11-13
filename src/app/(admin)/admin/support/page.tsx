"use client";

import { ChevronLeft, Inbox } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import SupportConversation, {
  SupportStatusPill,
} from "@/components/support/SupportConversation";
import { Select, type SelectOption } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  getSupportInbox,
  getSupportThreadAsStaff,
  replyAsStaff,
  setSupportStatus,
  type SupportStatus,
  type SupportThread,
  type SupportTicket,
} from "@/lib/support";

const FILTERS: SelectOption[] = [
  { value: "OPEN", label: "Needs a reply" },
  { value: "ANSWERED", label: "Waiting on them" },
  { value: "SOLVED", label: "Solved" },
  { value: "ALL", label: "All conversations" },
];

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/** The support inbox: every conversation, newest activity first, with replies sent by email too. */
function AdminSupportInbox(): ReactElement {
  const searchParams = useSearchParams();
  const selected = searchParams.get("ticket");
  const { notify } = useToast();
  const [filter, setFilter] = useState<SupportStatus | "ALL">("OPEN");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [listError, setListError] = useState("");
  const [loadedFilter, setLoadedFilter] = useState<string | null>(null);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [loadedReference, setLoadedReference] = useState<string | null>(null);

  const loadInbox = useCallback(async (status: SupportStatus | "ALL") => {
    const result = await getSupportInbox(status === "ALL" ? null : status, 0);
    setTickets(result.data);
    setListError(result.message ?? "");
    setLoadedFilter(status);
  }, []);

  useEffect(() => {
    let active = true;

    void getSupportInbox(filter === "ALL" ? null : filter, 0).then((result) => {
      if (!active) return;
      setTickets(result.data);
      setListError(result.message ?? "");
      setLoadedFilter(filter);
    });

    return () => {
      active = false;
    };
  }, [filter]);

  useEffect(() => {
    if (!selected) return;

    let active = true;

    void getSupportThreadAsStaff(selected).then((result) => {
      if (!active) return;
      setThread(result.data);
      setLoadedReference(selected);
    });

    return () => {
      active = false;
    };
  }, [selected]);

  const isListLoading = loadedFilter !== filter;
  const isThreadLoading = selected !== null && loadedReference !== selected;

  const updated = (next: SupportThread): void => {
    setThread(next);
    void loadInbox(filter);
  };

  const changeStatus = async (status: SupportStatus): Promise<void> => {
    if (!thread) return;

    const result = await setSupportStatus(thread.ticket.reference, status);

    if (result.data) {
      updated(result.data);
    } else {
      notify({
        title: "Not updated",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-4 pb-28 pt-5 sm:px-8 sm:py-12 lg:px-10 lg:py-16 xl:px-14">
      {selected ? (
        <Link
          href="/admin/support"
          className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
        >
          <ChevronLeft size={20} aria-hidden="true" />
          Support inbox
        </Link>
      ) : null}
      <header className={selected ? "hidden lg:block" : ""}>
        <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
          Customer care
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-primary">
          Support inbox
        </h1>
        <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
          Messages from tenants, landlords and agents. Your reply reaches them
          here and by email, signed as Rello support.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:gap-8">
        <div className={selected ? "hidden lg:grid lg:gap-3" : "grid gap-3"}>
          <Select
            ariaLabel="Show conversations"
            value={filter}
            onValueChange={(value) => setFilter(value as SupportStatus | "ALL")}
            options={FILTERS}
            className="min-h-12 rounded-xl border border-border bg-bg px-4 font-bold focus-visible:ring-2 focus-visible:ring-accent"
          />

          {isListLoading ? (
            <div className="grid gap-2">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : listError ? (
            <p className="font-body text-sm text-red-700">{listError}</p>
          ) : tickets.length === 0 ? (
            <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-primary/20 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-primary">
                <Inbox size={26} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="font-body text-sm font-bold text-primary">
                Nothing here
              </p>
              <p className="max-w-xs font-body text-sm leading-6 text-muted">
                {filter === "OPEN"
                  ? "Every conversation has a reply. New messages appear here."
                  : "No conversations in this view."}
              </p>
            </div>
          ) : (
            <ul className="grid gap-2">
              {tickets.map((ticket) => (
                <li key={ticket.reference}>
                  <Link
                    href={`/admin/support?ticket=${ticket.reference}`}
                    aria-current={
                      selected === ticket.reference ? "page" : undefined
                    }
                    className={`block rounded-2xl border px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      selected === ticket.reference
                        ? "border-primary bg-primary/5"
                        : "border-border bg-bg hover:bg-surface-soft"
                    }`}
                  >
                    <span className="block truncate font-body text-sm font-bold text-primary">
                      {ticket.subject}
                    </span>
                    <span className="mt-2 flex min-w-0 items-center gap-2">
                      <SupportStatusPill status={ticket.status} asStaff />
                      <span className="truncate font-body text-xs text-muted">
                        {ticket.requesterName} ·{" "}
                        {formatWhen(ticket.lastMessageAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className={`min-w-0 rounded-2xl lg:border lg:border-border lg:bg-bg lg:p-6 ${
            selected ? "" : "hidden lg:block"
          }`}
        >
          {!selected ? (
            <p className="py-16 text-center font-body text-sm text-muted">
              Choose a conversation to read and reply.
            </p>
          ) : isThreadLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          ) : thread ? (
            <SupportConversation
              thread={thread}
              asStaff
              onSend={async (message, file) => {
                const result = await replyAsStaff(
                  thread.ticket.reference,
                  message,
                  file,
                );

                if (!result.data) {
                  notify({
                    title: "Reply not sent",
                    description: result.message ?? "Try again in a moment.",
                    variant: "error",
                  });
                  return false;
                }

                updated(result.data);
                return true;
              }}
              actions={
                <div className="flex flex-wrap gap-2">
                  {thread.ticket.status !== "SOLVED" ? (
                    <button
                      type="button"
                      onClick={() => void changeStatus("SOLVED")}
                      className="min-h-10 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Mark as solved
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void changeStatus("OPEN")}
                      className="min-h-10 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              }
            />
          ) : (
            <p className="font-body text-sm text-red-700">
              This conversation could not be found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AdminSupportPage(): ReactElement {
  return (
    <Suspense>
      <AdminSupportInbox />
    </Suspense>
  );
}
