import type { Point } from '@/core/types';

/**
 * Computes a point on a cubic Bezier curve at t.
 * Writes to the provided buffer or returns a new array if none provided.
 *
 * @param t Interpolation factor (0-1)
 * @param x1 Start X
 * @param y1 Start Y
 * @param cp1x Control Point 1 X
 * @param cp1y Control Point 1 Y
 * @param cp2x Control Point 2 X
 * @param cp2y Control Point 2 Y
 * @param x2 End X
 * @param y2 End Y
 * @param out Optional buffer to write result to
 */
export function computeBezierPoint(
    t: number,
    x1: number, y1: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x2: number, y2: number,
    out?: Point
): Point {
    const invT = 1 - t;
    const invT2 = invT * invT;
    const invT3 = invT2 * invT;
    const t2 = t * t;
    const t3 = t2 * t;

    const x = invT3 * x1 + 3 * invT2 * t * cp1x + 3 * invT * t2 * cp2x + t3 * x2;
    const y = invT3 * y1 + 3 * invT2 * t * cp1y + 3 * invT * t2 * cp2y + t3 * y2;

    if (out) {
        out[0] = x;
        out[1] = y;
        return out;
    }
    return [x, y];
}

/**
 * Computes the angle (tangent) of a cubic Bezier curve at t.
 * Uses analytical derivative for performance and precision.
 */
export function computeBezierAngle(
    t: number,
    x1: number, y1: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x2: number, y2: number
): number {
    // Cubic Bezier Derivative:
    // P'(t) = 3(1-t)^2(P1-P0) + 6(1-t)t(P2-P1) + 3t^2(P3-P2)

    const invT = 1 - t;
    const A = 3 * invT * invT;
    const B = 6 * invT * t;
    const C = 3 * t * t;

    const dx = A * (cp1x - x1) + B * (cp2x - cp1x) + C * (x2 - cp2x);
    const dy = A * (cp1y - y1) + B * (cp2y - cp1y) + C * (y2 - cp2y);

    return Math.atan2(dy, dx);
}
