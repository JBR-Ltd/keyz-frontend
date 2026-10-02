"use client";

import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { uploadPanorama } from "@/lib/api/tours/panoramas";
import type { Panorama } from "@/lib/types/tour";

interface CaptureReviewProps {
  roomId: number;
  roomName: string;
  file: File;
  onAccepted: (panorama: Panorama) => void;
  onRetake: () => void;
}

type ReviewState =
  | { status: "uploading" }
  | { status: "accepted"; panorama: Panorama }
  | { status: "rejected"; message: string };

export default function CaptureReview({
  roomId,
  roomName,
  file,
  onAccepted,
  onRetake,
}: CaptureReviewProps): ReactElement {
  const [state, setState] = useState<ReviewState>({ status: "uploading" });
  // Tracks the file we have already started uploading. If the parent
  // re-renders with the same file, we do not fire a second upload — that
  // bug was hitting the 2-per-room cap and getting retakes stuck.
  const uploadedFile = useRef<File | null>(null);
  // Monotonic token. Only the latest upload's callbacks are allowed to
  // write state, so a slow earlier upload cannot clobber a newer one.
  //
  // This replaces the old `cancelled` boolean. React 18 StrictMode's
  // simulated unmount sets a `cancelled` flag on the first mount run;
  // the remount then early-returns on the `uploadedFile` guard, so the
  // original request's result is thrown away and the spinner spins
  // forever even though the backend saved the panorama successfully.
  const uploadSequence = useRef(0);

  useEffect(() => {
    if (uploadedFile.current === file) return;
    uploadedFile.current = file;

    const sequence = ++uploadSequence.current;

    uploadPanorama(roomId, file)
      .then((panorama) => {
        if (uploadSequence.current !== sequence) return;
        setState({ status: "accepted", panorama });
      })
      .catch((error: unknown) => {
        if (uploadSequence.current !== sequence) return;
        const message =
          error instanceof Error ? error.message : "Panorama rejected";
        setState({ status: "rejected", message });
      });
  }, [roomId, file]);

  return (
    <section aria-labelledby="tour-capture-review">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Reviewing the sweep
      </p>
      <h2
        id="tour-capture-review"
        className="mt-2 font-display text-2xl font-bold text-primary"
      >
        {roomName}
      </h2>

      {state.status === "uploading" ? (
        <div className="mt-6 rounded-lg border border-border bg-surface-soft/40 p-6">
          <div className="flex items-center gap-3">
            <Loader2
              className="h-5 w-5 animate-spin text-accent-alt"
              aria-hidden="true"
            />
            <p className="font-body text-sm font-bold text-primary">
              Validating lighting, sharpness, and framing…
            </p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full w-2/3 animate-pulse bg-accent" />
          </div>
          <p className="mt-3 font-body text-xs text-muted">
            This usually takes a few seconds.
          </p>
        </div>
      ) : null}

      {state.status === "rejected" ? (
        <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <XCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-body text-sm font-bold text-red-700">
                The photo wasn&apos;t accepted
              </p>
              <p className="mt-1 font-body text-sm leading-6 text-red-700/85">
                {state.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetake}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-red-500/40 bg-bg px-5 font-body text-sm font-bold text-red-700 transition-colors hover:bg-red-500/10"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Retake photo
          </button>
        </div>
      ) : null}

      {state.status === "accepted" ? (
        <div className="mt-6 rounded-lg border border-accent/40 bg-accent/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-accent-alt"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-body text-sm font-bold text-primary">
                Photo accepted for the {roomName}
              </p>
              <p className="mt-1 font-body text-sm text-muted">
                Next up: pin the doors and openings you can see from here.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAccepted(state.panorama)}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Pin the doors
          </button>
        </div>
      ) : null}
    </section>
  );
}
