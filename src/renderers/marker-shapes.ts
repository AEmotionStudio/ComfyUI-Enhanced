/**
 * Marker shape rendering functions for link flow indicators.
 * Each shape function draws a marker at a given position on the canvas.
 *
 * @module renderers/marker-shapes
 */

import type { MarkerShapeRenderer } from '@/core/types';

// =============================================================================
// Marker Shape Renderers
// =============================================================================

/**
 * Draws no marker (null implementation)
 */
export const none: MarkerShapeRenderer = () => {
    // Do nothing - no marker to draw
};

/**
 * Draws a diamond shape marker
 */
export const diamond: MarkerShapeRenderer = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
};

/**
 * Draws a circular marker
 */
export const circle: MarkerShapeRenderer = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.closePath();
};

/**
 * Draws an arrow marker pointing in the given direction
 */
export const arrow: MarkerShapeRenderer = (ctx, x, y, size, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    // Arrow head
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, size);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(-size, -size);
    ctx.closePath();

    ctx.restore();
};

/**
 * Draws a square marker
 */
export const square: MarkerShapeRenderer = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.rect(x - size, y - size, size * 2, size * 2);
    ctx.closePath();
};

/**
 * Draws a triangle marker pointing up
 */
export const triangle: MarkerShapeRenderer = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x - size, y + size);
    ctx.closePath();
};

/**
 * Draws a 5-pointed star marker
 */
export const star: MarkerShapeRenderer = (ctx, x, y, size) => {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const pointX = x + Math.cos(angle) * radius;
        const pointY = y + Math.sin(angle) * radius;

        i === 0 ? ctx.moveTo(pointX, pointY) : ctx.lineTo(pointX, pointY);
    }
    ctx.closePath();
};

/**
 * Draws a heart-shaped marker
 */
export const heart: MarkerShapeRenderer = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.save();
    ctx.translate(x, y);

    // Scale to match other marker sizes
    const scale = size * 0.7;
    ctx.scale(scale, scale);

    // Draw heart shape
    ctx.moveTo(0, 0.4);
    ctx.bezierCurveTo(0, 0.3, -0.5, -0.4, -1, -0.4);
    ctx.bezierCurveTo(-1.5, -0.4, -1.5, 0.2, -1.5, 0.2);
    ctx.bezierCurveTo(-1.5, 0.6, -0.5, 1.4, 0, 2);
    ctx.bezierCurveTo(0.5, 1.4, 1.5, 0.6, 1.5, 0.2);
    ctx.bezierCurveTo(1.5, 0.2, 1.5, -0.4, 1, -0.4);
    ctx.bezierCurveTo(0.5, -0.4, 0, 0.3, 0, 0.4);

    ctx.restore();
    ctx.closePath();
};

/**
 * Draws a cross/plus marker
 */
export const cross: MarkerShapeRenderer = (ctx, x, y, size) => {
    const originalLineWidth = ctx.lineWidth;
    const originalLineCap = ctx.lineCap;
    const width = size * 0.3;

    ctx.beginPath();
    // Vertical line
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    // Horizontal line
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.closePath();

    // Add thickness
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Reset
    ctx.lineCap = originalLineCap;
    ctx.lineWidth = originalLineWidth;
};

/**
 * Draws a hexagon marker
 */
export const hexagon: MarkerShapeRenderer = (ctx, x, y, size) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const pointX = x + Math.cos(angle) * size;
        const pointY = y + Math.sin(angle) * size;
        i === 0 ? ctx.moveTo(pointX, pointY) : ctx.lineTo(pointX, pointY);
    }
    ctx.closePath();
};

/**
 * Draws a flower-shaped marker with petals
 */
export const flower: MarkerShapeRenderer = (ctx, x, y, size) => {
    const petals = 6;
    const innerRadius = size * 0.3;
    const outerRadius = size;

    ctx.beginPath();
    // Draw petals
    for (let i = 0; i < petals; i++) {
        const angle = (i * Math.PI * 2) / petals;
        const nextAngle = ((i + 1) * Math.PI * 2) / petals;
        const midAngle = (angle + nextAngle) / 2;

        const startX = x + Math.cos(angle) * innerRadius;
        const startY = y + Math.sin(angle) * innerRadius;
        const controlX = x + Math.cos(midAngle) * outerRadius * 1.5;
        const controlY = y + Math.sin(midAngle) * outerRadius * 1.5;
        const endX = x + Math.cos(nextAngle) * innerRadius;
        const endY = y + Math.sin(nextAngle) * innerRadius;

        i === 0 ? ctx.moveTo(startX, startY) : ctx.lineTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    }
    ctx.closePath();

    // Draw center
    ctx.moveTo(x + innerRadius, y);
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
};

/**
 * Draws a spiral marker
 */
export const spiral: MarkerShapeRenderer = (ctx, x, y, size) => {
    const turns = 3;
    const points = 40;

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const radius = size * t;
        const angle = t * turns * Math.PI * 2;
        const pointX = x + Math.cos(angle) * radius;
        const pointY = y + Math.sin(angle) * radius;

        i === 0 ? ctx.moveTo(pointX, pointY) : ctx.lineTo(pointX, pointY);
    }
};

// =============================================================================
// Exports
// =============================================================================

/** Map of all available marker shapes */
export const MarkerShapes: Record<string, MarkerShapeRenderer> = {
    none,
    diamond,
    circle,
    arrow,
    square,
    triangle,
    star,
    heart,
    cross,
    hexagon,
    flower,
    spiral,
};

/**
 * Gets a marker renderer by name, defaulting to arrow if not found.
 *
 * @param name - Name of the marker shape
 * @returns The marker shape renderer function
 */
export function getMarkerShape(name: string): MarkerShapeRenderer {
    return MarkerShapes[name] || arrow;
}
