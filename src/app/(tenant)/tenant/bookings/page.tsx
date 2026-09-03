"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import ChatThread from "@/components/chat/ChatThread";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { utilityCardVariants } from "@/components/ui/utility-card";
import {
  TENANT_ACTIVITIES,
  TENANT_ACTIVITY_TYPE_TONES,
  TENANT_STATS,
  TENANT_STATUS_TONES,
  TENANT_TIMELINE_ACTIVITIES,
} from "@/lib/tenantActivity";
import {
  ChatPartyRole,
  ConversationSummary,
  getAllConversations,
  getConversationId,
  getCurrentChatUser,
  subscribeToChatStorage,
} from "@/lib/chat/chatStorage";

interface ActiveChatThread {
  conversationId: string;
  otherPartyName: string;
  otherPartyRole: ChatPartyRole;
  propertyName: string;
}

export default function TenantBookingsPage(): ReactElement {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeThread, setActiveThread] = useState<ActiveChatThread | null>(
    null,
  );
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const currentUser = getCurrentChatUser();

  useEffect(() => {
    let active = true;

    function loadConversations(): void {
      void getAllConversations().then((result) => {
        if (!active) {
          return;
        }

        setConversations(result.data);
        setStorageUnavailable(result.unavailable);
      });
    }

    loadConversations();

    const unsubscribe = subscribeToChatStorage(loadConversations);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Your rental desk
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Bookings
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          Track your rentals, property requests, and booking status from one
          scannable workspace.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TENANT_STATS.map(
          ({ label, value, trend, direction, icon: Icon, tone, tile }) => {
            const TrendIcon =
              direction === "up" ? ArrowUpRight : ArrowDownRight;

            return (
              <article
                key={label}
                className={utilityCardVariants({ tone, interactive: true })}
              >
                <IconTile tone={tile}>
                  <Icon size={22} />
                </IconTile>
                <p className="mt-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  {label}
                </p>
                <p className="mt-4 break-words font-display text-3xl font-bold leading-none text-primary">
                  {typeof value === "number" ? (
                    <PropertyPrice value={value} />
                  ) : (
                    value
                  )}
                </p>
                <p
                  className={`mt-4 flex items-center gap-2 font-body text-xs font-bold ${direction === "up" ? "text-primary" : "text-muted"}`}
                >
                  <TrendIcon size={15} />
                  {trend}
                </p>
              </article>
            );
          },
        )}
      </section>

      <section className="mt-10 min-w-0 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Tenant activity
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary">
            Active Rentals & Offers
          </h2>
        </div>

        {storageUnavailable ? (
          <p className="border-b border-border px-5 py-3 font-body text-xs text-primary sm:px-6">
            Local message storage is unavailable in this browser session.
          </p>
        ) : null}

        <div>
          {TENANT_ACTIVITIES.map((activity) => {
            const conversationId = getConversationId(activity.propertyId, [
              currentUser.id,
              activity.host.id,
            ]);
            const conversation = conversations.find(
              (summary) => summary.conversationId === conversationId,
            );
            const hasUnread = Boolean(conversation?.unreadCount);

            return (
              <article
                key={`${activity.activityType}-${activity.title}`}
                className="grid gap-4 border-b border-border p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md sm:grid-cols-[8rem_1fr] sm:items-center sm:p-6"
              >
                <div className="relative h-28 overflow-hidden rounded-lg bg-surface-soft sm:w-full">
                  <Image
                    src={activity.image}
                    alt={activity.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover transition-all duration-200 ease-in-out"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          tone={
                            TENANT_ACTIVITY_TYPE_TONES[activity.activityType]
                          }
                        >
                          {activity.activityType}
                        </StatusBadge>
                        <h3 className="font-body text-lg font-bold text-primary">
                          {activity.title}
                        </h3>
                      </div>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                        <MapPin
                          size={15}
                          className="shrink-0 text-primary/60"
                        />
                        {activity.location}
                      </p>
                    </div>
                    <StatusBadge tone={TENANT_STATUS_TONES[activity.status]}>
                      {activity.status}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-body text-sm text-muted">
                      <Clock3 size={15} className="shrink-0 text-primary/60" />
                      <span>
                        {activity.activityType === "Rental"
                          ? activity.dates
                          : "Offer submitted"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveThread({
                            conversationId,
                            otherPartyName: activity.host.name,
                            otherPartyRole: activity.host.role,
                            propertyName: activity.title,
                          })
                        }
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label={`Message ${activity.host.name}`}
                      >
                        <MessageCircle size={18} aria-hidden="true" />
                        {hasUnread ? (
                          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                        ) : null}
                      </button>
                      <p className="font-display text-2xl font-bold text-primary">
                        <PropertyPrice
                          value={
                            activity.activityType === "Rental"
                              ? (activity.price ?? "")
                              : (activity.offerAmount ?? "")
                          }
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm">
        <div className="border-b border-primary/20 bg-surface-soft px-5 py-5 sm:px-6">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Timeline
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary">
            Recent Activity
          </h2>
        </div>
        <div className="grid md:grid-cols-3">
          {TENANT_TIMELINE_ACTIVITIES.map(
            ({ title, description, time, icon: Icon, tone }) => (
              <article
                key={title}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border p-5 transition-all duration-200 ease-in-out last:border-b-0 hover:bg-surface-soft hover:shadow-md md:border-b-0 md:border-r md:last:border-r-0 sm:p-6"
              >
                <IconTile tone={tone} size="lg" shape="circle">
                  <Icon size={20} />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="font-body text-sm font-bold text-primary">
                    {title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">
                    {description}
                  </p>
                  <p className="mt-3 font-body text-xs font-medium uppercase tracking-[0.12em] text-primary">
                    {time}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <ChatThread
        conversationId={activeThread?.conversationId ?? null}
        otherPartyName={activeThread?.otherPartyName ?? ""}
        otherPartyRole={activeThread?.otherPartyRole ?? "Agent"}
        propertyName={activeThread?.propertyName ?? ""}
        onClose={() => setActiveThread(null)}
      />
    </main>
  );
}
