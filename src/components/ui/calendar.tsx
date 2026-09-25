"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";

// === Types

export interface CalendarProps {
  disabledDates?: ReadonlySet<string>;
  maxDate?: string;
  minDate?: string;
  months?: 1 | 2;
  onSelect: (value: string) => void;
  rangeEnd?: string;
  rangeStart?: string;
  suggestedDate?: string | null;
  value?: string;
}

interface CalendarMonthProps extends CalendarProps {
  month: Date;
  onFocusDate: (date: Date) => void;
}

// === Constants

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// === Helpers

function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function fromIsoDate(value?: string | null): Date | null {
  if (!value) return null;

  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startingMonth(
  value?: string,
  rangeStart?: string,
  minDate?: string,
): Date {
  return startOfMonth(
    fromIsoDate(value) ??
      fromIsoDate(rangeStart) ??
      fromIsoDate(minDate) ??
      new Date(),
  );
}

function CalendarMonth({
  disabledDates,
  maxDate,
  minDate,
  month,
  onFocusDate,
  onSelect,
  rangeEnd,
  rangeStart,
  suggestedDate,
  value,
}: CalendarMonthProps): ReactElement {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const offset = startOfMonth(month).getDay();
  const earliest = fromIsoDate(minDate);
  const latest = fromIsoDate(maxDate);
  const selectedDate = fromIsoDate(value);
  const start = fromIsoDate(rangeStart);
  const end = fromIsoDate(rangeEnd);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    day: Date,
  ): void => {
    const offsets: Record<string, number> = {
      ArrowDown: 7,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
    };
    const offsetDays = offsets[event.key];

    if (offsetDays === undefined) return;

    event.preventDefault();
    onFocusDate(addDays(day, offsetDays));
  };

  return (
    <section aria-label={format(month, "MMMM yyyy")}>
      <h3 className="text-center font-body text-sm font-bold text-primary">
        {format(month, "MMMM yyyy")}
      </h3>
      <div className="mt-4 grid grid-cols-7 text-center font-body text-[11px] font-bold text-muted">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} aria-hidden="true">
            {day}
          </span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`space-${index}`} aria-hidden="true" />
        ))}
        {days.map((day) => {
          const key = toIsoDate(day);
          const disabled = Boolean(
            (earliest && isBefore(day, earliest)) ||
            (latest && isAfter(day, latest)) ||
            disabledDates?.has(key),
          );
          const selected = Boolean(
            (selectedDate && isSameDay(day, selectedDate)) ||
            (start && isSameDay(day, start)) ||
            (end && isSameDay(day, end)),
          );
          const inRange = Boolean(
            start && end && isAfter(day, start) && isBefore(day, end),
          );
          const suggested = key === suggestedDate;
          const today = isSameDay(day, new Date());

          return (
            <button
              key={key}
              type="button"
              data-calendar-day={key}
              disabled={disabled}
              onClick={() => onSelect(key)}
              onKeyDown={(event) => handleKeyDown(event, day)}
              aria-label={`${format(day, "EEEE d MMMM yyyy")}${suggested ? ", suggested date" : ""}`}
              aria-pressed={selected}
              className={cn(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-full font-body text-sm text-primary transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:text-muted/35 disabled:line-through",
                selected && "bg-primary font-bold text-white",
                !selected && inRange && "rounded-none bg-accent/15",
                !selected && !inRange && "hover:bg-primary/5",
                !selected && suggested && "ring-2 ring-accent",
                !selected && today && "font-bold text-accent-alt",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// === Component

export function Calendar({
  disabledDates,
  maxDate,
  minDate,
  months = 1,
  onSelect,
  rangeEnd,
  rangeStart,
  suggestedDate,
  value,
}: CalendarProps): ReactElement {
  const [month, setMonth] = useState(() =>
    startingMonth(value, rangeStart, minDate),
  );
  const calendarRef = useRef<HTMLDivElement>(null);
  const earliestMonth = useMemo(
    () => (minDate ? startOfMonth(parseISO(minDate)) : null),
    [minDate],
  );
  const latestMonth = useMemo(
    () => (maxDate ? startOfMonth(parseISO(maxDate)) : null),
    [maxDate],
  );

  const focusDate = (date: Date): void => {
    if (earliestMonth && isBefore(date, earliestMonth)) return;
    if (latestMonth && isAfter(date, endOfMonth(latestMonth))) return;

    if (
      isBefore(date, month) ||
      isAfter(date, endOfMonth(addMonths(month, months - 1)))
    ) {
      setMonth(startOfMonth(date));
    }

    window.requestAnimationFrame(() => {
      calendarRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-calendar-day="${toIsoDate(date)}"]`,
        )
        ?.focus();
    });
  };

  const previousDisabled = Boolean(
    earliestMonth && !isAfter(month, earliestMonth),
  );
  const nextDisabled = Boolean(
    latestMonth && isAfter(startOfMonth(addMonths(month, months)), latestMonth),
  );

  return (
    <div
      ref={calendarRef}
      className="rounded-2xl border border-border bg-bg p-4 shadow-xl sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, -1))}
          disabled={previousDisabled}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
        <p className="font-body text-xs text-muted" aria-live="polite">
          Choose a date
        </p>
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          disabled={nextDisabled}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>
      <div className={cn("grid gap-8", months === 2 && "sm:grid-cols-2")}>
        {Array.from({ length: months }, (_, index) => (
          <div key={index} className={cn(index === 1 && "hidden sm:block")}>
            <CalendarMonth
              disabledDates={disabledDates}
              maxDate={maxDate}
              minDate={minDate}
              month={addMonths(month, index)}
              onFocusDate={focusDate}
              onSelect={onSelect}
              rangeEnd={rangeEnd}
              rangeStart={rangeStart}
              suggestedDate={suggestedDate}
              value={value}
            />
          </div>
        ))}
      </div>
      {suggestedDate ? (
        <p className="mt-4 flex items-center gap-2 font-body text-xs text-muted">
          <span
            className="inline-block h-3 w-3 rounded-full ring-2 ring-accent"
            aria-hidden="true"
          />
          Suggested date
        </p>
      ) : null}
    </div>
  );
}
