"use client";

import type { ReactElement } from "react";
import RentalRequestDialog from "@/components/property/RentalRequestDialog";
import ShortletBookingDialog from "@/components/property/ShortletBookingDialog";
import type { Booking } from "@/lib/bookings";
import type { RentalMode } from "@/lib/hostListings";

interface BookingRequestDialogProps {
  hostName: string;
  hostRole: string;
  minimumNights?: number | null;
  maximumGuests?: number | null;
  onClose: () => void;
  onRentalRequestRejected: () => void;
  onRentalRequestSubmitted: (booking: Booking) => void;
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

  const { onRentalRequestRejected, onRentalRequestSubmitted, ...dialogProps } =
    props;

  return dialogProps.rentalMode === "SHORT_STAY" ? (
    <ShortletBookingDialog {...dialogProps} />
  ) : (
    <RentalRequestDialog
      {...dialogProps}
      onRejected={onRentalRequestRejected}
      onSubmitted={onRentalRequestSubmitted}
    />
  );
}
