"use client";

import { SubmitHandler, useForm } from "react-hook-form";

interface FloorSetupFormValues {
  floorNumber: number;
  name: string;
}

interface FloorSetupFormProps {
  onSubmit: (values: FloorSetupFormValues) => void;
}

const INPUT_CLASS_NAME =
  "mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function FloorSetupForm({ onSubmit }: FloorSetupFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<FloorSetupFormValues>({
    defaultValues: { floorNumber: 1, name: "Ground Floor" },
  });

  return (
    <section aria-labelledby="tour-floor-setup">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
        Floor Plan
      </p>
      <h2 id="tour-floor-setup" className="mt-2 font-display text-2xl font-bold text-primary">
        Start a new floor
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-muted">
        Every room you capture next will belong to this floor.
      </p>

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit((values) => onSubmit(values))}>
        <label>
          <span className="font-body text-sm font-bold text-primary">Floor Name</span>
          <input
            className={INPUT_CLASS_NAME}
            {...register("name", { required: "Floor name is required" })}
          />
          {errors.name ? (
            <span className="mt-2 block font-body text-sm font-medium text-red-700">
              {errors.name.message}
            </span>
          ) : null}
        </label>

        <label>
          <span className="font-body text-sm font-bold text-primary">Floor Number</span>
          <input
            type="number"
            className={INPUT_CLASS_NAME}
            {...register("floorNumber", { required: true, valueAsNumber: true })}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      </form>
    </section>
  );
}