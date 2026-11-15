"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Move, RotateCcw, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import {
  clampAvatarCropOffset,
  getAvatarSourceCrop,
  type AvatarCropDimensions,
  type AvatarCropOffset,
} from "@/lib/avatarCrop";
import { useDialogFocus } from "@/lib/useDialogFocus";

const MAX_ZOOM = 3;
const OUTPUT_SIZE = 512;
const ZOOM_STEP = 0.05;

interface AvatarCropDialogProps {
  file: File;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (file: File) => Promise<boolean>;
}

interface DragStart {
  offset: AvatarCropOffset;
  pointerX: number;
  pointerY: number;
}

function outputName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "profile-photo";
  return `${baseName}-avatar.jpg`;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That photo could not be opened."));
    image.src = source;
  });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("That photo could not be prepared."));
      },
      "image/jpeg",
      0.9,
    );
  });
}

async function createCroppedAvatar(
  source: string,
  originalFile: File,
  dimensions: AvatarCropDimensions,
  viewportSize: number,
  zoom: number,
  offset: AvatarCropOffset,
): Promise<File> {
  const image = await loadImage(source);
  const crop = getAvatarSourceCrop(dimensions, viewportSize, zoom, offset);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("That photo could not be prepared.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.size,
    crop.size,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await canvasBlob(canvas);
  return new File([blob], outputName(originalFile.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export default function AvatarCropDialog({
  file,
  isSaving,
  onCancel,
  onSave,
}: AvatarCropDialogProps): ReactElement {
  const reduceMotion = useReducedMotion();
  const dialogRef = useDialogFocus<HTMLDivElement>(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const [previewUrl] = useState(() => URL.createObjectURL(file));
  const [dimensions, setDimensions] = useState<AvatarCropDimensions | null>(
    null,
  );
  const [viewportSize, setViewportSize] = useState(0);
  const [offset, setOffset] = useState<AvatarCropOffset>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBusy = isPreparing || isSaving;

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setViewportSize(entry.contentRect.width);
      }
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !isBusy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onCancel]);

  const clampOffset = (
    nextOffset: AvatarCropOffset,
    nextZoom = zoom,
  ): AvatarCropOffset => {
    if (!dimensions || viewportSize === 0) {
      return nextOffset;
    }

    return clampAvatarCropOffset(
      dimensions,
      viewportSize,
      nextZoom,
      nextOffset,
    );
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (isBusy || !dimensions) {
      return;
    }

    dragStartRef.current = {
      offset,
      pointerX: event.clientX,
      pointerY: event.clientY,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    const dragStart = dragStartRef.current;

    if (!dragStart) {
      return;
    }

    setOffset(
      clampOffset({
        x: dragStart.offset.x + event.clientX - dragStart.pointerX,
        y: dragStart.offset.y + event.clientY - dragStart.pointerY,
      }),
    );
  };

  const stopDragging = (): void => {
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const handleCropKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ): void => {
    const distance = event.shiftKey ? 16 : 5;
    const movement: Record<string, AvatarCropOffset> = {
      ArrowDown: { x: 0, y: distance },
      ArrowLeft: { x: -distance, y: 0 },
      ArrowRight: { x: distance, y: 0 },
      ArrowUp: { x: 0, y: -distance },
    };
    const delta = movement[event.key];

    if (!delta || isBusy) {
      return;
    }

    event.preventDefault();
    setOffset((current) =>
      clampOffset({ x: current.x + delta.x, y: current.y + delta.y }),
    );
  };

  const handleZoom = (value: number): void => {
    const nextZoom = Math.min(MAX_ZOOM, Math.max(1, value));
    setZoom(nextZoom);
    setOffset((current) => clampOffset(current, nextZoom));
  };

  const reset = (): void => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setError(null);
  };

  const save = async (): Promise<void> => {
    if (!dimensions || viewportSize === 0) {
      setError("Wait for the photo to finish loading, then try again.");
      return;
    }

    setError(null);
    setIsPreparing(true);

    try {
      const croppedFile = await createCroppedAvatar(
        previewUrl,
        file,
        dimensions,
        viewportSize,
        zoom,
        offset,
      );
      await onSave(croppedFile);
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "That photo could not be prepared.",
      );
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <OverlayPortal>
      <AnimatePresence>
        <motion.div
          className="modal-backdrop fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-crop-title"
            aria-describedby="avatar-crop-description"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-bg shadow-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="avatar-crop-title"
                  className="font-display text-2xl font-bold text-primary"
                >
                  Position your photo
                </h2>
                <p
                  id="avatar-crop-description"
                  className="mt-1 font-body text-sm leading-6 text-muted"
                >
                  Drag to reposition, then zoom until your photo looks right.
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                aria-label="Close photo editor"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex justify-center">
                <div
                  ref={viewportRef}
                  role="group"
                  tabIndex={0}
                  aria-label="Profile photo crop. Drag the photo or use the arrow keys to reposition it."
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopDragging}
                  onPointerCancel={stopDragging}
                  onKeyDown={handleCropKeyDown}
                  className={`relative aspect-square w-full max-w-80 touch-none overflow-hidden rounded-full bg-surface-soft ring-4 ring-bg shadow-inner outline-none focus-visible:ring-accent ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  <Image
                    src={previewUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="320px"
                    draggable={false}
                    onLoad={(event) => {
                      setDimensions({
                        height: event.currentTarget.naturalHeight,
                        width: event.currentTarget.naturalWidth,
                      });
                    }}
                    onError={() => {
                      setError("That photo could not be opened.");
                    }}
                    className="pointer-events-none select-none object-cover will-change-transform"
                    style={{
                      transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                    }}
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
                  <span className="pointer-events-none absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary/80 px-3 py-1.5 font-body text-xs font-semibold text-white backdrop-blur-sm">
                    <Move size={14} aria-hidden="true" />
                    Move photo
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="avatar-crop-zoom"
                    className="inline-flex items-center gap-2 font-body text-sm font-semibold text-primary"
                  >
                    <ZoomIn size={17} aria-hidden="true" />
                    Zoom
                  </label>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={isBusy}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-body text-sm font-semibold text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    Reset
                  </button>
                </div>
                <input
                  id="avatar-crop-zoom"
                  type="range"
                  min="1"
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={zoom}
                  disabled={isBusy}
                  onChange={(event) => handleZoom(Number(event.target.value))}
                  className="mt-2 min-h-11 w-full cursor-pointer accent-[var(--color-accent)] disabled:cursor-wait"
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-700/25 bg-red-50 px-4 py-3 font-body text-sm text-red-800"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isBusy}
                  className="min-h-12 rounded-full border border-primary/25 px-5 py-3 font-body text-sm font-semibold text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={isBusy || !dimensions}
                  aria-busy={isBusy || undefined}
                  className="min-h-12 rounded-full bg-primary px-5 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
                >
                  <AsyncButtonContent
                    isPending={isBusy}
                    pendingLabel={
                      isPreparing ? "Preparing photo…" : "Saving photo…"
                    }
                  >
                    Save photo
                  </AsyncButtonContent>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </OverlayPortal>
  );
}
