"use client";

import { Paperclip, X } from "lucide-react";
import { FormEvent, useRef, useState, type ReactElement } from "react";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import {
  supportAttachmentUrl,
  type SupportStatus,
  type SupportThread,
} from "@/lib/support";

const STATUS_LABELS: Record<SupportStatus, string> = {
  OPEN: "Waiting on Rello",
  ANSWERED: "Rello replied",
  SOLVED: "Solved",
};

const STATUS_STAFF_LABELS: Record<SupportStatus, string> = {
  OPEN: "Needs a reply",
  ANSWERED: "Waiting on them",
  SOLVED: "Solved",
};

export function supportStatusLabel(
  status: SupportStatus,
  asStaff: boolean,
): string {
  return (asStaff ? STATUS_STAFF_LABELS : STATUS_LABELS)[status];
}

export function SupportStatusPill({
  status,
  asStaff,
}: {
  status: SupportStatus;
  asStaff: boolean;
}): ReactElement {
  const tone =
    status === "OPEN"
      ? asStaff
        ? "bg-accent text-primary"
        : "bg-primary/10 text-primary"
      : status === "ANSWERED"
        ? asStaff
          ? "bg-primary/10 text-primary"
          : "bg-accent text-primary"
        : "bg-surface-soft text-muted";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 font-body text-xs font-bold ${tone}`}
    >
      {supportStatusLabel(status, asStaff)}
    </span>
  );
}

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

interface SupportConversationProps {
  thread: SupportThread;
  /** The admin inbox sees requester details and replies as the team. */
  asStaff: boolean;
  onSend: (message: string, file: File | null) => Promise<boolean>;
  /** Extra controls under the subject, such as "Mark as solved" or status changes. */
  actions?: ReactElement | null;
}

/** One support conversation: the messages, then a box to write the next one. */
export default function SupportConversation({
  thread,
  asStaff,
  onSend,
  actions,
}: SupportConversationProps): ReactElement {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ticket, messages } = thread;

  const send = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!message.trim()) return;

    setIsSending(true);
    const sent = await onSend(message.trim(), file).finally(() =>
      setIsSending(false),
    );

    if (sent) {
      setMessage("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-5">
      <header className="grid gap-3 border-b border-border pb-4">
        <h2 className="font-display text-2xl font-bold leading-tight text-primary">
          {ticket.subject}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <SupportStatusPill status={ticket.status} asStaff={asStaff} />
            <span className="font-body text-xs text-muted">
              Ref {ticket.reference}
            </span>
          </div>
          {actions}
        </div>
        {asStaff && ticket.requesterEmail ? (
          <p className="break-words font-body text-sm text-muted">
            {ticket.requesterName} · {ticket.requesterEmail}
            {ticket.requesterRole
              ? ` · ${ticket.requesterRole.toLowerCase()}`
              : ""}
          </p>
        ) : null}
      </header>

      <ol className="grid gap-3" aria-label="Messages">
        {messages.map((item) => {
          // Each side sees its own messages on the right, like any chat
          const mine = item.fromStaff === asStaff;

          return (
            <li
              key={item.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  mine
                    ? "rounded-br-md bg-primary text-white"
                    : "rounded-bl-md border border-border bg-bg text-primary"
                }`}
              >
                <p
                  className={`font-body text-xs font-bold ${mine ? "text-white/70" : "text-muted"}`}
                >
                  {item.authorName} · {formatWhen(item.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6">
                  {item.body}
                </p>
                {item.attachmentName ? (
                  <a
                    href={supportAttachmentUrl(
                      ticket.reference,
                      item.id,
                      asStaff,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 font-body text-xs font-bold underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      mine
                        ? "bg-white/10 text-white"
                        : "bg-surface-soft text-primary"
                    }`}
                  >
                    <Paperclip size={13} aria-hidden="true" />
                    {item.attachmentName}
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <form
        onSubmit={(event) => void send(event)}
        className="grid gap-3 rounded-2xl border border-border bg-bg p-3 sm:p-4"
      >
        <label className="sr-only" htmlFor={`reply-${ticket.reference}`}>
          {asStaff ? "Your reply" : "Your message"}
        </label>
        <textarea
          id={`reply-${ticket.reference}`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={5000}
          rows={3}
          placeholder={
            asStaff
              ? "Write your reply. They get it by email too."
              : ticket.status === "SOLVED"
                ? "Write to reopen this conversation"
                : "Write a message"
          }
          className="min-h-24 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 font-body text-base leading-6 text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              id={`file-${ticket.reference}`}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? (
              <span className="inline-flex min-h-10 min-w-0 items-center gap-1.5 rounded-full bg-surface-soft pl-3 pr-1 font-body text-xs font-bold text-primary">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Remove attachment"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
            ) : (
              <label
                htmlFor={`file-${ticket.reference}`}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 font-body text-sm font-bold text-primary hover:bg-surface-soft focus-within:ring-2 focus-within:ring-accent"
              >
                <Paperclip size={16} aria-hidden="true" />
                Attach
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            aria-busy={isSending}
            className="min-h-11 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AsyncButtonContent isPending={isSending} pendingLabel="Sending…">
              {asStaff ? "Send reply" : "Send"}
            </AsyncButtonContent>
          </button>
        </div>
      </form>
    </div>
  );
}
