export type Point = { x: number; y: number };

export const bresenhamLine = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Point[] => {
  const points: Point[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;
  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
};

export const drawRasterLine = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) => {
  const points = bresenhamLine(x0, y0, x1, y1);
  ctx.fillStyle = color;
  points.forEach((p) => ctx.fillRect(p.x, p.y, 1, 1));
};
