export interface AvatarCropDimensions {
  height: number;
  width: number;
}

export interface AvatarCropOffset {
  x: number;
  y: number;
}

interface AvatarCoverGeometry {
  displayScale: number;
  maxOffsetX: number;
  maxOffsetY: number;
}

export interface AvatarSourceCrop {
  size: number;
  x: number;
  y: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function coverGeometry(
  image: AvatarCropDimensions,
  viewportSize: number,
  zoom: number,
): AvatarCoverGeometry {
  const displayScale =
    Math.max(viewportSize / image.width, viewportSize / image.height) * zoom;

  return {
    displayScale,
    maxOffsetX: Math.max(0, (image.width * displayScale - viewportSize) / 2),
    maxOffsetY: Math.max(0, (image.height * displayScale - viewportSize) / 2),
  };
}

export function clampAvatarCropOffset(
  image: AvatarCropDimensions,
  viewportSize: number,
  zoom: number,
  offset: AvatarCropOffset,
): AvatarCropOffset {
  const geometry = coverGeometry(image, viewportSize, zoom);

  return {
    x:
      geometry.maxOffsetX === 0
        ? 0
        : clamp(offset.x, -geometry.maxOffsetX, geometry.maxOffsetX),
    y:
      geometry.maxOffsetY === 0
        ? 0
        : clamp(offset.y, -geometry.maxOffsetY, geometry.maxOffsetY),
  };
}

export function getAvatarSourceCrop(
  image: AvatarCropDimensions,
  viewportSize: number,
  zoom: number,
  offset: AvatarCropOffset,
): AvatarSourceCrop {
  const geometry = coverGeometry(image, viewportSize, zoom);
  const clampedOffset = clampAvatarCropOffset(
    image,
    viewportSize,
    zoom,
    offset,
  );
  const size = viewportSize / geometry.displayScale;
  const centerX = image.width / 2 - clampedOffset.x / geometry.displayScale;
  const centerY = image.height / 2 - clampedOffset.y / geometry.displayScale;

  return {
    size,
    x: clamp(centerX - size / 2, 0, image.width - size),
    y: clamp(centerY - size / 2, 0, image.height - size),
  };
}
