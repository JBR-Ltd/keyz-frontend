"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactElement } from "react";
import { toBlockedDates, type UnavailableRange } from "@/lib/availability";

interface ShortletDateRangeCalendarProps {
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  startDate: string;
  unavailable: UnavailableRange[];
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function Month({
  month,
  blocked,
  endDate,
  onSelect,
  startDate,
}: {
  month: Date;
  blocked: Set<string>;
  endDate: string;
  onSelect: (date: Date) => void;
  startDate: string;
}): ReactElement {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const offset = startOfMonth(month).getDay();
  const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const end = endDate ? new Date(`${endDate}T00:00:00`) : null;

  return (
    <section aria-label={format(month, "MMMM yyyy")}>
      <h3 className="text-center font-body text-sm font-bold text-primary">
        {format(month, "MMMM yyyy")}
      </h3>
      <div className="mt-4 grid grid-cols-7 text-center font-body text-[11px] font-bold text-muted">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`space-${index}`} />
        ))}
        {days.map((day) => {
          const key = iso(day);
          const disabled =
            isBefore(day, startOfDay(new Date())) || blocked.has(key);
          const selected = Boolean(
            (start && isSameDay(day, start)) || (end && isSameDay(day, end)),
          );
          const inRange = Boolean(start && end && day > start && day < end);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              aria-pressed={selected}
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full font-body text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? "bg-primary font-bold text-white" : inRange ? "bg-accent/15 text-primary" : "text-primary hover:bg-primary/5"} disabled:cursor-not-allowed disabled:text-muted/35 disabled:line-through`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ShortletDateRangeCalendar({
  endDate,
  onChange,
  startDate,
  unavailable,
}: ShortletDateRangeCalendarProps): ReactElement {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const blocked = useMemo(() => toBlockedDates(unavailable), [unavailable]);

  const select = (date: Date): void => {
    const value = iso(date);
    if (!startDate || endDate || value <= startDate) {
      onChange(value, "");
      return;
    }
    onChange(startDate, value);
  };

  return (
    <div className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((value) => addMonths(value, -1))}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft size={19} />
        </button>
        <p className="font-body text-xs text-muted">
          Select check-in, then check-out
        </p>
        <button
          type="button"
          onClick={() => setMonth((value) => addMonths(value, 1))}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronRight size={19} />
        </button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Month
          month={month}
          blocked={blocked}
          startDate={startDate}
          endDate={endDate}
          onSelect={select}
        />
        <div className="hidden sm:block">
          <Month
            month={addMonths(month, 1)}
            blocked={blocked}
            startDate={startDate}
            endDate={endDate}
            onSelect={select}
          />
        </div>
      </div>
    </div>
  );
}
