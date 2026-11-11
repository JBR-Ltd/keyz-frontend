"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import ChatThread from "@/components/chat/ChatThread";
import { Button } from "@/components/ui/button";
import {
  ChatPartyRole,
  getConversationId,
  getCurrentChatUser,
} from "@/lib/chat/chatStorage";
import type { PropertyHostRole } from "@/lib/propertyDetails";

interface MessageHostButtonProps {
  hostId: string;
  hostName: string;
  hostRole: PropertyHostRole;
  propertyId: string;
  propertyName: string;
  onGuestAction?: () => void;
  openInitially?: boolean;
}

function formatHostRole(role: PropertyHostRole): ChatPartyRole {
  return role === "LANDLORD" ? "Landlord" : "Agent";
}

export default function MessageHostButton({
  hostId,
  hostName,
  hostRole,
  propertyId,
  propertyName,
  onGuestAction,
  openInitially = false,
}: MessageHostButtonProps): ReactElement {
  const [isThreadOpen, setIsThreadOpen] = useState(openInitially);

  if (onGuestAction) {
    return (
      <Button
        type="button"
        variant="utility-secondary"
        size="utility"
        onClick={onGuestAction}
        className="w-full font-bold sm:w-auto"
      >
        <MessageSquareText size={17} aria-hidden="true" />
        Message {formatHostRole(hostRole)}
      </Button>
    );
  }

  const currentUser = getCurrentChatUser();
  const hostLabel = formatHostRole(hostRole);
  const conversationId = getConversationId(propertyId, [
    currentUser.id,
    hostId,
  ]);

  return (
    <>
      <Button
        type="button"
        variant="utility-secondary"
        size="utility"
        onClick={() => setIsThreadOpen(true)}
        className="w-full font-bold sm:w-auto"
      >
        <MessageSquareText size={17} aria-hidden="true" />
        Message {hostLabel}
      </Button>

      <ChatThread
        conversationId={isThreadOpen ? conversationId : null}
        otherUserId={Number(hostId) || null}
        propertyId={Number(propertyId) || undefined}
        otherPartyName={hostName}
        otherPartyRole={hostLabel}
        propertyName={propertyName}
        onClose={() => setIsThreadOpen(false)}
      />
    </>
  );
}
