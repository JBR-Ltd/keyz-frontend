// src/components/tour/TourWizard.tsx
//
// The landlord/agent capture wizard.
//
//   floor-setup → instructions → room-details → capture → review → door-link
//     → progress → floor-plan → overview → publish
//
// The server owns room status. When a panorama is accepted, the backend sets
// the room READY. The wizard never calls PATCH /status.
//
// The OVERVIEW step is the tour's home. Every floor, every room, one place.
// A host lands there after confirming any floor plan, and can return to it
// from FloorSetupForm ("Review tour") or the room board ("Manage floors").
// From there they open a floor, jump into a specific room, open a floor
// plan, add another floor, or publish.
//
// Back buttons stay inside the wizard. The browser's own back button would
// leave the whole capture flow.

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import CaptureInstructions from "@/components/tour/CaptureInstructions";
import CaptureProgress from "@/components/tour/CaptureProgress";
import CaptureReview from "@/components/tour/CaptureReview";
import DoorLinking from "@/components/tour/DoorLinking";
import FloorPlanViewer from "@/components/tour/FloorPlanViewer";
import FloorSetupForm from "@/components/tour/FloorSetupForm";
import PanoramaCapture from "@/components/tour/PanoramaCapture";
import PublishConfirmation from "@/components/tour/PublishConfirmation";
import RoomDetailsForm from "@/components/tour/RoomDetailsForm";
import TourOverview from "@/components/tour/TourOverview";

import {
  createRoom,
  createLinkedRoom,
  getRoomsForFloor,
  updateRoom,
} from "@/lib/api/tours/rooms";
import { getFloor, getFloorsForProperty } from "@/lib/api/tours/floors";
import {
  createDoor,
  deleteDoor,
  getDoorsForRoom,
  updateDoor,
} from "@/lib/api/tours/doors";
import {
  createStaircase,
  deleteStaircase,
  getStaircasesForFloor,
  getStaircasesForRoom,
  updateStaircase,
} from "@/lib/api/tours/staircases";
import {
  getTourPreview,
  getTourSummary,
  publishTour,
} from "@/lib/api/tours/publish";
import type { CreateAndLinkInput } from "@/components/tour/RoomDoorEditor";
import type {
  CreateDoorRequest,
  CreateStaircaseRequest,
  Door,
  Floor,
  PublicTour,
  Room,
  SizeBucket,
  Staircase,
  TourSummary,
  UpdateDoorRequest,
  WallSide,
} from "@/lib/types/tour";
import type { DoorPinPosition } from "@/components/tour/DoorPin";

interface TourWizardProps {
  propertyId: number;
  role: "landlord" | "agent";
}

type WizardStep =
  | "loading"
  | "floor-setup"
  | "instructions"
  | "room-details"
  | "capture"
  | "review"
  | "door-link"
  | "progress"
  | "floor-plan"
  | "overview"
  | "publish";

const WALL_TO_YAW: Record<WallSide, number> = {
  TOP: 0,
  RIGHT: 90,
  BOTTOM: 180,
  LEFT: 270,
};

const PHASE_LABEL: Record<WizardStep, string> = {
  loading: "Loading",
  "floor-setup": "Floors",
  instructions: "Getting started",
  "room-details": "Rooms",
  capture: "Rooms",
  review: "Rooms",
  "door-link": "Doors",
  progress: "Rooms",
  "floor-plan": "Floor plan",
  overview: "Tour overview",
  publish: "Published",
};

export default function TourWizard({ propertyId, role }: TourWizardProps) {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<WizardStep>("loading");
  const [floor, setFloor] = useState<Floor | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentDoors, setCurrentDoors] = useState<Door[]>([]);
  const [currentStaircases, setCurrentStaircases] = useState<Staircase[]>([]);
  const [floorStaircases, setFloorStaircases] = useState<Staircase[]>([]);
  const [tourSummary, setTourSummary] = useState<TourSummary | null>(null);
  const [overviewTour, setOverviewTour] = useState<PublicTour | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const bootstrapped = useRef(false);

  const refreshRooms = useCallback(async (floorId: number): Promise<Room[]> => {
    const next = await getRoomsForFloor(floorId);
    setRooms(next);
    return next;
  }, []);

  const refreshDoors = useCallback(async (roomId: number): Promise<Door[]> => {
    const next = await getDoorsForRoom(roomId);
    setCurrentDoors(next);
    return next;
  }, []);

  const refreshStaircases = useCallback(
    async (roomId: number): Promise<Staircase[]> => {
      const next = await getStaircasesForRoom(roomId);
      setCurrentStaircases(next);
      return next;
    },
    [],
  );

  const refreshSummary = useCallback(async (): Promise<TourSummary | null> => {
    try {
      const summary = await getTourSummary(propertyId);
      setTourSummary(summary);
      return summary;
    } catch {
      return null;
    }
  }, [propertyId]);

  // === Bootstrap ===

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const initialFloor = searchParams.get("floor");
        const initialRoom = searchParams.get("room");
        const initialAction = searchParams.get("action");

        const floors = await getFloorsForProperty(propertyId);
        if (cancelled) return;

        if (floors.length === 0) {
          setStep("floor-setup");
          return;
        }

        const targetFloor =
          initialFloor && floors.some((f) => f.id === Number(initialFloor))
            ? floors.find((f) => f.id === Number(initialFloor))!
            : floors[0];

        setFloor(targetFloor);
        const targetRooms = await refreshRooms(targetFloor.id);
        if (cancelled) return;

        if (initialRoom) {
          const room = targetRooms.find((r) => r.id === Number(initialRoom));
          if (room) {
            setCurrentRoom(room);
            await Promise.all([
              refreshDoors(room.id),
              refreshStaircases(room.id),
            ]);
            if (cancelled) return;
            setStep("capture");
            return;
          }
        }

        if (initialAction === "add-room") {
          setStep("room-details");
          return;
        }

        if (initialAction === "floor-plan") {
          setStep("floor-plan");
          void refreshSummary();
          return;
        }

        if (initialAction === "overview") {
          setStep("overview");
          void refreshSummary();
          return;
        }

        setStep("progress");
        void refreshSummary();
      } catch (error) {
        if (cancelled) return;
        notify({
          title: "Could not load this tour",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
        setStep("floor-setup");
      }
    })();

    return () => {
      cancelled = true;
      bootstrapped.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  // === Floor staircases for the plan ===

  useEffect(() => {
    if (step !== "floor-plan" || !floor) return;
    let cancelled = false;
    void getStaircasesForFloor(floor.id)
      .then((list) => {
        if (!cancelled) setFloorStaircases(list);
      })
      .catch(() => {
        if (!cancelled) setFloorStaircases([]);
      });
    return () => {
      cancelled = true;
    };
  }, [step, floor]);

  // === Overview bundle ===

  useEffect(() => {
    if (step !== "overview") return;
    let cancelled = false;
    void (async () => {
      try {
        const next = await getTourPreview(propertyId);
        if (!cancelled) setOverviewTour(next);
      } catch {
        if (!cancelled) setOverviewTour(null);
      }
    })();
    void refreshSummary();
    return () => {
      cancelled = true;
    };
  }, [step, propertyId, refreshSummary]);

  // === URL sync ===

  useEffect(() => {
    if (!bootstrapped.current) return;
    if (step === "loading") return;

    const params = new URLSearchParams();
    if (floor) params.set("floor", String(floor.id));
    if (
      currentRoom &&
      (step === "capture" || step === "review" || step === "door-link")
    ) {
      params.set("room", String(currentRoom.id));
    }
    if (step === "room-details") params.set("action", "add-room");
    if (step === "floor-plan") params.set("action", "floor-plan");
    if (step === "overview") params.set("action", "overview");
    if (step === "publish") params.set("action", "publish");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [step, floor, currentRoom, pathname, router]);

  // === Back navigation ===

  const backTarget: { step: WizardStep; label: string } | null = (() => {
    switch (step) {
      case "instructions":
        return { step: "floor-setup", label: "Back to floors" };
      case "room-details":
        return rooms.length > 0
          ? { step: "progress", label: "Back to rooms" }
          : { step: "instructions", label: "Back to instructions" };
      case "capture":
        return { step: "progress", label: "Back to rooms" };
      case "review":
        return { step: "capture", label: "Back to capture" };
      case "door-link":
        return { step: "progress", label: "Back to rooms" };
      case "floor-plan":
        return { step: "progress", label: "Back to rooms" };
      case "overview":
        return { step: "floor-setup", label: "Back to floors" };
      default:
        return null;
    }
  })();

  const handleBack = (): void => {
    if (!backTarget) return;
    if (backTarget.step === "progress" && floor) void refreshRooms(floor.id);
    setStep(backTarget.step);
  };

  // === Step handlers ===

  const handleFloorContinue = (created: Floor): void => {
    setFloor(created);
    setRooms([]);
    setCurrentRoom(null);
    setStep("instructions");
  };

  const handleRoomDetailsSubmitted = async (values: {
    roomName: string;
    roomType: string;
  }): Promise<void> => {
    if (!floor) return;
    try {
      const created = await createRoom(floor.id, {
        roomName: values.roomName,
        roomType: values.roomType,
      });
      setCurrentRoom(created);
      await refreshRooms(floor.id);
      setStep("capture");
    } catch (error) {
      notify({
        title: "Could not create room",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  };

  const handleCaptureSubmit = async (
    file: File | null,
    sizeBucket: SizeBucket,
  ): Promise<void> => {
    if (!currentRoom || !floor) return;

    if (currentRoom.sizeBucket !== sizeBucket) {
      try {
        const updated = await updateRoom(currentRoom.id, { sizeBucket });
        setCurrentRoom(updated);
        await refreshRooms(floor.id);
      } catch (error) {
        notify({
          title: "Could not save the room size",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
        return;
      }
    }

    if (file !== null) {
      setCurrentFile(file);
      setStep("review");
    } else {
      await refreshDoors(currentRoom.id);
      await refreshStaircases(currentRoom.id);
      setStep("door-link");
    }
  };

  const handlePanoramaAccepted = async (): Promise<void> => {
    if (!currentRoom || !floor) return;
    const updated = await refreshRooms(floor.id);
    const fresh = updated.find((r) => r.id === currentRoom.id) ?? currentRoom;
    setCurrentRoom(fresh);
    setCurrentFile(null);
    await Promise.all([
      refreshDoors(fresh.id),
      refreshStaircases(fresh.id),
    ]);
    setStep("door-link");
  };

  const handleDoorLinkContinue = async (): Promise<void> => {
    if (!floor) return;
    await refreshRooms(floor.id);
    setStep("progress");
  };

  const handleAddAnotherRoom = (): void => {
    setCurrentRoom(null);
    setCurrentFile(null);
    setCurrentDoors([]);
    setCurrentStaircases([]);
    setStep("room-details");
  };

  const handleReviewFloorPlan = async (): Promise<void> => {
    if (!floor) return;
    setStep("floor-plan");
    void refreshSummary();
  };

  const handleFloorPlanConfirmed = async (): Promise<void> => {
    await refreshSummary();
    setStep("overview");
  };

  /**
   * From the 3D floor-plan viewer: open a room. Goes back to the room's
   * capture page, where the host can retake the sweep, adjust the size, or
   * edit the doors and staircases.
   */
  const handleOpenRoomFromFloorPlan = useCallback(
    async (roomId: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      setCurrentRoom(room);
      setCurrentFile(null);
      await Promise.all([
        refreshDoors(roomId),
        refreshStaircases(roomId),
      ]);
      setStep("capture");
    },
    [rooms, refreshDoors, refreshStaircases],
  );

  const handleOpenRoomFromProgress = useCallback(
    (room: Room) => {
      setCurrentRoom(room);
      setCurrentFile(null);
      void Promise.all([
        refreshDoors(room.id),
        refreshStaircases(room.id),
      ]);
      setStep("capture");
    },
    [refreshDoors, refreshStaircases],
  );

  const handleCaptureLinkedRoom = useCallback(
    (roomId: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      setCurrentRoom(room);
      setCurrentFile(null);
      void Promise.all([
        refreshDoors(roomId),
        refreshStaircases(roomId),
      ]);
      setStep("capture");
    },
    [rooms, refreshDoors, refreshStaircases],
  );

  // === Overview handlers ===

  const handleOverviewOpenFloor = useCallback(
    async (floorId: number) => {
      try {
        const targetFloor = await getFloor(floorId);
        setFloor(targetFloor);
        setCurrentRoom(null);
        await refreshRooms(targetFloor.id);
        setStep("progress");
      } catch (error) {
        notify({
          title: "Could not open that floor",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      }
    },
    [notify, refreshRooms],
  );

  const handleOverviewOpenRoom = useCallback(
    async (floorId: number, roomId: number) => {
      try {
        const targetFloor = await getFloor(floorId);
        setFloor(targetFloor);
        const list = await refreshRooms(targetFloor.id);
        const room = list.find((r) => r.id === roomId);
        if (!room) {
          notify({ title: "That room could not be found", variant: "error" });
          return;
        }
        setCurrentRoom(room);
        setCurrentFile(null);
        await Promise.all([
          refreshDoors(roomId),
          refreshStaircases(roomId),
        ]);
        setStep("capture");
      } catch (error) {
        notify({
          title: "Could not open that room",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      }
    },
    [notify, refreshRooms, refreshDoors, refreshStaircases],
  );

  const handleOverviewOpenFloorPlan = useCallback(
    async (floorId: number) => {
      try {
        const targetFloor = await getFloor(floorId);
        setFloor(targetFloor);
        await refreshRooms(targetFloor.id);
        setStep("floor-plan");
        void refreshSummary();
      } catch (error) {
        notify({
          title: "Could not open that floor plan",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      }
    },
    [notify, refreshRooms, refreshSummary],
  );

  const handleOverviewAddFloor = (): void => {
    setFloor(null);
    setRooms([]);
    setCurrentRoom(null);
    setStep("floor-setup");
  };

  // === Door operations ===

  const handleCreateDoor = async (
    input: Omit<CreateDoorRequest, "roomId" | "createReciprocal">,
  ): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await createDoor({
        ...input,
        roomId: currentRoom.id,
        createReciprocal: true,
      });
      await refreshDoors(currentRoom.id);
      return true;
    } catch (error) {
      notify({
        title: "Could not save the door",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      return false;
    }
  };

  const handleMoveSavedDoor = async (
    doorId: number,
    position: DoorPinPosition,
  ): Promise<void> => {
    if (!currentRoom) return;
    try {
      await updateDoor(doorId, {
        wallSide: position.wallSide,
        alongWallPercent: position.alongWallPercent,
      });
      await refreshDoors(currentRoom.id);
    } catch (error) {
      notify({
        title: "Could not move the door",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  };

  const handleUpdateSavedDoor = async (
    doorId: number,
    patch: UpdateDoorRequest,
  ): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await updateDoor(doorId, patch);
      await refreshDoors(currentRoom.id);
      return true;
    } catch (error) {
      notify({
        title: "Could not update the door",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      return false;
    }
  };

  const handleDeleteDoor = async (doorId: number): Promise<void> => {
    if (!currentRoom) return;
    try {
      await deleteDoor(doorId);
      await refreshDoors(currentRoom.id);
    } catch (error) {
      notify({
        title: "Could not delete the door",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  };

  const handleCreateAndLinkNewRoom = async (
    input: CreateAndLinkInput,
  ): Promise<Room | null> => {
    if (!currentRoom || !floor) {
      notify({
        title: "Could not create the linked room",
        description: "Missing the current room or floor.",
        variant: "error",
      });
      return null;
    }

    try {
      const created = await createLinkedRoom(currentRoom.id, {
        roomName: input.roomName,
        roomType: input.roomType,
        sizeBucket: "MEDIUM",
        wallSide: input.doorContext.wallSide,
        alongWallPercent: input.doorContext.alongWallPercent,
        kind: input.doorContext.kind,
      });

      await refreshRooms(floor.id);
      await refreshDoors(currentRoom.id);

      notify({
        title: `${created.roomName} added to the board`,
        description:
          "Capture it whenever you're ready — its door here already points at it.",
        variant: "success",
      });
      return created;
    } catch (error) {
      notify({
        title: "Could not create the next room",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      return null;
    }
  };

  // === Staircase operations ===

  const handleCreateStaircase = async (
    input: Omit<CreateStaircaseRequest, "hostRoomId">,
  ): Promise<boolean> => {
    if (!currentRoom || !floor) return false;
    try {
      await createStaircase(floor.id, {
        ...input,
        hostRoomId: currentRoom.id,
      });
      await refreshStaircases(currentRoom.id);
      notify({
        title: `${input.name ?? "Staircase"} saved`,
        variant: "success",
      });
      return true;
    } catch (error) {
      notify({
        title: "Could not save the staircase",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      return false;
    }
  };

  const handleUpdateStaircase = async (
    staircaseId: number,
    input: Omit<CreateStaircaseRequest, "hostRoomId">,
  ): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await updateStaircase(staircaseId, input);
      await refreshStaircases(currentRoom.id);
      notify({
        title: `${input.name ?? "Staircase"} updated`,
        variant: "success",
      });
      return true;
    } catch (error) {
      notify({
        title: "Could not update the staircase",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      return false;
    }
  };

  const handleDeleteStaircase = async (
    staircaseId: number,
  ): Promise<void> => {
    if (!currentRoom) return;
    try {
      await deleteStaircase(staircaseId);
      await refreshStaircases(currentRoom.id);
      notify({ title: "Staircase removed", variant: "success" });
    } catch (error) {
      notify({
        title: "Could not remove the staircase",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  };

  // === Publish ===

  const handlePublish = async (): Promise<void> => {
    setIsPublishing(true);
    try {
      await publishTour(propertyId);
      await refreshSummary();
      setStep("publish");
    } catch (error) {
      notify({
        title: "This tour isn't ready to publish yet",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // === Render ===

  const previewHref = `/${role}/listings/${propertyId}/tour/preview`;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 pb-0 pt-12 sm:px-8 lg:px-10 lg:pt-16 xl:px-14">
      <div className="mx-auto max-w-2xl">
        <header className="pb-8">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Virtual tour · {PHASE_LABEL[step]}
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-primary">
            Build your virtual tour
          </h1>
        </header>

        {backTarget ? (
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-1.5 font-body text-sm font-medium text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft size={15} aria-hidden="true" />
            {backTarget.label}
          </button>
        ) : null}

        <div className="rounded-xl border border-border bg-bg p-5 shadow-sm sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {step === "loading" ? (
                <div
                  role="status"
                  aria-label="Loading your tour"
                  className="space-y-5"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-full" />
                  <span className="sr-only">Loading your tour</span>
                </div>
              ) : null}

              {step === "floor-setup" ? (
                <FloorSetupForm
                  propertyId={propertyId}
                  onContinue={handleFloorContinue}
                  onReviewTour={() => setStep("overview")}
                />
              ) : null}

              {step === "instructions" ? (
                <CaptureInstructions
                  onContinue={() => setStep("room-details")}
                />
              ) : null}

              {step === "room-details" ? (
                <RoomDetailsForm onSubmit={handleRoomDetailsSubmitted} />
              ) : null}

              {step === "capture" && currentRoom ? (
                <PanoramaCapture
                  roomName={currentRoom.roomName}
                  initialSize={currentRoom.sizeBucket ?? "MEDIUM"}
                  existingPanorama={currentRoom.panorama}
                  onSubmit={(file, size) =>
                    void handleCaptureSubmit(file, size)
                  }
                />
              ) : null}

              {step === "review" && currentRoom && currentFile ? (
                <CaptureReview
                  roomId={currentRoom.id}
                  roomName={currentRoom.roomName}
                  file={currentFile}
                  onAccepted={() => void handlePanoramaAccepted()}
                  onRetake={() => setStep("capture")}
                />
              ) : null}

              {step === "door-link" && currentRoom ? (
                <DoorLinking
                  room={currentRoom}
                  allRooms={rooms}
                  savedDoors={currentDoors}
                  staircases={currentStaircases}
                  onCreateDoor={handleCreateDoor}
                  onMoveSavedDoor={handleMoveSavedDoor}
                  onUpdateSavedDoor={handleUpdateSavedDoor}
                  onDeleteDoor={handleDeleteDoor}
                  onCreateAndLinkNewRoom={handleCreateAndLinkNewRoom}
                  onCaptureLinkedRoom={handleCaptureLinkedRoom}
                  onCreateStaircase={handleCreateStaircase}
                  onUpdateStaircase={handleUpdateStaircase}
                  onDeleteStaircase={handleDeleteStaircase}
                  onContinue={() => void handleDoorLinkContinue()}
                />
              ) : null}

              {step === "progress" ? (
                <CaptureProgress
                  rooms={rooms}
                  onAddAnotherRoom={handleAddAnotherRoom}
                  onReviewFloorPlan={() => void handleReviewFloorPlan()}
                  onRoomClick={handleOpenRoomFromProgress}
                  canPublish={tourSummary?.isPublishable ?? false}
                  isPublishing={isPublishing}
                  onPublish={() => void handlePublish()}
                />
              ) : null}

              {step === "floor-plan" && floor ? (
                <section>
                  <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                    Floor plan
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-primary">
                    Review the schematic
                  </h2>
                  <p className="mt-2 font-body text-sm leading-6 text-muted">
                    The layout is drawn from the rooms, doors and staircases
                    you captured. Regenerate it if it looks off, then confirm
                    to save it. Confirming takes you back to the tour overview
                    where you can add another floor or publish.
                  </p>
                  <div className="mt-6">
                    <FloorPlanViewer
                      floorId={floor.id}
                      floorName={floor.name}
                      rooms={rooms}
                      staircases={floorStaircases}
                      previewHref={previewHref}
                      onBackToFloors={() => setStep("floor-setup")}
                      onRoomClick={(roomId) =>
                        void handleOpenRoomFromFloorPlan(roomId)
                      }
                      onConfirm={() => void handleFloorPlanConfirmed()}
                    />
                  </div>
                </section>
              ) : null}

              {step === "overview" ? (
                overviewTour ? (
                  <TourOverview
                    tour={overviewTour}
                    summary={tourSummary}
                    previewHref={previewHref}
                    isPublishing={isPublishing}
                    onAddAnotherFloor={handleOverviewAddFloor}
                    onOpenFloor={(floorId) =>
                      void handleOverviewOpenFloor(floorId)
                    }
                    onOpenRoom={(floorId, roomId) =>
                      void handleOverviewOpenRoom(floorId, roomId)
                    }
                    onOpenFloorPlan={(floorId) =>
                      void handleOverviewOpenFloorPlan(floorId)
                    }
                    onPublish={() => void handlePublish()}
                  />
                ) : (
                  <div className="space-y-5">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-12 w-full rounded-full" />
                  </div>
                )
              ) : null}

              {step === "publish" ? (
                <PublishConfirmation propertyId={propertyId} role={role} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
