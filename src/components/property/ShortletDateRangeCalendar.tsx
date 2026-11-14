"use client";

import { format } from "date-fns";
import type { ReactElement } from "react";
import { Calendar } from "@/components/ui/calendar";
import { toBlockedDates, type UnavailableRange } from "@/lib/availability";

interface ShortletDateRangeCalendarProps {
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  startDate: string;
  unavailable: UnavailableRange[];
}

export default function ShortletDateRangeCalendar({
  endDate,
  onChange,
  startDate,
  unavailable,
}: ShortletDateRangeCalendarProps): ReactElement {
  const blocked = toBlockedDates(unavailable);

  const select = (value: string): void => {
    if (!startDate || endDate || value <= startDate) {
      onChange(value, "");
      return;
    }

    onChange(startDate, value);
  };

  return (
    <Calendar
      disabledDates={blocked}
      minDate={format(new Date(), "yyyy-MM-dd")}
      months={2}
      onSelect={select}
      rangeEnd={endDate}
      rangeStart={startDate}
    />
  );
}
