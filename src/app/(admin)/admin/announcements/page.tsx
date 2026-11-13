"use client";

import { FormEvent, useState, type ReactElement } from "react";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { useToast } from "@/components/ui/toast";
import { sendAnnouncement, type AnnouncementAudience } from "@/lib/marketplace";

const AUDIENCES: { id: AnnouncementAudience; label: string }[] = [
  { id: "TENANTS", label: "Tenants" },
  { id: "HOSTS", label: "Landlords and agents" },
  { id: "EVERYONE", label: "Everyone" },
];

/**
 * Editorial email from the Rello team. It only reaches people who turned on
 * Rello updates in their notification settings, which is off by default.
 */
export default function AdminAnnouncementsPage(): ReactElement {
  const { notify } = useToast();
  const [audience, setAudience] = useState<AnnouncementAudience>("TENANTS");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [isSending, setIsSending] = useState(false);

  const send = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if ((actionLabel.trim() === "") !== (actionUrl.trim() === "")) {
      notify({
        title: "Button needs both parts",
        description:
          "Add a label and a link for the button, or leave both empty.",
        variant: "error",
      });
      return;
    }

    setIsSending(true);
    const result = await sendAnnouncement({
      audience,
      subject: subject.trim(),
      message: message.trim(),
      actionLabel: actionLabel.trim() || undefined,
      actionUrl: actionUrl.trim() || undefined,
    }).finally(() => setIsSending(false));

    if (result.data === null) {
      notify({
        title: "Not sent",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    notify({
      title:
        result.data === 0
          ? "Nobody to send to"
          : `Queued for ${result.data} ${result.data === 1 ? "person" : "people"}`,
      description:
        result.data === 0
          ? "Nobody in that audience has Rello updates turned on yet."
          : "It goes out over the next few minutes.",
      variant: result.data === 0 ? "error" : "success",
    });

    if (result.data > 0) {
      setSubject("");
      setMessage("");
      setActionLabel("");
      setActionUrl("");
    }
  };

  const fieldClass =
    "mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
        Editorial
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold text-primary">
        Announcements
      </h1>
      <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
        Market notes, guides and product news by email. It only reaches people
        who turned on Rello updates in their notification settings.
      </p>

      <form
        onSubmit={(event) => void send(event)}
        className="mt-8 grid max-w-3xl gap-5 rounded-2xl border border-border bg-bg p-5 sm:p-6"
      >
        <fieldset>
          <legend className="font-body text-sm font-bold text-primary">
            Send to
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AUDIENCES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setAudience(option.id)}
                aria-pressed={audience === option.id}
                className={`min-h-11 rounded-full border px-4 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  audience === option.id
                    ? "border-primary bg-primary text-white"
                    : "border-primary/20 text-primary hover:bg-primary/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="font-body text-sm font-bold text-primary">
          Subject
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={150}
            required
            className={fieldClass}
          />
        </label>

        <label className="font-body text-sm font-bold text-primary">
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={5000}
            required
            rows={10}
            className={`${fieldClass} py-3 leading-6`}
          />
          <span className="mt-1 block font-body text-xs font-normal text-muted">
            Plain text. Leave an empty line between paragraphs.
          </span>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="font-body text-sm font-bold text-primary">
            Button label (optional)
            <input
              value={actionLabel}
              onChange={(event) => setActionLabel(event.target.value)}
              maxLength={40}
              className={fieldClass}
            />
          </label>
          <label className="font-body text-sm font-bold text-primary">
            Button link (optional)
            <input
              value={actionUrl}
              onChange={(event) => setActionUrl(event.target.value)}
              type="url"
              placeholder="https://"
              maxLength={500}
              className={fieldClass}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSending}
          aria-busy={isSending}
          className="min-h-12 justify-self-start rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
        >
          <AsyncButtonContent isPending={isSending} pendingLabel="Sending…">
            Send announcement
          </AsyncButtonContent>
        </button>
      </form>
    </main>
  );
}
