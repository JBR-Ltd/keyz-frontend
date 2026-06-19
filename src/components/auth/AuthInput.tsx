"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";

interface AuthInputProps<TFieldValues extends FieldValues> {
  label: string;
  name: Path<TFieldValues>;
  type: string;
  placeholder: string;
  error?: string;
  register: UseFormRegister<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  showToggle?: boolean;
  autoComplete?: string;
}

export default function AuthInput<TFieldValues extends FieldValues>({
  label,
  name,
  type,
  placeholder,
  error,
  register,
  rules,
  showToggle = false,
  autoComplete,
}: AuthInputProps<TFieldValues>) {
  const [showValue, setShowValue] = useState(false);
  const reduceMotion = useReducedMotion();
  const inputType = showToggle && showValue ? "text" : type;
  const inputId = `auth-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <label className="block" htmlFor={inputId}>
      <span className="font-body text-sm font-bold text-primary">{label}</span>
      <span className="relative mt-2 block">
        <input
          id={inputId}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-14 w-full border border-surface bg-[var(--color-bg)] px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-accent/30 ${
            showToggle ? "pr-14" : ""
          }`}
          {...register(name, rules)}
        />

        {showToggle ? (
          <button
            type="button"
            aria-label={showValue ? "Hide password" : "Show password"}
            onClick={() => setShowValue((current) => !current)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-primary transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {showValue ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        ) : null}
      </span>

      <AnimatePresence>
        {error ? (
          <motion.p
            id={errorId}
            className="mt-2 font-body text-sm font-bold text-red-500"
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </label>
  );
}
