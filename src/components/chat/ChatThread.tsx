"use client";

import type { ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, MessageCircle, Phone, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useAuthenticatedUser } from "@/lib/account";
import {
  getConversation,
  sendChatMessage,
  type ServerChatMessage,
} from "@/lib/chat/chatClient";
import type { ChatMessage, ChatPartyRole } from "@/lib/chat/chatStorage";
import { startCall } from "@/lib/calls";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface ChatThreadProps {
  conversationId: string | null;
  /** The counterparty's real account id. Required to reach the server. */
  otherUserId: number | null;
  /** Scopes the thread to a listing, so one pair can hold several conversations. */
  propertyId?: number;
  otherPartyName: string;
  otherPartyRole: ChatPartyRole;
  propertyName: string;
  onClose: () => void;
}

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDateLabel(value: string): string {
  const messageDate = new Date(value);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
  }).format(messageDate);
}

/** The server speaks in numeric ids and `content`; the view speaks in strings and `body`. */
function toDisplayMessage(message: ServerChatMessage): ChatMessage {
  return {
    id: String(message.id),
    conversationId: "",
    senderId: String(message.senderId),
    senderName: message.senderName,
    body: message.content,
    timestamp: message.timestamp,
    status: message.read ? "delivered" : "sent",
    read: message.read,
  };
}

export default function ChatThread({
  conversationId,
  otherUserId,
  propertyId,
  otherPartyName,
  otherPartyRole,
  propertyName,
  onClose,
}: ChatThreadProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useDialogFocus<HTMLElement>(Boolean(conversationId));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendingIds, setSendingIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const { user } = useAuthenticatedUser();
  const currentUserId = user ? String(user.id) : "";

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    if (otherUserId === null) {
      return;
    }

    let active = true;

    async function loadMessages(): Promise<void> {
      // Loading the thread is what marks it read, so there is no second call to miss
      const result = await getConversation(otherUserId as number, propertyId);

      if (!active) {
        return;
      }

      setLoadError(result.message ?? "");
      setMessages(result.data.map(toDisplayMessage));
    }

    void loadMessages();
    inputRef.current?.focus();

    return () => {
      active = false;
    };
  }, [conversationId, otherUserId, propertyId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sendingIds]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [conversationId, onClose]);

  if (!conversationId) {
    return null;
  }

  /**
   * Rings the other party and opens the room.
   *
   * A browser tab rather than an embedded frame: the call keeps running when the
   * thread is closed, and the platform handles the camera permission prompt.
   */
  const placeCall = async (): Promise<void> => {
    if (otherUserId === null || propertyId === undefined) {
      return;
    }

    setIsCalling(true);
    const result = await startCall(otherUserId, propertyId);
    setIsCalling(false);

    if (result.data === null) {
      setLoadError(result.message ?? "That call could not be started.");
      return;
    }

    if (result.data.joinUrl) {
      window.open(result.data.joinUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const body = draft.trim();

    if (!body || otherUserId === null) {
      return;
    }

    // Shown immediately, reconciled with the saved message when the server answers
    const optimisticId = `pending-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      conversationId: "",
      senderId: currentUserId,
      senderName: user ? `${user.firstName} ${user.lastName}`.trim() : "You",
      body,
      timestamp: new Date().toISOString(),
      status: "sent",
      read: false,
    };

    setDraft("");
    setMessages((current) => [...current, optimistic]);
    setSendingIds((current) => [...current, optimisticId]);

    const result = await sendChatMessage(otherUserId, body, propertyId);

    setSendingIds((current) => current.filter((id) => id !== optimisticId));

    if (!result.data) {
      // Drop the bubble rather than leave a message that looks delivered but is not
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticId),
      );
      setDraft(body);
      setLoadError(result.message ?? "That message was not sent.");
      return;
    }

    // The stored version is what other people will see, contact details stripped
    const saved = toDisplayMessage(result.data);
    setMessages((current) =>
      current.map((message) => (message.id === optimisticId ? saved : message)),
    );
  };


  return (
    <OverlayPortal>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[100] bg-black/40"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Message ${otherPartyName}`}
            className="fixed inset-y-0 right-0 z-[110] isolate flex w-full flex-col overflow-hidden bg-bg shadow-xl ring-1 ring-primary/10 sm:w-96"
            initial={reduceMotion ? false : { x: "100%" }}
            animate={reduceMotion ? undefined : { x: 0 }}
            exit={reduceMotion ? undefined : { x: "100%" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="shrink-0 border-b border-border bg-bg px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="truncate font-body text-base font-bold text-primary">
                      {otherPartyName}
                    </h2>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 font-body text-[11px] font-bold text-primary">
                      {otherPartyRole}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-body text-sm text-muted">
                    {propertyName}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {otherUserId !== null && propertyId !== undefined ? (
                    <button
                      type="button"
                      onClick={() => void placeCall()}
                      disabled={isCalling}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                      aria-label={`Call ${otherPartyName}`}
                    >
                      {isCalling ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Phone size={18} aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Close messages"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {loadError ? (
                <p className="mt-3 rounded-lg bg-accent/10 shadow-sm px-3 py-2 font-body text-xs leading-5 text-primary">
                  {loadError}
                </p>
              ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-bg px-4 py-5">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[18rem] flex-col items-center justify-center px-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle size={24} aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-body text-sm font-bold text-primary">
                    Start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.senderId === currentUserId;
                    const previousMessage = messages[index - 1];
                    const showDateLabel =
                      !previousMessage ||
                      getDateLabel(previousMessage.timestamp) !==
                        getDateLabel(message.timestamp);

                    return (
                      <div key={message.id}>
                        {showDateLabel ? (
                          <p className="mb-3 text-center font-body text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                            {getDateLabel(message.timestamp)}
                          </p>
                        ) : null}
                        <div
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                              isCurrentUser
                                ? "rounded-br-md bg-accent/10 shadow-sm text-primary"
                                : "rounded-bl-md bg-primary/10 text-primary"
                            }`}
                          >
                            <p className="break-words font-body text-sm leading-6">
                              {message.body}
                            </p>
                            <p
                              className={`mt-2 font-body text-[11px] ${
                                isCurrentUser ? "text-primary/70" : "text-muted"
                              }`}
                            >
                              {sendingIds.includes(message.id)
                                ? "sending..."
                                : formatMessageTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={(event) => void handleSend(event)}
              className="shrink-0 border-t border-border bg-bg px-4 py-3"
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 shadow-sm">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-10 min-w-0 flex-1 bg-transparent font-body text-sm text-primary outline-none placeholder:text-muted"
                  placeholder="Write a message"
                  aria-label="Write a message"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Send message"
                >
                  <Send size={17} aria-hidden="true" />
                </button>
              </div>
            </form>
          </motion.aside>
        </motion.div>
      </AnimatePresence>
    </OverlayPortal>
  );
}
