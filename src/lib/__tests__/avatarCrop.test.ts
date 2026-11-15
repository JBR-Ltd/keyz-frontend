import { describe, expect, it } from "vitest";
import { clampAvatarCropOffset, getAvatarSourceCrop } from "../avatarCrop";

describe("avatar crop geometry", () => {
  it("centres a landscape image inside a square viewport", () => {
    expect(
      getAvatarSourceCrop({ width: 1200, height: 800 }, 320, 1, { x: 0, y: 0 }),
    ).toEqual({ size: 800, x: 200, y: 0 });
  });

  it("centres a portrait image inside a square viewport", () => {
    expect(
      getAvatarSourceCrop({ width: 800, height: 1200 }, 320, 1, { x: 0, y: 0 }),
    ).toEqual({ size: 800, x: 0, y: 200 });
  });

  it("clamps movement before empty space can enter the crop", () => {
    expect(
      clampAvatarCropOffset({ width: 1200, height: 800 }, 320, 1, {
        x: 200,
        y: -50,
      }),
    ).toEqual({ x: 80, y: 0 });
    expect(
      getAvatarSourceCrop({ width: 1200, height: 800 }, 320, 1, {
        x: 200,
        y: -50,
      }),
    ).toEqual({ size: 800, x: 0, y: 0 });
  });

  it("uses a smaller source area as zoom increases", () => {
    expect(
      getAvatarSourceCrop({ width: 1200, height: 800 }, 320, 2, { x: 0, y: 0 }),
    ).toEqual({ size: 400, x: 400, y: 200 });
  });
});
