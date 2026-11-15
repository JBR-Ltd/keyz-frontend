"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Copy,
  Mail,
  MessageCircle,
  Share2,
  X as CloseIcon,
} from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import ResilientPropertyImage from "@/components/property/ResilientPropertyImage";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { useToast } from "@/components/ui/toast";
import {
  getNativeShareData,
  getShareChannelUrls,
  type ShareContent,
} from "@/lib/share";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface ShareDialogProps {
  content: ShareContent;
  onClose: () => void;
  open: boolean;
}

interface ShareActionLinkProps {
  href: string;
  icon: ReactElement;
  label: string;
  onSelect: () => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function displayUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

function ShareActionLink({
  href,
  icon,
  label,
  onSelect,
}: ShareActionLinkProps): ReactElement {
  const isEmail = href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={isEmail ? undefined : "_blank"}
      rel={isEmail ? undefined : "noopener noreferrer"}
      onClick={onSelect}
      className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-bg px-2 py-3 text-center font-body text-xs font-bold text-primary transition-colors hover:border-primary/30 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-primary">
        {icon}
      </span>
      {label}
    </a>
  );
}

export default function ShareDialog({
  content,
  onClose,
  open,
}: ShareDialogProps): ReactElement | null {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  const [isWorking, setIsWorking] = useState(false);
  const canUseNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !isWorking) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWorking, onClose, open]);

  if (!open) {
    return null;
  }

  const channels = getShareChannelUrls(content);
  const secondaryLabel =
    content.kind === "property"
      ? `${content.location} · ${content.price}`
      : content.kind === "host"
        ? content.role
        : "Virtual tour";

  const copyLink = async (): Promise<void> => {
    setIsWorking(true);

    try {
      await navigator.clipboard.writeText(content.url);
      onClose();
      notify({ title: "Link copied", variant: "success" });
    } catch {
      notify({
        title: "Link could not be copied",
        description: "Copy the address from your browser and try again.",
        variant: "error",
      });
    } finally {
      setIsWorking(false);
    }
  };

  const shareMore = async (): Promise<void> => {
    if (!navigator.share) {
      return;
    }

    setIsWorking(true);

    try {
      await navigator.share(getNativeShareData(content));
      onClose();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      notify({
        title: "This could not be shared",
        description: "Choose another sharing option or copy the link.",
        variant: "error",
      });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <OverlayPortal>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        aria-describedby="share-dialog-description"
        className="modal-backdrop fixed inset-0 z-[140] flex items-end justify-center sm:items-center sm:p-6"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !isWorking) {
            onClose();
          }
        }}
      >
        <motion.div
          ref={dialogRef}
          className="max-h-[calc(100dvh-0.75rem)] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-bg px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl sm:p-6"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <span
            className="mx-auto mb-2 block h-1 w-10 rounded-full bg-border sm:hidden"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="share-dialog-title"
                className="font-display text-2xl font-bold text-primary"
              >
                Share with someone
              </h2>
              <p
                id="share-dialog-description"
                className="mt-1 font-body text-sm leading-6 text-muted"
              >
                Send this public Rello page using the option that suits you.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isWorking}
              aria-label="Close share options"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
            >
              <CloseIcon size={19} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-2xl bg-surface-soft p-3">
            <span
              className={`relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden bg-primary text-white ${
                content.kind === "host" ? "w-20 rounded-full" : "rounded-xl"
              }`}
            >
              {content.kind === "host" && !content.imageUrl ? (
                <span className="font-display text-xl font-bold">
                  {initials(content.title)}
                </span>
              ) : (
                <ResilientPropertyImage
                  src={content.imageUrl}
                  alt={content.title}
                  fill
                  compactPlaceholder
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-body text-sm font-bold leading-5 text-primary">
                {content.title}
              </p>
              <p className="mt-1 line-clamp-2 font-body text-xs leading-5 text-muted">
                {secondaryLabel}
              </p>
              <p className="mt-1 truncate font-body text-[11px] text-muted">
                {displayUrl(content.url)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
            <button
              type="button"
              onClick={() => void copyLink()}
              disabled={isWorking}
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-bg px-2 py-3 text-center font-body text-xs font-bold text-primary transition-colors hover:border-primary/30 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-primary">
                <Copy size={18} aria-hidden="true" />
              </span>
              Copy link
            </button>
            <ShareActionLink
              href={channels.whatsapp}
              label="WhatsApp"
              icon={<MessageCircle size={18} aria-hidden="true" />}
              onSelect={onClose}
            />
            <ShareActionLink
              href={channels.x}
              label="X"
              icon={
                <span
                  className="icon-[line-md--twitter-x] text-lg"
                  aria-hidden="true"
                />
              }
              onSelect={onClose}
            />
            <ShareActionLink
              href={channels.facebook}
              label="Facebook"
              icon={
                <span
                  className="icon-[line-md--facebook] text-lg"
                  aria-hidden="true"
                />
              }
              onSelect={onClose}
            />
            <ShareActionLink
              href={channels.email}
              label="Email"
              icon={<Mail size={18} aria-hidden="true" />}
              onSelect={onClose}
            />
          </div>

          {canUseNativeShare ? (
            <button
              type="button"
              onClick={() => void shareMore()}
              disabled={isWorking}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
            >
              <Share2 size={17} aria-hidden="true" />
              More options
            </button>
          ) : null}
        </motion.div>
      </motion.div>
    </OverlayPortal>
  );
}
