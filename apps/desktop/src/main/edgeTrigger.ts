export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeTriggerOptions {
  topBandPx: number;
  centerWidthPx: number;
}

export function isTopCenterTriggerPoint(point: Point, bounds: Bounds, options: EdgeTriggerOptions): boolean {
  const centerX = bounds.x + bounds.width / 2;
  const halfWidth = options.centerWidthPx / 2;
  const withinX = point.x >= centerX - halfWidth && point.x <= centerX + halfWidth;
  const withinY = point.y >= bounds.y && point.y <= bounds.y + options.topBandPx;
  return withinX && withinY;
}
