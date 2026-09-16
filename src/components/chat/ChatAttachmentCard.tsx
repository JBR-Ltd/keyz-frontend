"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, Layers, Video } from "lucide-react";
import type { ChatAttachment, ChatAttachmentType } from "@/lib/chat/chatClient";

interface ChatAttachmentCardProps {
  attachment: ChatAttachment;
}

const LABELS: Record<ChatAttachmentType, string> = {
  PROPERTY: "Listing",
  TOUR: "Tour",
  FLOOR_PLAN: "Floor plan",
};

const ACTIONS: Record<ChatAttachmentType, string> = {
  PROPERTY: "View the listing",
  TOUR: "Open the tour",
  FLOOR_PLAN: "See the floor plan",
};

const ICONS: Record<ChatAttachmentType, ReactElement> = {
  PROPERTY: <Building2 size={12} aria-hidden="true" />,
  TOUR: <Video size={12} aria-hidden="true" />,
  FLOOR_PLAN: <Layers size={12} aria-hidden="true" />,
};

/** The server's line for a share sent with no words, per type. */
const DEFAULT_TEXT_PREFIXES: Record<ChatAttachmentType, string> = {
  PROPERTY: "Shared a listing: ",
  TOUR: "Shared a tour: ",
  FLOOR_PLAN: "Shared a floor plan: ",
};

export function attachmentHref(attachment: ChatAttachment): string {
  switch (attachment.type) {
    case "TOUR":
      return `/property/${attachment.propertyId}#virtual-tour`;
    case "FLOOR_PLAN":
      // The tour viewer reads ?floor= and opens on that floor
      return `/property/${attachment.propertyId}?floor=${attachment.id}#virtual-tour`;
    default:
      return `/property/${attachment.propertyId}`;
  }
}

/**
 * Whether a message body is only the line the server writes for a wordless share.
 *
 * That line exists so the thread list has something to show. Inside the thread
 * the card already says it, so the bubble hides the line rather than repeating it.
 */
export function isDefaultShareText(
  body: string,
  attachment: ChatAttachment,
): boolean {
  return body === `${DEFAULT_TEXT_PREFIXES[attachment.type]}${attachment.title}`;
}

export default function ChatAttachmentCard({
  attachment,
}: ChatAttachmentCardProps): ReactElement {
  return (
    <Link
      href={attachmentHref(attachment)}
      className="block overflow-hidden rounded-xl bg-bg text-left shadow-sm transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {attachment.imageUrl ? (
        <span className="relative block aspect-video bg-surface-soft">
          <Image
            src={attachment.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="240px"
            className="object-cover"
          />
        </span>
      ) : null}
      <span className="block px-3 py-2.5">
        <span className="flex items-center gap-1.5 font-accent text-[10px] font-bold uppercase tracking-[0.16em] text-accent-alt">
          {ICONS[attachment.type]}
          {LABELS[attachment.type]}
        </span>
        <span className="mt-1 block truncate font-body text-sm font-bold text-primary">
          {attachment.title}
        </span>
        {attachment.subtitle ? (
          <span className="block truncate font-body text-xs text-muted">
            {attachment.subtitle}
          </span>
        ) : null}
        <span className="mt-2 block font-body text-xs font-bold text-accent-alt">
          {ACTIONS[attachment.type]}
        </span>
      </span>
    </Link>
  );
}
