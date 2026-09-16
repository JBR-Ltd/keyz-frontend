"use client";

import type { ReactElement } from "react";
import RentalRequestDialog from "@/components/property/RentalRequestDialog";
import ShortletBookingDialog from "@/components/property/ShortletBookingDialog";
import type { RentalMode } from "@/lib/hostListings";

interface BookingRequestDialogProps {
  hostName: string;
  hostRole: string;
  minimumNights?: number | null;
  maximumGuests?: number | null;
  onClose: () => void;
  open: boolean;
  price: number;
  propertyId: string;
  /** Read the calendar by, when the listing has one, rather than the sequential id. */
  propertyPublicId?: string;
  propertyTitle: string;
  rentalMode: RentalMode;
}

export default function BookingRequestDialog(
  props: BookingRequestDialogProps,
): ReactElement | null {
  if (!props.open) {
    return null;
  }

  return props.rentalMode === "SHORT_STAY" ? (
    <ShortletBookingDialog {...props} />
  ) : (
    <RentalRequestDialog {...props} />
  );
}
