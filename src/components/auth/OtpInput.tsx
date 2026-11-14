"use client";

import { ClipboardEvent, KeyboardEvent, useRef } from "react";

interface OtpInputProps {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

const OTP_LENGTH = 6;

export default function OtpInput({
  error,
  id,
  label,
  onChange,
  value,
}: OtpInputProps) {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const digits = Array.from(
    { length: OTP_LENGTH },
    (_, index) => value[index] ?? "",
  );
  const errorId = `${id}-error`;

  function updateDigit(index: number, digit: string): void {
    const next = [...digits];
    next[index] = digit.replace(/\D/g, "").slice(-1);
    onChange(next.join(""));

    if (next[index] && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ): void {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    const next = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!next) return;
    event.preventDefault();
    onChange(next);
    inputRefs.current[Math.min(next.length, OTP_LENGTH) - 1]?.focus();
  }

  return (
    <fieldset>
      <legend className="font-body text-sm font-bold text-primary">
        {label}
      </legend>
      <div className="mt-2 grid grid-cols-6 gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              if (element) inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`${label} digit ${index + 1}`}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
            maxLength={1}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className="aspect-square min-h-12 w-full rounded-xl border border-surface bg-[var(--color-bg)] text-center font-body text-xl font-bold text-[var(--color-text)] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent/30 sm:min-h-14"
          />
        ))}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 font-body text-sm font-bold text-red-600"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
