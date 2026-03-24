/**
 * Render Utilities — shared canvas drawing helpers for animation effects.
 *
 * Ported from original link_animations.js RenderUtils (lines 1465–1611).
 *
 * @module renderers/render-utils
 */

import { SACRED } from '@/core/config';

// =============================================================================
// Flow Field
// =============================================================================

/** Create a flow field displacement vector at position t with given phase */
export function createFlowField(t: number, phase: number): { x: number; y: number } {
    return {
        x: Math.sin(t * Math.PI * SACRED.TRINITY + phase) * 10,
        y: Math.cos(t * Math.PI * SACRED.TRINITY + phase) * 10,
    };
}

// =============================================================================
// Sacred Geometry Shapes
// =============================================================================

/** Draw a crystal (regular polygon with HARMONY sides) */
export function createCrystal(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    size: number, rotation: number,
    color: string,
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let i = 0; i < SACRED.HARMONY; i++) {
        const angle = (i / SACRED.HARMONY) * Math.PI * 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

/** Draw a merkaba (two intersecting triangles) */
export function createMerkaba(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    size: number, phase: number,
    color: string,
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(phase);

    // First tetrahedron
    ctx.beginPath();
    for (let i = 0; i <= SACRED.TRINITY; i++) {
        const angle = (i / SACRED.TRINITY) * Math.PI * 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.stroke();

    // Second tetrahedron (rotated)
    ctx.rotate(Math.PI / SACRED.TRINITY);
    ctx.beginPath();
    for (let i = 0; i <= SACRED.TRINITY; i++) {
        const angle = (i / SACRED.TRINITY) * Math.PI * 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
}

// =============================================================================
// Curve Point Calculation
// =============================================================================

type CurveStyle = 'none' | 'direct' | 'wave' | 'spiral' | 'smooth';

/** Calculate interpolated points along various curve styles */
export function calculateCurvePoints(
    start: [number, number],
    end: [number, number],
    quality: number,
    style: CurveStyle = 'smooth',
): [number, number][] {
    const points: [number, number][] = [];
    const steps = quality * 3;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const d = Math.sqrt(dx * dx + dy * dy);

    switch (style) {
        case 'none':
            points.push([start[0], start[1]], [end[0], end[1]]);
            break;

        case 'direct':
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                points.push([start[0] + dx * t, start[1] + dy * t]);
            }
            break;

        case 'wave': {
            const waveAmp = d * 0.35;
            const waveFreq = 4;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                points.push([
                    start[0] + dx * t,
                    start[1] + dy * t + Math.sin(t * Math.PI * waveFreq) * waveAmp,
                ]);
            }
            break;
        }

        case 'spiral': {
            const maxRadius = d * 0.4;
            const spiralTurns = 8;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const r = (1 - t) * maxRadius;
                const a = t * Math.PI * spiralTurns;
                points.push([
                    start[0] + dx * t + Math.cos(a) * r,
                    start[1] + dy * t + Math.sin(a) * r,
                ]);
            }
            break;
        }

        case 'smooth':
        default: {
            const perpX = -dy * 0.5;
            const perpY = dx * 0.5;
            const cp1x = start[0] + dx * 0.25 + perpX;
            const cp1y = start[1] + dy * 0.25 + perpY;
            const cp2x = start[0] + dx * 0.75 - perpX;
            const cp2y = start[1] + dy * 0.75 - perpY;

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const mt = 1 - t;
                points.push([
                    mt ** 3 * start[0] + 3 * mt ** 2 * t * cp1x + 3 * mt * t ** 2 * cp2x + t ** 3 * end[0],
                    mt ** 3 * start[1] + 3 * mt ** 2 * t * cp1y + 3 * mt * t ** 2 * cp2y + t ** 3 * end[1],
                ]);
            }
            break;
        }
    }

    return points;
}

// =============================================================================
// Canvas Configuration
// =============================================================================

/** Enable high-quality anti-aliased rendering */
export function enableAntiAliasing(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;
}
