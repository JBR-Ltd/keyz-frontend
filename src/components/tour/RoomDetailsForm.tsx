"use client";

import { SubmitHandler, useForm } from "react-hook-form";

interface RoomDetailsFormValues {
  roomName: string;
  roomType: string;
}

interface RoomDetailsFormProps {
  onSubmit: (values: RoomDetailsFormValues) => void;
}

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Hallway", "Other"];

const INPUT_CLASS_NAME =
  "mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function RoomDetailsForm({ onSubmit }: RoomDetailsFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RoomDetailsFormValues>({
    defaultValues: { roomName: "", roomType: ROOM_TYPES[0] },
  });

  return (
    <section aria-labelledby="tour-room-details">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Room Details
      </p>
      <h2 id="tour-room-details" className="mt-2 font-display text-2xl font-bold text-primary">
        Name this room
      </h2>

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit((values) => onSubmit(values))}>
        <label>
          <span className="font-body text-sm font-bold text-primary">Room Name</span>
          <input
            placeholder="Master Bedroom"
            className={INPUT_CLASS_NAME}
            {...register("roomName", { required: "Room name is required" })}
          />
          {errors.roomName ? (
            <span className="mt-2 block font-body text-sm font-medium text-red-700">
              {errors.roomName.message}
            </span>
          ) : null}
        </label>

        <label>
          <span className="font-body text-sm font-bold text-primary">Room Type</span>
          <select className={INPUT_CLASS_NAME} {...register("roomType", { required: true })}>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue to Capture
        </button>
      </form>
    </section>
  );
}