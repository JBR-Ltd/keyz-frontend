"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type ChatMessageStatus = "sent" | "delivered";

export type ChatPartyRole = "Tenant" | "Landlord" | "Agent" | "Admin";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  timestamp: string;
  status: ChatMessageStatus;
  read: boolean;
}

export interface ConversationMetadata {
  conversationId: string;
  propertyName: string;
  otherPartyName: string;
  otherPartyRole: ChatPartyRole;
}

export interface ConversationSummary extends ConversationMetadata {
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

interface StoredConversation extends ConversationMetadata {
  messages: ChatMessage[];
}

interface ChatDatabase extends DBSchema {
  messages: {
    key: string;
    value: StoredConversation;
  };
}

export interface ChatStorageResult<TValue> {
  data: TValue;
  unavailable: boolean;
}

const CHAT_DATABASE_NAME = "rello-chat";
const CHAT_DATABASE_VERSION = 1;
const CHAT_STORAGE_EVENT = "rello-chat-storage-change";
const CURRENT_USER_ID = "tenant-current";
const CURRENT_USER_NAME = "You";

let databasePromise: Promise<IDBPDatabase<ChatDatabase>> | null = null;

function getDatabase(): Promise<IDBPDatabase<ChatDatabase>> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }

  databasePromise ??= openDB<ChatDatabase>(
    CHAT_DATABASE_NAME,
    CHAT_DATABASE_VERSION,
    {
      upgrade(database) {
        if (!database.objectStoreNames.contains("messages")) {
          database.createObjectStore("messages", {
            keyPath: "conversationId",
          });
        }
      },
    },
  );

  return databasePromise;
}

function publishStorageChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CHAT_STORAGE_EVENT));
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createConversationRecord(
  metadata: ConversationMetadata,
): StoredConversation {
  return {
    ...metadata,
    messages: [],
  };
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

function getLastMessage(messages: ChatMessage[]): ChatMessage | null {
  return sortMessages(messages).at(-1) ?? null;
}

function getFallbackConversation(conversationId: string): StoredConversation {
  return {
    conversationId,
    propertyName: "Property",
    otherPartyName: "Host",
    otherPartyRole: "Agent",
    messages: [],
  };
}

function toConversationSummary(
  conversation: StoredConversation,
): ConversationSummary | null {
  const lastMessage = getLastMessage(conversation.messages);

  if (!lastMessage) {
    return null;
  }

  return {
    conversationId: conversation.conversationId,
    propertyName: conversation.propertyName,
    otherPartyName: conversation.otherPartyName,
    otherPartyRole: conversation.otherPartyRole,
    lastMessage: lastMessage.body,
    lastTimestamp: lastMessage.timestamp,
    unreadCount: conversation.messages.filter(
      (message) => !message.read && message.senderId !== CURRENT_USER_ID,
    ).length,
  };
}

export function subscribeToChatStorage(callback: () => void): () => void {
  window.addEventListener(CHAT_STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener(CHAT_STORAGE_EVENT, callback);
  };
}

export function getCurrentChatUser(): { id: string; name: string } {
  return {
    id: CURRENT_USER_ID,
    name: CURRENT_USER_NAME,
  };
}

export function createChatMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  body: string,
  read: boolean,
  status: ChatMessageStatus = "delivered",
): ChatMessage {
  return {
    id: createMessageId(),
    conversationId,
    senderId,
    senderName,
    body,
    timestamp: new Date().toISOString(),
    status,
    read,
  };
}

export function getConversationId(
  propertyId: string,
  participantIds: string[],
): string {
  return [
    propertyId.trim().toLowerCase(),
    ...participantIds.map((id) => id.trim().toLowerCase()).sort(),
  ].join("__");
}

export async function getConversation(
  conversationId: string,
): Promise<ChatStorageResult<ChatMessage[]>> {
  try {
    const database = await getDatabase();
    const conversation = await database.get("messages", conversationId);

    return {
      data: conversation ? sortMessages(conversation.messages) : [],
      unavailable: false,
    };
  } catch {
    return {
      data: [],
      unavailable: true,
    };
  }
}

export async function appendMessage(
  conversationId: string,
  message: ChatMessage,
): Promise<ChatStorageResult<void>> {
  try {
    const database = await getDatabase();
    const current =
      (await database.get("messages", conversationId)) ??
      getFallbackConversation(conversationId);

    await database.put("messages", {
      ...current,
      messages: sortMessages([...current.messages, message]),
    });
    publishStorageChange();

    return {
      data: undefined,
      unavailable: false,
    };
  } catch {
    return {
      data: undefined,
      unavailable: true,
    };
  }
}

export async function upsertConversationMetadata(
  metadata: ConversationMetadata,
): Promise<ChatStorageResult<void>> {
  try {
    const database = await getDatabase();
    const current = await database.get("messages", metadata.conversationId);

    await database.put("messages", {
      ...(current ?? createConversationRecord(metadata)),
      ...metadata,
      messages: current?.messages ?? [],
    });
    publishStorageChange();

    return {
      data: undefined,
      unavailable: false,
    };
  } catch {
    return {
      data: undefined,
      unavailable: true,
    };
  }
}

export async function getAllConversations(): Promise<
  ChatStorageResult<ConversationSummary[]>
> {
  try {
    const database = await getDatabase();
    const conversations = await database.getAll("messages");

    return {
      data: conversations
        .map(toConversationSummary)
        .filter((summary): summary is ConversationSummary => Boolean(summary))
        .sort(
          (left, right) =>
            new Date(right.lastTimestamp).getTime() -
            new Date(left.lastTimestamp).getTime(),
        ),
      unavailable: false,
    };
  } catch {
    return {
      data: [],
      unavailable: true,
    };
  }
}

export async function markConversationRead(
  conversationId: string,
): Promise<ChatStorageResult<void>> {
  try {
    const database = await getDatabase();
    const conversation = await database.get("messages", conversationId);

    if (!conversation) {
      return {
        data: undefined,
        unavailable: false,
      };
    }

    await database.put("messages", {
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        read: true,
      })),
    });
    publishStorageChange();

    return {
      data: undefined,
      unavailable: false,
    };
  } catch {
    return {
      data: undefined,
      unavailable: true,
    };
  }
}

export async function seedMockConversations(): Promise<
  ChatStorageResult<void>
> {
  try {
    const database = await getDatabase();
    const existing = await database.getAll("messages");

    if (existing.length > 0) {
      return {
        data: undefined,
        unavailable: false,
      };
    }

    const seededAt = Date.now();
    const conversations: StoredConversation[] = [
      {
        conversationId: getConversationId("glass-house-lekki", [
          CURRENT_USER_ID,
          "host-glass-01",
        ]),
        propertyName: "The Glass House, Lekki",
        otherPartyName: "Kemi Balogun",
        otherPartyRole: "Landlord",
        messages: [
          {
            id: createMessageId(),
            conversationId: getConversationId("glass-house-lekki", [
              CURRENT_USER_ID,
              "host-glass-01",
            ]),
            senderId: CURRENT_USER_ID,
            senderName: CURRENT_USER_NAME,
            body: "Hi Kemi, is the apartment still available for the July dates?",
            timestamp: new Date(seededAt - 10800000).toISOString(),
            status: "delivered",
            read: true,
          },
          {
            id: createMessageId(),
            conversationId: getConversationId("glass-house-lekki", [
              CURRENT_USER_ID,
              "host-glass-01",
            ]),
            senderId: "host-glass-01",
            senderName: "Kemi Balogun",
            body: "Yes, it is available. I can also arrange an inspection tomorrow afternoon.",
            timestamp: new Date(seededAt - 7200000).toISOString(),
            status: "delivered",
            read: false,
          },
        ],
      },
      {
        conversationId: getConversationId("maitama-courtyard", [
          CURRENT_USER_ID,
          "agent-maitama-01",
        ]),
        propertyName: "Maitama Courtyard",
        otherPartyName: "Tomi Adeyemi",
        otherPartyRole: "Agent",
        messages: [
          {
            id: createMessageId(),
            conversationId: getConversationId("maitama-courtyard", [
              CURRENT_USER_ID,
              "agent-maitama-01",
            ]),
            senderId: "agent-maitama-01",
            senderName: "Tomi Adeyemi",
            body: "The Maitama unit is ready for viewing. Would Tuesday work for you?",
            timestamp: new Date(seededAt - 93600000).toISOString(),
            status: "delivered",
            read: true,
          },
        ],
      },
      {
        conversationId: getConversationId("harbour-view-residence", [
          CURRENT_USER_ID,
          "agent-harbour-01",
        ]),
        propertyName: "Harbour View Residence",
        otherPartyName: "Ada Williams",
        otherPartyRole: "Agent",
        messages: [
          {
            id: createMessageId(),
            conversationId: getConversationId("harbour-view-residence", [
              CURRENT_USER_ID,
              "agent-harbour-01",
            ]),
            senderId: CURRENT_USER_ID,
            senderName: CURRENT_USER_NAME,
            body: "I have submitted the offer. Please confirm once the seller reviews it.",
            timestamp: new Date(seededAt - 180000000).toISOString(),
            status: "delivered",
            read: true,
          },
          {
            id: createMessageId(),
            conversationId: getConversationId("harbour-view-residence", [
              CURRENT_USER_ID,
              "agent-harbour-01",
            ]),
            senderId: "agent-harbour-01",
            senderName: "Ada Williams",
            body: "Received. I will share feedback as soon as the seller responds.",
            timestamp: new Date(seededAt - 176400000).toISOString(),
            status: "delivered",
            read: true,
          },
        ],
      },
    ];

    const transaction = database.transaction("messages", "readwrite");

    await Promise.all(
      conversations.map((conversation) => transaction.store.put(conversation)),
    );
    await transaction.done;
    publishStorageChange();

    return {
      data: undefined,
      unavailable: false,
    };
  } catch {
    return {
      data: undefined,
      unavailable: true,
    };
  }
}
