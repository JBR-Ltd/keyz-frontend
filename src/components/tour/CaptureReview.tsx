"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { uploadPanorama } from "@/lib/api/tours";
import type { Panorama } from "@/lib/types/tour";

interface CaptureReviewProps {
  roomId: number;
  roomName: string;
  file: File;
  token: string;
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
  token,
  onAccepted,
  onRetake,
}: CaptureReviewProps) {
  const [state, setState] = useState<ReviewState>({ status: "uploading" });

  useEffect(() => {
    let cancelled = false;

    uploadPanorama(roomId, file, token)
      .then((panorama) => {
        if (!cancelled) setState({ status: "accepted", panorama });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Panorama rejected";
        if (!cancelled) setState({ status: "rejected", message });
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, file, token]);

  return (
    <section aria-labelledby="tour-capture-review">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Capture Review
      </p>
      <h2 id="tour-capture-review" className="mt-2 font-display text-2xl font-bold text-primary">
        Checking the {roomName} photo
      </h2>

      {state.status === "uploading" ? (
        <p className="mt-6 flex items-center gap-2 font-body text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Validating lighting, sharpness, and framing...
        </p>
      ) : null}

      {state.status === "rejected" ? (
        <div className="mt-6 rounded-lg border border-red-500/40 px-4 py-3">
          <p className="font-body text-sm font-bold text-red-700">{state.message}</p>
          <button
            type="button"
            onClick={onRetake}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-5 py-2 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Retake Photo
          </button>
        </div>
      ) : null}

      {state.status === "accepted" ? (
        <div className="mt-6 rounded-lg border border-accent/40 px-4 py-3">
          <p className="font-body text-sm font-bold text-primary">
            Photo accepted for the {roomName}.
          </p>
          <button
            type="button"
            onClick={() => onAccepted(state.panorama)}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-5 py-2 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Continue
          </button>
        </div>
      ) : null}
    </section>
  );
}