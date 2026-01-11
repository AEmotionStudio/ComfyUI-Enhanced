/**
 * Link rendering strategies for different link styles.
 * Each renderer provides methods to calculate path length, get points,
 * and draw the link between nodes.
 *
 * @module renderers/link-renderers
 */

import type { Point, LinkRenderer, Color } from '@/core/types';

// =============================================================================
// Utility Functions
// =============================================================================

/** Calculate distance between two points */
function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

/** Linear interpolate between two values */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// =============================================================================
// Spline Renderer
// =============================================================================

/**
 * Cubic bezier curve renderer for smooth flowing links.
 * This is the default ComfyUI link style.
 */
export const splineRenderer: LinkRenderer = {
    getLength(start: Point, end: Point): number {
        const samples = 40;
        let length = 0;
        let prevPoint = this.getPoint(start, end, 0);

        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const point = this.getPoint(start, end, t);
            length += distance(point, prevPoint);
            prevPoint = point;
        }

        return length;
    },

    getNormalizedT(
        start: Point,
        end: Point,
        targetDist: number,
        _totalLength: number
    ): number {
        const samples = 40;
        let accumulatedLength = 0;
        let prevPoint = this.getPoint(start, end, 0);

        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const point = this.getPoint(start, end, t);
            const segmentLength = distance(point, prevPoint);

            accumulatedLength += segmentLength;

            if (accumulatedLength >= targetDist) {
                const prevT = (i - 1) / samples;
                const excess = accumulatedLength - targetDist;
                return prevT + (t - prevT) * (1 - excess / segmentLength);
            }

            prevPoint = point;
        }

        return 1;
    },

    getPoint(start: Point, end: Point, t: number): Point {
        const dist = distance(start, end);
        const bendDistance = Math.min(dist * 0.5, 100);

        // Control points for cubic bezier
        const p0 = { x: start[0], y: start[1] };
        const p1 = { x: start[0] + bendDistance, y: start[1] };
        const p2 = { x: end[0] - bendDistance, y: end[1] };
        const p3 = { x: end[0], y: end[1] };

        // Cubic bezier coefficients
        const cx = 3 * (p1.x - p0.x);
        const bx = 3 * (p2.x - p1.x) - cx;
        const ax = p3.x - p0.x - cx - bx;

        const cy = 3 * (p1.y - p0.y);
        const by = 3 * (p2.y - p1.y) - cy;
        const ay = p3.y - p0.y - cy - by;

        const t2 = t * t;
        const t3 = t2 * t;

        const x = ax * t3 + bx * t2 + cx * t + p0.x;
        const y = ay * t3 + by * t2 + cy * t + p0.y;

        return [x, y];
    },

    draw(
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        color: Color,
        thickness: number
    ): void {
        const dist = distance(start, end);
        const bendDistance = Math.min(dist * 0.5, 100);

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.bezierCurveTo(
            start[0] + bendDistance,
            start[1],
            end[0] - bendDistance,
            end[1],
            end[0],
            end[1]
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Straight Renderer
// =============================================================================

/**
 * Simple straight line renderer.
 */
export const straightRenderer: LinkRenderer = {
    getLength(start: Point, end: Point): number {
        return distance(start, end);
    },

    getNormalizedT(
        _start: Point,
        _end: Point,
        targetDist: number,
        totalLength: number
    ): number {
        return targetDist / totalLength;
    },

    getPoint(start: Point, end: Point, t: number): Point {
        return [lerp(start[0], end[0], t), lerp(start[1], end[1], t)];
    },

    draw(
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        color: Color,
        thickness: number
    ): void {
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Linear (Right-angle) Renderer
// =============================================================================

/**
 * Right-angle path renderer (horizontal-vertical-horizontal).
 */
export const linearRenderer: LinkRenderer = {
    getLength(start: Point, end: Point): number {
        const midX = (start[0] + end[0]) / 2;
        const horizontalLength1 = Math.abs(midX - start[0]);
        const verticalLength = Math.abs(end[1] - start[1]);
        const horizontalLength2 = Math.abs(end[0] - midX);

        return horizontalLength1 + verticalLength + horizontalLength2;
    },

    getNormalizedT(
        start: Point,
        end: Point,
        targetDist: number,
        totalLength: number
    ): number {
        const midX = (start[0] + end[0]) / 2;
        const horizontalLength1 = Math.abs(midX - start[0]);
        const verticalLength = Math.abs(end[1] - start[1]);
        const horizontalLength2 = Math.abs(end[0] - midX);

        const segment1Proportion = horizontalLength1 / totalLength;
        const segment2Proportion = verticalLength / totalLength;

        const normalizedDist = targetDist / totalLength;

        if (normalizedDist <= segment1Proportion) {
            return (normalizedDist / segment1Proportion) * 0.33;
        } else if (normalizedDist <= segment1Proportion + segment2Proportion) {
            const segmentProgress =
                (normalizedDist - segment1Proportion) / segment2Proportion;
            return 0.33 + segmentProgress * 0.34;
        } else {
            const segmentProgress =
                (normalizedDist - (segment1Proportion + segment2Proportion)) /
                (horizontalLength2 / totalLength);
            return 0.67 + segmentProgress * 0.33;
        }
    },

    getPoint(start: Point, end: Point, t: number): Point {
        const midX = (start[0] + end[0]) / 2;

        if (t <= 0.33) {
            const segmentT = t / 0.33;
            return [start[0] + (midX - start[0]) * segmentT, start[1]];
        } else if (t <= 0.67) {
            const segmentT = (t - 0.33) / 0.34;
            return [midX, start[1] + (end[1] - start[1]) * segmentT];
        } else {
            const segmentT = (t - 0.67) / 0.33;
            return [midX + (end[0] - midX) * segmentT, end[1]];
        }
    },

    draw(
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        color: Color,
        thickness: number
    ): void {
        const midX = (start[0] + end[0]) / 2;

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(midX, start[1]);
        ctx.lineTo(midX, end[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Hidden Renderer
// =============================================================================

/**
 * Hidden link renderer - doesn't draw the link but provides path calculations.
 */
export const hiddenRenderer: LinkRenderer = {
    getLength(start: Point, end: Point): number {
        return distance(start, end);
    },

    getNormalizedT(
        _start: Point,
        _end: Point,
        targetDist: number,
        totalLength: number
    ): number {
        return targetDist / totalLength;
    },

    getPoint(start: Point, end: Point, t: number): Point {
        return [lerp(start[0], end[0], t), lerp(start[1], end[1], t)];
    },

    draw(): void {
        // Hidden links don't render anything
    },
};

// =============================================================================
// Dotted Renderer
// =============================================================================

/**
 * Dotted line renderer using spline path.
 */
export const dottedRenderer: LinkRenderer = {
    ...splineRenderer,

    draw(
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        color: Color,
        thickness: number
    ): void {
        const dist = distance(start, end);
        const bendDistance = Math.min(dist * 0.5, 100);

        ctx.save();
        ctx.setLineDash([thickness * 2, thickness * 2]);

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.bezierCurveTo(
            start[0] + bendDistance,
            start[1],
            end[0] - bendDistance,
            end[1],
            end[0],
            end[1]
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();

        ctx.restore();
    },
};

// =============================================================================
// Dashed Renderer
// =============================================================================

/**
 * Dashed line renderer using spline path.
 */
export const dashedRenderer: LinkRenderer = {
    ...splineRenderer,

    draw(
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        color: Color,
        thickness: number
    ): void {
        const dist = distance(start, end);
        const bendDistance = Math.min(dist * 0.5, 100);

        ctx.save();
        ctx.setLineDash([thickness * 6, thickness * 3]);

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.bezierCurveTo(
            start[0] + bendDistance,
            start[1],
            end[0] - bendDistance,
            end[1],
            end[0],
            end[1]
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();

        ctx.restore();
    },
};

// =============================================================================
// Exports
// =============================================================================

/** Map of all available link renderers */
export const LinkRenderers: Record<string, LinkRenderer> = {
    spline: splineRenderer,
    straight: straightRenderer,
    linear: linearRenderer,
    hidden: hiddenRenderer,
    dotted: dottedRenderer,
    dashed: dashedRenderer,
};

/**
 * Gets a link renderer by style name, defaulting to spline if not found.
 *
 * @param style - Name of the link style
 * @returns The link renderer
 */
export function getLinkRenderer(style: string): LinkRenderer {
    return LinkRenderers[style] || splineRenderer;
}
