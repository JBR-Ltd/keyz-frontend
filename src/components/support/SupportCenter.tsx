"use client";

import {
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Paperclip,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, type ReactElement } from "react";
import SupportConversation, {
  SupportStatusPill,
} from "@/components/support/SupportConversation";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  getMySupportTickets,
  getSupportThread,
  markSupportSolved,
  openSupportTicket,
  replyToSupport,
  type SupportThread,
  type SupportTicket,
} from "@/lib/support";

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function NewMessageForm({
  onSent,
}: {
  onSent: (thread: SupportThread) => void;
}): ReactElement {
  const { notify } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const send = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSending(true);
    const result = await openSupportTicket(
      subject.trim(),
      message.trim(),
      file,
    ).finally(() => setIsSending(false));

    if (!result.data) {
      notify({
        title: "Message not sent",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    notify({
      title: "Message sent",
      description: "We'll reply here and by email.",
      variant: "success",
    });
    onSent(result.data);
  };

  const fieldClass =
    "mt-2 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

  return (
    <form onSubmit={(event) => void send(event)} className="grid gap-4">
      <h2 className="font-display text-2xl font-bold text-primary">
        How can we help?
      </h2>
      <label className="font-body text-sm font-bold text-primary">
        Subject
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={150}
          required
          placeholder="For example, payment not showing"
          className={`${fieldClass} min-h-12`}
        />
      </label>
      <label className="font-body text-sm font-bold text-primary">
        Message
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={5000}
          required
          rows={6}
          placeholder="Tell us what happened, and include the booking or listing if it is about one."
          className={`${fieldClass} py-3 leading-6`}
        />
      </label>
      <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-surface-soft focus-within:ring-2 focus-within:ring-accent">
        <Paperclip size={16} aria-hidden="true" />
        <span className="min-w-0 truncate">
          {file ? file.name : "Attach a screenshot (optional)"}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <button
        type="submit"
        disabled={isSending}
        aria-busy={isSending}
        className="min-h-12 rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
      >
        <AsyncButtonContent isPending={isSending} pendingLabel="Sending…">
          Send message
        </AsyncButtonContent>
      </button>
    </form>
  );
}

/**
 * Help and support for tenants, landlords and agents. The address carries the open
 * conversation (?ticket=) or the new-message form (?new=1), so the phone's back
 * button and shared links both work.
 */
export default function SupportCenter(): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useToast();
  const selected = searchParams.get("ticket");
  const isNew = searchParams.get("new") === "1";

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [listError, setListError] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [threadError, setThreadError] = useState("");
  const [loadedReference, setLoadedReference] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getMySupportTickets().then((result) => {
      if (!active) return;
      setTickets(result.data);
      setListError(result.message ?? "");
      setIsListLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;

    let active = true;

    void getSupportThread(selected).then((result) => {
      if (!active) return;
      setThread(result.data);
      setThreadError(result.data ? "" : (result.message ?? ""));
      setLoadedReference(selected);
    });

    return () => {
      active = false;
    };
  }, [selected]);

  const showThread = (next: SupportThread): void => {
    setThread(next);
    setLoadedReference(next.ticket.reference);
    setTickets((current) => [
      next.ticket,
      ...current.filter((item) => item.reference !== next.ticket.reference),
    ]);
  };

  const pane = selected ? "thread" : isNew ? "new" : "list";
  const isThreadLoading = selected !== null && loadedReference !== selected;

  const list = (
    <div className="grid gap-3">
      <Link
        href={`${pathname}?new=1`}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus size={18} aria-hidden="true" />
        New message
      </Link>

      {isListLoading ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : listError ? (
        <p className="rounded-2xl border border-border bg-bg p-4 font-body text-sm text-red-700">
          {listError}
        </p>
      ) : tickets.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-primary/20 bg-bg px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-primary">
            <LifeBuoy size={26} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <h2 className="font-body text-base font-bold text-primary">
            No conversations yet
          </h2>
          <p className="max-w-xs font-body text-sm leading-6 text-muted">
            Questions about a booking, a payment or your account? Send us a
            message and a person from Rello will reply.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {tickets.map((ticket) => (
            <li key={ticket.reference}>
              <Link
                href={`${pathname}?ticket=${ticket.reference}`}
                aria-current={
                  selected === ticket.reference ? "page" : undefined
                }
                className={`flex min-h-20 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selected === ticket.reference
                    ? "border-primary bg-primary/5"
                    : "border-border bg-bg hover:bg-surface-soft active:bg-surface-soft"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-sm font-bold text-primary">
                    {ticket.subject}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <SupportStatusPill status={ticket.status} asStaff={false} />
                    <span className="font-body text-xs text-muted">
                      {formatDay(ticket.lastMessageAt)}
                    </span>
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  className="shrink-0 text-muted lg:hidden"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const detail =
    pane === "new" ? (
      <NewMessageForm
        onSent={(next) => {
          showThread(next);
          router.replace(`${pathname}?ticket=${next.ticket.reference}`);
        }}
      />
    ) : pane === "thread" ? (
      isThreadLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : thread ? (
        <SupportConversation
          thread={thread}
          asStaff={false}
          onSend={async (message, file) => {
            const result = await replyToSupport(
              thread.ticket.reference,
              message,
              file,
            );

            if (!result.data) {
              notify({
                title: "Message not sent",
                description: result.message ?? "Try again in a moment.",
                variant: "error",
              });
              return false;
            }

            showThread(result.data);
            return true;
          }}
          actions={
            thread.ticket.status !== "SOLVED" ? (
              <button
                type="button"
                onClick={async () => {
                  const result = await markSupportSolved(
                    thread.ticket.reference,
                  );
                  if (result.data) showThread(result.data);
                }}
                className="min-h-10 shrink-0 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Mark as solved
              </button>
            ) : null
          }
        />
      ) : (
        <p className="font-body text-sm text-red-700">
          {threadError || "This conversation could not be found."}
        </p>
      )
    ) : (
      <div className="hidden h-full min-h-64 place-items-center rounded-2xl border border-dashed border-primary/20 bg-bg p-8 text-center lg:grid">
        <p className="max-w-xs font-body text-sm leading-6 text-muted">
          Choose a conversation, or start a new one. We usually reply within a
          working day.
        </p>
      </div>
    );

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface-soft px-4 pb-28 pt-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        {pane !== "list" ? (
          <Link
            href={pathname}
            className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
          >
            <ChevronLeft size={20} aria-hidden="true" />
            Help & support
          </Link>
        ) : null}
        <header className={pane !== "list" ? "hidden lg:block" : ""}>
          <h1 className="font-display text-3xl font-bold leading-tight text-primary lg:text-4xl">
            Help & support
          </h1>
          <p className="mt-2 font-body text-sm leading-6 text-muted lg:text-base">
            Talk to the Rello team. Replies come here and to your email.
          </p>
        </header>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:mt-7 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8">
          <div className={pane === "list" ? "" : "hidden lg:block"}>{list}</div>
          <div
            className={`min-w-0 rounded-2xl lg:border lg:border-border lg:bg-bg lg:p-6 ${
              pane === "list" ? "hidden lg:block" : ""
            }`}
          >
            {detail}
          </div>
        </div>
      </div>
    </main>
  );
}
