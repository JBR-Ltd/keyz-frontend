"use client";

import { format, parseISO } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useState, type ReactElement } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// === Types

export interface DatePickerProps {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  maxDate?: string;
  minDate?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export interface DateRangePickerProps {
  ariaLabel: string;
  className?: string;
  endDate: string;
  maxDate?: string;
  minDate?: string;
  onChange: (startDate: string, endDate: string) => void;
  startDate: string;
}

// === Helpers

function displayDate(value: string): string {
  return format(parseISO(value), "d MMM yyyy");
}

// === Components

export function DatePicker({
  ariaLabel,
  className,
  disabled,
  id,
  maxDate,
  minDate,
  onChange,
  placeholder = "Choose a date",
  value,
}: DatePickerProps): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-primary/15 bg-bg px-4 font-body text-sm font-normal text-primary outline-none transition",
            "hover:border-primary/30 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60",
            !value && "text-muted",
            className,
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <CalendarDays
              size={17}
              className="shrink-0 text-accent-alt"
              aria-hidden="true"
            />
            <span className="truncate">
              {value ? displayDate(value) : placeholder}
            </span>
          </span>
          <ChevronDown
            size={17}
            className="shrink-0 text-muted"
            aria-hidden="true"
          />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-[170] w-[min(22rem,calc(100vw-2rem))] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:data-[state=open]:animate-none"
        >
          <Calendar
            maxDate={maxDate}
            minDate={minDate}
            value={value}
            onSelect={(nextValue) => {
              onChange(nextValue);
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function DateRangePicker({
  ariaLabel,
  className,
  endDate,
  maxDate,
  minDate,
  onChange,
  startDate,
}: DateRangePickerProps): ReactElement {
  const [open, setOpen] = useState(false);
  const label = startDate
    ? `${displayDate(startDate)}${endDate ? ` to ${displayDate(endDate)}` : " to select"}`
    : "Choose a date range";

  const select = (value: string): void => {
    if (!startDate || endDate || value <= startDate) {
      onChange(value, "");
      return;
    }

    onChange(startDate, value);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-primary/15 bg-bg px-4 font-body text-sm font-normal text-primary outline-none transition",
            "hover:border-primary/30 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10",
            !startDate && "text-muted",
            className,
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <CalendarDays
              size={17}
              className="shrink-0 text-accent-alt"
              aria-hidden="true"
            />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown
            size={17}
            className="shrink-0 text-muted"
            aria-hidden="true"
          />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-[170] w-[min(42rem,calc(100vw-2rem))] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:data-[state=open]:animate-none"
        >
          <Calendar
            maxDate={maxDate}
            minDate={minDate}
            months={2}
            onSelect={select}
            rangeEnd={endDate}
            rangeStart={startDate}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
