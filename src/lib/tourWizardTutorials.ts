// src/lib/tourWizardTutorials.ts
//
// Spotlight scripts for each wizard step, keyed by the current step id
// ("floor-setup", "capture", ...). Each script is short — 1 to 3 stops —
// and targets a `data-tour` attribute stamped on a child component. The
// tutorials never reference CSS classes or DOM structure, so refactoring
// the markup does not break them.
//
// Placement hints the tooltip so it does not cover the target on small
// screens. "bottom" means the tooltip sits below the spotlight.

import type { ProductTourStep } from "@/components/tour/ProductTour";

export const WIZARD_STEP_TUTORIALS: Record<string, ProductTourStep[]> = {
  "floor-setup": [
    {
      target: '[data-tour="floor-add-form"]',
      title: "Add the first floor",
      body: "Give it a name like Ground Floor and a number. Every room you capture next will live on the floor you pick here.",
      placement: "bottom",
    },
    {
      target: '[data-tour="floor-continue"]',
      title: "Pick a floor and continue",
      body: "Select one from the list above, then press Continue. You can add more floors any time.",
      placement: "top",
    },
  ],

  instructions: [
    {
      target: '[data-tour="instructions-continue"]',
      title: "Read these before you start",
      body: "Four quick tips on where to stand, how to sweep, and how to handle light. When you're ready, press Start capturing.",
      placement: "top",
    },
  ],

  "room-details": [
    {
      target: '[data-tour="room-name"]',
      title: "Name this room",
      body: "Use a clear name like Master Bedroom or Kitchen. This is what renters see on the room board.",
      placement: "bottom",
    },
    {
      target: '[data-tour="room-submit"]',
      title: "Then continue to capture",
      body: "Pick the type, then continue to upload the room's 360° sweep.",
      placement: "top",
    },
  ],

  capture: [
    {
      target: '[data-tour="capture-size"]',
      title: "How big is this room?",
      body: "An estimate is fine. This only affects the floor-plan drawing, not what renters see.",
      placement: "bottom",
    },
    {
      target: '[data-tour="capture-submit"]',
      title: "Upload your sweep",
      body: "Tap the dashed area to pick the panorama from your phone, then press Use this photo. We validate it before you continue.",
      placement: "top",
    },
  ],

  review: [
    {
      target: '[data-tour="review-section"]',
      title: "We're checking your sweep",
      body: "Lighting, sharpness and framing are validated automatically. If something looks off, we'll tell you and you can retake it.",
      placement: "bottom",
    },
  ],

  "door-link": [
    {
      target: '[data-tour="door-add"]',
      title: "Pin every opening",
      body: "Tap + Add another door for each doorway. Drag the pin along the wall, then say where it leads — another room, outside, or a staircase.",
      placement: "top",
    },
    {
      target: '[data-tour="door-staircases"]',
      title: "Add a staircase if there is one",
      body: "If this room has a staircase to another floor, add it here so the tour knows how the levels connect.",
      placement: "top",
    },
    {
      target: '[data-tour="door-continue"]',
      title: "Continue when you're done",
      body: "Every door should have a linked destination. Press Continue to return to the room board.",
      placement: "top",
    },
  ],

  progress: [
    {
      target: '[data-tour="progress-grid"]',
      title: "Your room board",
      body: "Tap any room to reopen it — retake its sweep, change its size, or edit its doors. Rooms turn green once their panorama is accepted.",
      placement: "bottom",
    },
    {
      target: '[data-tour="progress-add"]',
      title: "Capture another room",
      body: "Keep adding rooms until every space on this floor is captured.",
      placement: "top",
    },
    {
      target: '[data-tour="progress-floor-plan"]',
      title: "Then review the floor plan",
      body: "Once at least one room is ready, generate a schematic of the floor. You can nudge rooms around before confirming.",
      placement: "top",
    },
  ],

  "floor-plan": [
    {
      target: '[data-tour="plan-tabs"]',
      title: "Blueprint or Walkthrough",
      body: "The Blueprint is the flat drawing. The Walkthrough is an interactive 3D view you can step inside.",
      placement: "bottom",
    },
    {
      target: '[data-tour="plan-actions"]',
      title: "Regenerate or confirm",
      body: "Regenerate redraws the layout from scratch. Confirm saves it. Every floor's plan must be confirmed before you can publish.",
      placement: "top",
    },
  ],

  overview: [
    {
      target: '[data-tour="overview-add-floor"]',
      title: "Every floor in one place",
      body: "Click a room chip to reopen it, or a floor's Open floor button to see its room board. Add more floors from here any time.",
      placement: "top",
    },
    {
      target: '[data-tour="overview-publish"]',
      title: "Publish when ready",
      body: "The button greys out until every room is captured and every floor plan is confirmed. Publishing can be re-run any time.",
      placement: "top",
    },
  ],

  publish: [
    {
      target: '[data-tour="publish-ctas"]',
      title: "You're live",
      body: "Preview how renters see the tour, or head back to the listing. You can edit the tour any time from the room board.",
      placement: "top",
    },
  ],
};
