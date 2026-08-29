"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import CaptureInstructions from "@/components/tour/CaptureInstructions";
import CaptureProgress from "@/components/tour/CaptureProgress";
import CaptureReview from "@/components/tour/CaptureReview";
import FloorPlanReview from "@/components/tour/FloorPlanReview";
import FloorSetupForm from "@/components/tour/FloorSetupForm";
import PanoramaCapture from "@/components/tour/PanoramaCapture";
import PublishConfirmation from "@/components/tour/PublishConfirmation";
import RoomDetailsForm from "@/components/tour/RoomDetailsForm";
import RoomDirectionPicker from "@/components/tour/RoomDirectionPicker";
import { connectRooms, createFloor, createRoom } from "@/lib/api/tours";
import type { Direction, Floor, Panorama, Room } from "@/lib/types/tour";

interface TourWizardProps {
  propertyId: number;
  role: "landlord" | "agent";
}

type WizardStep =
  | "floor-setup"
  | "instructions"
  | "room-details"
  | "capture"
  | "review"
  | "direction"
  | "progress"
  | "floor-plan-review"
  | "publish";

export default function TourWizard({ propertyId, role }: TourWizardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>("floor-setup");
  const [floor, setFloor] = useState<Floor | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("rello_token");

    if (!storedToken) {
      router.replace("/login?message=Please log in to continue");
      return;
    }

    setToken(storedToken);
  }, [router]);

  if (!token) {
    return null;
  }

  const handleFloorCreated = async (values: { floorNumber: number; name: string }): Promise<void> => {
    try {
      const created = await createFloor(propertyId, values, token);
      setFloor(created);
      setStep("instructions");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create floor";
      notify({ title: "Error", description: message, variant: "error" });
    }
  };

  const handleRoomCreated = async (values: { roomName: string; roomType: string }): Promise<void> => {
    if (!floor) return;

    try {
      const created = await createRoom(floor.id, values, token);
      setCurrentRoom(created);
      setStep("capture");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create room";
      notify({ title: "Error", description: message, variant: "error" });
    }
  };

  const handleFileConfirmed = (file: File): void => {
    setCurrentFile(file);
    setStep("review");
  };

  const handlePanoramaAccepted = (_panorama: Panorama): void => {
    if (!currentRoom) return;

    const isFirstRoom = rooms.length === 0;
    setRooms((previous) => [...previous, currentRoom]);
    setStep(isFirstRoom ? "progress" : "direction");
  };

  const handleDirectionSelected = async (direction: Direction): Promise<void> => {
    const previousRoom = rooms[rooms.length - 1];
    if (!previousRoom || !currentRoom) return;

    try {
      await connectRooms(
        { fromRoomId: previousRoom.id, toRoomId: currentRoom.id, direction },
        token,
      );
      setStep("progress");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not connect rooms";
      notify({ title: "Error", description: message, variant: "error" });
    }
  };

  const handleAddAnotherRoom = (): void => {
    setCurrentRoom(null);
    setCurrentFile(null);
    setStep("room-details");
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 pb-0 pt-12 sm:px-8 lg:px-10 lg:pt-16 xl:px-14">
      <div className="mx-auto max-w-2xl">
        <header className="pb-8">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Virtual Tour
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-primary">
            Capture this property
          </h1>
        </header>

        <div className="rounded-xl border border-border bg-bg p-5 shadow-sm sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {step === "floor-setup" ? <FloorSetupForm onSubmit={handleFloorCreated} /> : null}

              {step === "instructions" ? (
                <CaptureInstructions onContinue={() => setStep("room-details")} />
              ) : null}

              {step === "room-details" ? <RoomDetailsForm onSubmit={handleRoomCreated} /> : null}

              {step === "capture" && currentRoom ? (
                <PanoramaCapture roomName={currentRoom.roomName} onFileConfirmed={handleFileConfirmed} />
              ) : null}

              {step === "review" && currentRoom && currentFile ? (
                <CaptureReview
                  roomId={currentRoom.id}
                  roomName={currentRoom.roomName}
                  file={currentFile}
                  token={token}
                  onAccepted={handlePanoramaAccepted}
                  onRetake={() => setStep("capture")}
                />
              ) : null}

              {step === "direction" && currentRoom && rooms.length > 0 ? (
                <RoomDirectionPicker
                  fromRoomName={rooms[rooms.length - 1].roomName}
                  toRoomName={currentRoom.roomName}
                  onSelect={handleDirectionSelected}
                />
              ) : null}

              {step === "progress" ? (
                <CaptureProgress
                  rooms={rooms}
                  onAddAnotherRoom={handleAddAnotherRoom}
                  onFinish={() => setStep("floor-plan-review")}
                />
              ) : null}

              {step === "floor-plan-review" && floor ? (
                <FloorPlanReview floor={floor} rooms={rooms} onPublish={() => setStep("publish")} />
              ) : null}

              {step === "publish" ? <PublishConfirmation propertyId={propertyId} role={role} /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}