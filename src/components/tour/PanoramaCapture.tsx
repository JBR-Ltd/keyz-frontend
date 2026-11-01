"use client";

import { RotateCcw, Upload, X } from "lucide-react";
import { useCallback, useState, type ReactElement } from "react";
import { useDropzone } from "react-dropzone";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { SIZE_OPTIONS } from "@/lib/tourConstants";
import type { SizeBucket } from "@/lib/types/tour";

interface PanoramaCaptureProps {
  roomName: string;
  /** The size the room currently has. Pre-selects the matching chip. */
  initialSize?: SizeBucket;
  /**
   * URL of the room's current primary panorama, or null when the room has
   * never been captured. When present, the page opens in "already captured"
   * mode: the existing sweep is shown, the size can be changed on its own,
   * and a Continue button leads on to the door editor.
   */
  existingPanorama?: string | null;
  /**
   * Called when the host submits.
   *
   * - file !== null -> the picked file. The wizard saves the size if it
   *   changed, then moves to review.
   * - file === null -> the host pressed Continue without picking a file. The
   *   wizard saves the size if it changed, then moves on to the door editor.
   */
  onSubmit: (file: File | null, sizeBucket: SizeBucket) => void | Promise<void>;
}

export default function PanoramaCapture({
  roomName,
  initialSize = "MEDIUM",
  existingPanorama = null,
  onSubmit,
}: PanoramaCaptureProps): ReactElement {
  const hasExisting = existingPanorama !== null;
  const [sizeBucket, setSizeBucket] = useState<SizeBucket>(initialSize);
  const [isRetaking, setIsRetaking] = useState(!hasExisting);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeChanged = sizeBucket !== initialSize;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const startRetake = (): void => {
    setIsRetaking(true);
    setSelectedFile(null);
    setPreview(null);
  };

  const cancelRetake = (): void => {
    setIsRetaking(false);
    setSelectedFile(null);
    setPreview(null);
  };

  const submitWithFile = async (): Promise<void> => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedFile, sizeBucket);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitWithoutFile = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await onSubmit(null, sizeBucket);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sizeChips = (
   <div data-tour="capture-size" className="mt-6">
  <span className="font-body text-sm font-bold text-primary">
    How big is this room?
  </span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {SIZE_OPTIONS.map((option) => {
          const isSelected = sizeBucket === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSizeBucket(option.value)}
              className={[
                "rounded-xl border-2 p-3 text-center transition-all",
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-bg hover:border-accent/60",
              ].join(" ")}
            >
              <span className="block font-body text-sm font-bold text-primary">
                {option.label}
              </span>
              <span className="mt-0.5 block font-body text-[10px] text-muted">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 font-body text-xs leading-5 text-muted">
        This only affects the floor-plan layout, so an approximate answer
        is fine.
      </p>
    </div>
  );

  const picker = (
    <>
      <label
        {...getRootProps()}
        className={`mt-4 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 ${
          isDragActive
            ? "border-accent bg-accent/5"
            : "border-primary/25 hover:border-accent hover:bg-accent/5"
        }`}
      >
        <input {...getInputProps({ capture: "environment" })} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/image cannot optimize local blob URLs
          <img
            src={preview}
            alt="Selected panorama preview"
            className="max-h-56 w-full max-w-md rounded-lg object-contain"
          />
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-primary">
              <Upload size={24} aria-hidden="true" />
            </span>
            <span className="font-body text-base font-bold text-primary">
              Tap to upload the sweep
            </span>
            <span className="font-body text-sm text-muted">
              JPEG, PNG or HEIC, wide panorama
            </span>
          </>
        )}
      </label>

      <button
  type="button"
  data-tour="capture-submit"
  disabled={!selectedFile || isSubmitting}
  aria-busy={isSubmitting}
  onClick={() => void submitWithFile()}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AsyncButtonContent
          isPending={isSubmitting}
          pendingLabel="Uploading…"
        >
          Use this photo
        </AsyncButtonContent>
      </button>

      {hasExisting ? (
        <button
          type="button"
          onClick={cancelRetake}
          disabled={isSubmitting}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-bg px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X size={14} aria-hidden="true" />
          Keep the current sweep
        </button>
      ) : null}
    </>
  );

  return (
    <section aria-labelledby="tour-panorama-capture">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Capture
      </p>
      <h2
        id="tour-panorama-capture"
        className="mt-2 font-display text-2xl font-bold text-primary"
      >
        Capture the {roomName}
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Stand just inside the doorway, at the wall you walked in through, then
        sweep your phone slowly in a full circle.
      </p>

      {sizeChips}

      {hasExisting && !isRetaking ? (
        <>
          <div className="mt-6 rounded-xl border border-border bg-surface-soft/40 p-4">
            <span className="font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Current sweep
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- the URL points at S3/local, not the Next image optimiser */}
            <img
              src={existingPanorama}
              alt={`Current panorama of the ${roomName}`}
              className="mt-3 max-h-56 w-full rounded-lg object-cover"
            />
            <p className="mt-3 font-body text-xs leading-5 text-muted">
              Change the size above and press Continue, or retake the sweep
              if the photo needs replacing. Doors and staircases are edited
              on the next step.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startRetake}
              disabled={isSubmitting}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-primary/20 bg-bg px-6 py-3 font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Retake panorama
            </button>
           <button
  type="button"
  data-tour="capture-submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
  onClick={() => void submitWithoutFile()}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              <AsyncButtonContent
                isPending={isSubmitting}
                pendingLabel="Saving…"
              >
                {sizeChanged ? "Save size and continue" : "Continue to doors"}
              </AsyncButtonContent>
            </button>
          </div>
        </>
      ) : (
        picker
      )}
    </section>
  );
}
