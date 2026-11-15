"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import UserAvatar from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";
import ChatThread from "@/components/chat/ChatThread";
import {
  getChatThreads,
  type ChatPartyRole as ServerChatPartyRole,
  type ChatThread as ChatThreadSummary,
} from "@/lib/chat/chatClient";
import type { ChatPartyRole } from "@/lib/chat/chatStorage";
import { millisecondsSince, parseServerTime } from "@/lib/serverTime";
import { getInitials } from "@/lib/utils";

/** A list someone is reading should feel alive without hammering the server. */
const POLL_MS = 15000;

const ROLE_LABELS: Record<ServerChatPartyRole, ChatPartyRole> = {
  ADMIN: "Admin",
  AGENT: "Agent",
  LANDLORD: "Landlord",
  TENANT: "Tenant",
};

function formatWhen(value: string | null): string {
  if (!value) {
    return "";
  }

  const elapsed = millisecondsSince(value);

  if (Number.isNaN(elapsed)) {
    return "";
  }

  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d`;

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
  }).format(parseServerTime(value));
}

export default function MessagesInbox(): ReactElement {
  const [conversations, setConversations] = useState<ChatThreadSummary[]>([]);
  const [active, setActive] = useState<ChatThreadSummary | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;
    let pending = false;

    async function load(): Promise<void> {
      if (pending) return;
      pending = true;

      try {
        const threads = await getChatThreads();

        if (!isActive) return;

        setLoadError(threads.message ?? "");
        setConversations(threads.data);
      } finally {
        pending = false;

        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();

    // A hidden tab skips the request rather than polling in the background
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load();
      }
    }, POLL_MS);

    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return conversations;
    }

    return conversations.filter(
      (conversation) =>
        conversation.otherUserName.toLowerCase().includes(needle) ||
        (conversation.lastMessage ?? "").toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  const unreadTotal = conversations.filter(
    (conversation) => conversation.lastMessage && !conversation.lastMessageRead,
  ).length;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6">
      <header>
        <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Messages
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">
          Your conversations
        </h1>
        <p className="mt-2 font-body text-sm leading-6 text-muted">
          {unreadTotal > 0
            ? `${unreadTotal} conversation${unreadTotal === 1 ? "" : "s"} waiting on you.`
            : "Everything here is up to date."}
        </p>
      </header>

      <label className="mt-6 flex items-center gap-3 rounded-full bg-surface-soft px-4 focus-within:ring-2 focus-within:ring-accent">
        <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
        <span className="sr-only">Search conversations</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or message"
          className="min-h-12 min-w-0 flex-1 bg-transparent font-body text-sm text-primary outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </label>

      <section className="mt-6">
        {isLoading ? (
          <CardListSkeleton count={4} label="Loading conversations" />
        ) : loadError ? (
          <p className="font-body text-sm text-red-700" role="alert">
            {loadError}
          </p>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Message a host from any listing, or reply to a tenant, and it shows up here."
          />
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nothing matches that"
            description="Try a different name, or part of a message you remember."
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl bg-bg">
            {matches.map((conversation) => {
              const isUnread =
                Boolean(conversation.lastMessage) &&
                !conversation.lastMessageRead;

              return (
                <li key={conversation.otherUserId}>
                  <button
                    type="button"
                    onClick={() => setActive(conversation)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <UserAvatar
                      avatarUrl={conversation.otherUserAvatarUrl}
                      initials={getInitials(conversation.otherUserName)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate font-body text-sm font-bold text-primary">
                          {conversation.otherUserName}
                        </span>
                        <span className="shrink-0 font-body text-xs text-muted">
                          {formatWhen(conversation.lastMessageTimestamp)}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-3">
                        <span
                          className={`truncate font-body text-sm ${
                            isUnread
                              ? "font-semibold text-primary"
                              : "text-muted"
                          }`}
                        >
                          {conversation.lastMessage ?? "No messages yet"}
                        </span>
                        {isUnread ? (
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent"
                            aria-label="Unread"
                          />
                        ) : null}
                      </span>
                      <span className="mt-1 block font-body text-xs text-muted">
                        {ROLE_LABELS[conversation.otherUserRole]}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {active ? (
        <ChatThread
          conversationId={String(active.otherUserId)}
          otherUserId={active.otherUserId}
          otherPartyName={active.otherUserName}
          otherPartyAvatarUrl={active.otherUserAvatarUrl}
          otherPartyRole={ROLE_LABELS[active.otherUserRole]}
          propertyName=""
          onClose={() => setActive(null)}
        />
      ) : null}
    </main>
  );
}
