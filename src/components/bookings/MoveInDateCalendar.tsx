"use client";

import type { ReactElement } from "react";
import { Calendar } from "@/components/ui/calendar";

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

export default function MoveInDateCalendar({
  maxDate,
  minDate,
  onChange,
  suggestedDate,
  value,
}: MoveInDateCalendarProps): ReactElement {
  return (
    <Calendar
      maxDate={maxDate}
      minDate={minDate}
      onSelect={onChange}
      suggestedDate={suggestedDate}
      value={value}
    />
  );
}
