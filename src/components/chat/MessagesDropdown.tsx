"use client";

import type { ReactElement } from "react";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatThread from "@/components/chat/ChatThread";
import type { ChatPartyRole } from "@/lib/chat/chatStorage";
import {
  getChatThreads,
  getUnreadCount,
  type ChatThread as ChatThreadSummary,
} from "@/lib/chat/chatClient";

function toDisplayRole(role: string): ChatPartyRole {
  if (role === "LANDLORD") return "Landlord";
  if (role === "ADMIN") return "Admin";
  if (role === "TENANT") return "Tenant";
  return "Agent";
}

function formatRelativeTimestamp(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

/**
 * How often the unread badge and thread list refresh. A count does not need to be
 * instant; a list someone is looking at should feel alive.
 */
const THREADS_POLL_MS = 30000;
const OPEN_PANEL_POLL_MS = 10000;

export default function MessagesDropdown(): ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatThreadSummary[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatThreadSummary | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    let pending = false;

    async function loadThreads(): Promise<void> {
      if (pending) return;
      pending = true;

      try {
        await Promise.all([
          getChatThreads().then((threads) => {
            if (!active) return;
            setLoadError(threads.message ?? "");
            setConversations(threads.data);
          }),
          getUnreadCount().then((unread) => {
            if (!active || unread.message) return;
            setUnreadCount(unread.data);
          }),
        ]);
      } finally {
        pending = false;
      }
    }

    // Runs on mount and again whenever the panel opens, so the badge is never
    // stale on the way in. It used to fire twice on open.
    void loadThreads();

    // The badge used to move only on a page reload. A hidden tab skips the request.
    const timer = window.setInterval(
      () => {
        if (document.visibilityState === "visible") {
          void loadThreads();
        }
      },
      isOpen ? OPEN_PANEL_POLL_MS : THREADS_POLL_MS,
    );

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleConversationOpen = (conversation: ChatThreadSummary): void => {
    triggerRef.current?.focus();
    setActiveConversation(conversation);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Open messages"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MessageCircle size={20} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-body text-[11px] font-bold leading-none text-primary">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 z-[110] isolate w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-bg shadow-xl"
          role="menu"
          aria-label="Messages"
        >
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-body text-sm font-semibold text-primary">
              Messages
            </h2>
          </div>

          {loadError ? (
            <div className="px-5 py-10 text-center">
              <p className="font-body text-sm text-red-700">{loadError}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-body text-sm text-muted">
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="max-h-[22rem] overflow-y-auto py-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.otherUserId}
                  type="button"
                  onClick={() => handleConversationOpen(conversation)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  role="menuitem"
                >
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-body text-sm font-bold text-primary">
                        {conversation.otherUserName}
                      </span>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-body text-[10px] font-bold text-primary">
                        {toDisplayRole(conversation.otherUserRole)}
                      </span>
                    </span>
                    <span className="mt-1 block truncate font-body text-xs text-muted">
                      {conversation.lastMessage}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-2">
                    <span className="font-body text-[11px] font-bold text-muted">
                      {conversation.lastMessageTimestamp
                        ? formatRelativeTimestamp(
                            conversation.lastMessageTimestamp,
                          )
                        : ""}
                    </span>
                    {!conversation.lastMessageRead ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <ChatThread
        conversationId={
          activeConversation ? String(activeConversation.otherUserId) : null
        }
        otherUserId={activeConversation?.otherUserId ?? null}
        otherPartyName={activeConversation?.otherUserName ?? ""}
        otherPartyRole={toDisplayRole(
          activeConversation?.otherUserRole ?? "AGENT",
        )}
        propertyName=""
        onClose={() => setActiveConversation(null)}
      />
    </div>
  );
}
