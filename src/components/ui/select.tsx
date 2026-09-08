"use client";

import type { ReactElement } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// === Types

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface SelectProps {
  /** Rendered greyed out when nothing is chosen. Selecting it is not possible. */
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  /** Hidden native input name, so plain form posts still carry the value. */
  name?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  value?: string;
}

// === Component

/**
 * Replaces the browser's native dropdown with an anchored panel we control, so the
 * menu matches the rest of the interface on every platform. Radix supplies keyboard
 * navigation, typeahead, focus management and the hidden input for form posts.
 */
export function Select({
  ariaLabel,
  className,
  contentClassName,
  defaultValue,
  disabled,
  id,
  invalid,
  name,
  onValueChange,
  options,
  placeholder = "Select an option",
  required,
  value,
}: SelectProps): ReactElement {
  return (
    <SelectPrimitive.Root
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      onValueChange={onValueChange}
      required={required}
      value={value}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex w-full items-center justify-between gap-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out data-[placeholder]:text-muted disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className="shrink-0 text-primary/60 transition-transform duration-200 ease-in-out"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "z-[120] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl bg-[var(--color-bg)] p-1.5 shadow-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
            contentClassName,
          )}
        >
          <SelectPrimitive.Viewport className="p-0">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex min-h-11 cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2.5 font-body text-sm text-primary outline-none transition-all duration-150 ease-in-out data-[highlighted]:bg-primary/5 data-[state=checked]:font-bold data-[disabled]:cursor-not-allowed data-[disabled]:text-muted data-[disabled]:opacity-60"
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator asChild>
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-accent-alt"
                  />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/** Convenience for the common case of a plain string list. */
export function toSelectOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({ label: value, value }));
}
