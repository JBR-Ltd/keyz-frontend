"use client";

import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface PanoramaCaptureProps {
  roomName: string;
  onFileConfirmed: (file: File) => void;
}

export default function PanoramaCapture({ roomName, onFileConfirmed }: PanoramaCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  return (
    <section aria-labelledby="tour-panorama-capture">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Room Capture
      </p>
      <h2 id="tour-panorama-capture" className="mt-2 font-display text-2xl font-bold text-primary">
        Capture the {roomName}
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Stand near the center of the room and sweep using your phone&apos;s panorama mode.
      </p>

      <label
        {...getRootProps()}
        className={`mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-8 text-center transition-all duration-200 ${
          isDragActive ? "border-accent bg-surface-soft" : "border-primary/25 hover:border-accent hover:bg-surface-soft"
        }`}
      >
        <input {...getInputProps({ capture: "environment" })} />

        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/image cannot optimize local blob URLs
          <img src={preview} alt="Selected panorama preview" className="max-h-52 w-full object-contain" />
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-primary">
              <Upload size={22} aria-hidden="true" />
            </span>
            <span className="font-body text-sm font-bold text-primary">
              Tap to take a photo or drop one here
            </span>
            <span className="font-body text-xs text-muted">JPEG or PNG, wide panorama sweep</span>
          </>
        )}
      </label>

      <button
        type="button"
        disabled={!selectedFile}
        onClick={() => selectedFile && onFileConfirmed(selectedFile)}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Use This Photo
      </button>
    </section>
  );
}