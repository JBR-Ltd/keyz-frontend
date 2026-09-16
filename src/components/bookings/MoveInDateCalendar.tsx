"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactElement } from "react";
import { parseDay, toIsoDay } from "@/lib/bookingPayments";

interface MoveInDateCalendarProps {
  /** Latest selectable day, as yyyy-MM-dd. */
  maxDate: string;
  /** Earliest selectable day, as yyyy-MM-dd. */
  minDate: string;
  onChange: (value: string) => void;
  /** The day the tenant asked for, ringed so the host can see it. */
  suggestedDate?: string | null;
  value: string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function MoveInDateCalendar({
  maxDate,
  minDate,
  onChange,
  suggestedDate,
  value,
}: MoveInDateCalendarProps): ReactElement {
  const [month, setMonth] = useState(() =>
    startOfMonth(new Date(parseDay(value || suggestedDate || minDate))),
  );
  const earliest = new Date(parseDay(minDate));
  const latest = new Date(parseDay(maxDate));
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const offset = startOfMonth(month).getDay();

  return (
    <div className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, -1))}
          disabled={!isAfter(startOfMonth(month), earliest)}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={19} />
        </button>
        <p
          className="font-body text-sm font-bold text-primary"
          aria-live="polite"
        >
          {format(month, "MMMM yyyy")}
        </p>
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          disabled={!isBefore(endOfMonth(month), latest)}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={19} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center font-body text-[11px] font-bold text-muted">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-1">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`space-${index}`} />
        ))}
        {days.map((day) => {
          const key = toIsoDay(day);
          const disabled = isBefore(day, earliest) || isAfter(day, latest);
          const selected = key === value;
          const suggested = key === suggestedDate;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              aria-pressed={selected}
              aria-label={`${format(day, "EEEE d MMMM yyyy")}${suggested ? ", the day the tenant asked for" : ""}`}
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full font-body text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? "bg-primary font-bold text-white" : suggested ? "text-primary ring-2 ring-accent" : "text-primary hover:bg-primary/5"} disabled:cursor-not-allowed disabled:text-muted/35`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {suggestedDate ? (
        <p className="mt-3 flex items-center gap-2 font-body text-xs text-muted">
          <span
            className="inline-block h-3 w-3 rounded-full ring-2 ring-accent"
            aria-hidden="true"
          />
          The day the tenant asked for
        </p>
      ) : null}
    </div>
  );
}
