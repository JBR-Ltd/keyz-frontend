"use client";

import type { ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import {
  appendMessage,
  ChatMessage,
  ChatPartyRole,
  createChatMessage,
  getConversation,
  getCurrentChatUser,
  markConversationRead,
  upsertConversationMetadata,
} from "@/lib/chat/chatStorage";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface ChatThreadProps {
  conversationId: string | null;
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

export default function ChatThread({
  conversationId,
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
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const currentUser = getCurrentChatUser();

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let active = true;
    const activeConversationId = conversationId;

    async function loadMessages(): Promise<void> {
      const metadataResult = await upsertConversationMetadata({
        conversationId: activeConversationId,
        propertyName,
        otherPartyName,
        otherPartyRole,
      });
      const readResult = await markConversationRead(activeConversationId);
      const conversationResult = await getConversation(activeConversationId);

      if (!active) {
        return;
      }

      setStorageUnavailable(
        metadataResult.unavailable ||
          readResult.unavailable ||
          conversationResult.unavailable,
      );
      setMessages(conversationResult.data);
    }

    void loadMessages();
    inputRef.current?.focus();

    return () => {
      active = false;
    };
  }, [conversationId, otherPartyName, otherPartyRole, propertyName]);

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

  const handleSend = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const body = draft.trim();

    if (!body) {
      return;
    }

    const optimisticMessage = createChatMessage(
      conversationId,
      currentUser.id,
      currentUser.name,
      body,
      true,
      "sent",
    );

    setDraft("");
    setMessages((current) => [...current, optimisticMessage]);
    setSendingIds((current) => [...current, optimisticMessage.id]);

    window.setTimeout(() => {
      const deliveredMessage: ChatMessage = {
        ...optimisticMessage,
        status: "delivered",
      };

      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticMessage.id ? deliveredMessage : message,
        ),
      );
      setSendingIds((current) =>
        current.filter((id) => id !== optimisticMessage.id),
      );

      void appendMessage(conversationId, deliveredMessage).then((result) => {
        if (result.unavailable) {
          setStorageUnavailable(true);
        }
      });
    }, 450);
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
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Close messages"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {storageUnavailable ? (
                <p className="mt-3 rounded-lg bg-accent/10 shadow-sm px-3 py-2 font-body text-xs leading-5 text-primary">
                  Local message storage is unavailable in this browser session.
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
                    const isCurrentUser = message.senderId === currentUser.id;
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
              onSubmit={handleSend}
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
