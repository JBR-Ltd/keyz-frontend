"use client";

import { useState, type ReactElement } from "react";
import {
  Building2,
  ChevronLeft,
  Layers,
  Loader2,
  Share2,
  Video,
  X,
} from "lucide-react";
import { useAuthenticatedUser } from "@/lib/account";
import type { ChatAttachmentType } from "@/lib/chat/chatClient";
import { getPropertyPortfolio } from "@/lib/hostListings";
import { getSavedListings } from "@/lib/savedListings";
import { getPropertyTour, type TourFloorWithRooms } from "@/lib/tour";

interface ChatShareMenuProps {
  /** Resolves true once the share is sent, which closes the menu. */
  onShare: (type: ChatAttachmentType, attachmentId: number) => Promise<boolean>;
  /** The listing this thread is about, when it is about one. */
  propertyId?: number;
}

type MenuView = "root" | "floors" | "listings";

interface ListingChoice {
  id: number;
  title: string;
}

/**
 * Shares a listing, its tour, or a floor plan into the conversation.
 *
 * Offers the thread's own listing first, because that is nearly always what is
 * being talked about. Only verified listings are offered from elsewhere: the server
 * refuses the rest, since the other person has to be able to open what they get.
 */
export default function ChatShareMenu({
  onShare,
  propertyId,
}: ChatShareMenuProps): ReactElement {
  const { user } = useAuthenticatedUser();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<MenuView>("root");
  const [floors, setFloors] = useState<TourFloorWithRooms[] | null>(null);
  const [listings, setListings] = useState<ListingChoice[] | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const isHost = user?.role === "LANDLORD" || user?.role === "AGENT";

  const openListings = async (): Promise<void> => {
    setView("listings");

    if (listings !== null) {
      return;
    }

    if (isHost) {
      const result = await getPropertyPortfolio();

      setListings(
        (result.data?.properties ?? [])
          .filter((property) => property.verified && property.id !== propertyId)
          .map((property) => ({ id: property.id, title: property.title })),
      );
      return;
    }

    const saved = await getSavedListings();

    setListings(
      saved.data
        .filter((property) => property.verified && property.id !== propertyId)
        .map((property) => ({ id: property.id, title: property.title })),
    );
  };

  const openFloors = async (threadPropertyId: number): Promise<void> => {
    setView("floors");

    if (floors === null) {
      setFloors(await getPropertyTour(threadPropertyId));
    }
  };

  const toggle = (): void => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    if (propertyId === undefined) {
      void openListings();
    } else {
      setView("root");
    }
  };

  const share = async (
    key: string,
    type: ChatAttachmentType,
    attachmentId: number,
  ): Promise<void> => {
    setBusyKey(key);
    const sent = await onShare(type, attachmentId);
    setBusyKey(null);

    if (sent) {
      setIsOpen(false);
      setView("root");
    }
  };

  const option = (
    key: string,
    icon: ReactElement,
    label: string,
    detail: string,
    onSelect: () => void,
  ): ReactElement => (
    <button
      key={key}
      type="button"
      onClick={onSelect}
      disabled={busyKey !== null}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-alt">
        {busyKey === key ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          icon
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-body text-sm font-bold text-primary">
          {label}
        </span>
        <span className="block truncate font-body text-xs text-muted">
          {detail}
        </span>
      </span>
    </button>
  );

  const rootOptions = (threadPropertyId: number): ReactElement[] => [
    option(
      "listing",
      <Building2 size={16} aria-hidden="true" />,
      "This listing",
      "The home this chat is about",
      () => void share("listing", "PROPERTY", threadPropertyId),
    ),
    option(
      "tour",
      <Video size={16} aria-hidden="true" />,
      "Its tour",
      "The walkthrough or 3D tour",
      () => void share("tour", "TOUR", threadPropertyId),
    ),
    option(
      "floors",
      <Layers size={16} aria-hidden="true" />,
      "A floor plan",
      "Pick a floor from the tour",
      () => void openFloors(threadPropertyId),
    ),
    option(
      "others",
      <Building2 size={16} aria-hidden="true" />,
      "Another listing",
      isHost ? "One of your verified listings" : "One you have saved",
      () => void openListings(),
    ),
  ];

  const loading = (
    <p className="flex items-center gap-2 px-3 py-4 font-body text-sm text-muted">
      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      Loading...
    </p>
  );

  const empty = (text: string): ReactElement => (
    <p className="px-3 py-4 font-body text-sm leading-6 text-muted">{text}</p>
  );

  const title =
    view === "floors"
      ? "Share a floor plan"
      : view === "listings"
        ? "Share a listing"
        : "Share";

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Share a listing, tour or floor plan"
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Share2 size={17} aria-hidden="true" />
      </button>

      {isOpen ? (
        <span
          role="menu"
          className="absolute bottom-full left-0 z-10 mb-3 block w-72 max-w-[calc(100vw-3rem)] rounded-xl bg-bg p-2 shadow-lg ring-1 ring-border"
        >
          <span className="flex items-center justify-between gap-2 px-2 pb-1 pt-1">
            <span className="flex min-w-0 items-center gap-1">
              {view !== "root" && propertyId !== undefined ? (
                <button
                  type="button"
                  onClick={() => setView("root")}
                  aria-label="Back"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
              ) : null}
              <span className="truncate font-accent text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                {title}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </span>

          <span className="block max-h-72 overflow-y-auto">
            {view === "root" && propertyId !== undefined
              ? rootOptions(propertyId)
              : null}

            {view === "floors"
              ? floors === null
                ? loading
                : floors.length === 0
                  ? empty("This listing has no floor plans in its tour yet.")
                  : floors.map((floor) =>
                      option(
                        `floor-${floor.id}`,
                        <Layers size={16} aria-hidden="true" />,
                        floor.name,
                        floor.rooms.length === 1
                          ? "1 room"
                          : `${floor.rooms.length} rooms`,
                        () =>
                          void share(`floor-${floor.id}`, "FLOOR_PLAN", floor.id),
                      ),
                    )
              : null}

            {view === "listings"
              ? listings === null
                ? loading
                : listings.length === 0
                  ? empty(
                      isHost
                        ? "You have no other verified listings to share."
                        : "Save a verified listing and you can share it here.",
                    )
                  : listings.map((listing) =>
                      option(
                        `listing-${listing.id}`,
                        <Building2 size={16} aria-hidden="true" />,
                        listing.title,
                        "Share this listing",
                        () =>
                          void share(`listing-${listing.id}`, "PROPERTY", listing.id),
                      ),
                    )
              : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}
