import type { Point } from '@/core/types';

// Shared buffers to avoid garbage collection
const _angleBuffer1: Point = [0, 0];
const _angleBuffer2: Point = [0, 0];

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
 * Uses shared internal buffers to avoid allocation.
 */
export function computeBezierAngle(
    t: number,
    x1: number, y1: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x2: number, y2: number
): number {
    const delta = 0.01;
    const t_prev = Math.max(0, t - delta);
    const t_next = Math.min(1, t + delta);

    // Use shared buffers for angle calculation
    computeBezierPoint(t_prev, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, _angleBuffer1);
    computeBezierPoint(t_next, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, _angleBuffer2);

    return Math.atan2(_angleBuffer2[1] - _angleBuffer1[1], _angleBuffer2[0] - _angleBuffer1[0]);
}
