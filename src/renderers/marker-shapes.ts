/**
 * Marker Shape Definitions — 12 shapes for link flow markers.
 *
 * Each shape function draws a path at (x, y) with the given size.
 * The caller is responsible for fill/stroke after calling the shape fn.
 *
 * Ported from original link_animations.js (lines 94–257).
 *
 * @module renderers/marker-shapes
 */

export type MarkerShapeFn = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    size: number,
    angle?: number,
) => void;

// =============================================================================
// Shape implementations
// =============================================================================

const none: MarkerShapeFn = () => { /* intentionally empty */ };

const diamond: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
};

const circle: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.closePath();
};

const arrow: MarkerShapeFn = (ctx, x, y, size, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, size);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(-size, -size);
    ctx.closePath();
    ctx.restore();
};

const square: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.rect(x - size, y - size, size * 2, size * 2);
    ctx.closePath();
};

const triangle: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x - size, y + size);
    ctx.closePath();
};

const star: MarkerShapeFn = (ctx, x, y, size) => {
    const spikes = 5;
    const innerRadius = size * 0.4;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? size : innerRadius;
        const a = (i * Math.PI) / spikes;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
};

const heart: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.save();
    ctx.translate(x, y);
    const scale = size * 0.7;
    ctx.scale(scale, scale);
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

const cross: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    const width = size * 0.3;
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.closePath();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
};

const hexagon: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = x + Math.cos(a) * size;
        const py = y + Math.sin(a) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
};

const flower: MarkerShapeFn = (ctx, x, y, size) => {
    const petals = 6;
    const innerRadius = size * 0.3;
    ctx.beginPath();
    for (let i = 0; i < petals; i++) {
        const a = (i * Math.PI * 2) / petals;
        const na = ((i + 1) * Math.PI * 2) / petals;
        const ma = (a + na) / 2;
        const sx = x + Math.cos(a) * innerRadius;
        const sy = y + Math.sin(a) * innerRadius;
        const cx = x + Math.cos(ma) * size * 1.5;
        const cy = y + Math.sin(ma) * size * 1.5;
        const ex = x + Math.cos(na) * innerRadius;
        const ey = y + Math.sin(na) * innerRadius;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
    }
    ctx.closePath();
    ctx.moveTo(x + innerRadius, y);
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
};

const spiral: MarkerShapeFn = (ctx, x, y, size) => {
    ctx.beginPath();
    const turns = 3, points = 40;
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const r = size * t;
        const a = t * turns * Math.PI * 2;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
};

// =============================================================================
// Export map
// =============================================================================

export const MarkerShapes: Record<string, MarkerShapeFn> = {
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

/** Check if a shape name requires fill (vs stroke for cross) */
export function shapeNeedsFill(name: string): boolean {
    return name !== 'cross' && name !== 'none';
}
