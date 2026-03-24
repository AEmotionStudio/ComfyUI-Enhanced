/**
 * Link animation effects for flow visualization.
 * These create visual flow indicators along link paths.
 *
 * @module effects/link-effects
 */

import type { Point, Color, BezierCurve } from '@/core/types';
import { PHI, SACRED } from '@/core/config';
import { withAlpha, hexToRgb } from '@/utils/colors';
import { computeBezierPoint, computeBezierAngle } from '@/utils/geometry';

// =============================================================================
// Helpers
// =============================================================================

// Shared buffer to avoid allocation during Bezier curve calculations
// This avoids creating thousands of small arrays per frame in the render loop
const SHARED_POINT_BUFFER: Point = [0, 0];

type RgbColor = { r: number; g: number; b: number };

function getRgb(color: Color): RgbColor | null {
    if (typeof color === 'string' && color.startsWith('#')) {
        return hexToRgb(color);
    }
    return null;
}

function fastAlpha(rgb: RgbColor | null, color: Color, alpha: number): string {
    if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
    }
    return withAlpha(color, alpha);
}

// =============================================================================
// Types
// =============================================================================

/** Parameters for link animation rendering */
export interface LinkAnimationParams {
    /** Current animation phase */
    phase: number;
    /** Animation quality (1-3) */
    quality: number;
    /** Glow intensity (0-1) */
    glowIntensity: number;
    /** Particle density (0-2) */
    particleDensity: number;
    /** Animation direction (1 or -1) */
    direction: number;
    /** Whether in static mode */
    isStatic: boolean;
}

/** Link point with additional animation data */
export interface AnimatedLinkPoint {
    x: number;
    y: number;
    t: number;
    alpha: number;
}

// =============================================================================
// Flow Effect Calculations
// =============================================================================

/**
 * Iterate over flow positions along a link.
 *
 * @param linkLength - Total length of the link
 * @param phase - Current animation phase
 * @param density - Marker density
 * @param direction - Flow direction
 * @param callback - Function to call for each position t (0-1)
 */
export function forEachFlowPosition(
    linkLength: number,
    phase: number,
    density: number,
    direction: number,
    callback: (t: number) => void
): void {
    const spacing = Math.max(30, 60 - density * 20);
    const markerCount = Math.max(1, Math.floor(linkLength / spacing));

    for (let i = 0; i < markerCount; i++) {
        const baseT = i / markerCount;
        const animOffset = (phase * direction * 0.1) % 1;
        let t = (baseT + animOffset) % 1;
        if (t < 0) t += 1;
        callback(t);
    }
}

/**
 * Calculate flow positions along a link.
 *
 * @deprecated Use forEachFlowPosition instead to avoid array allocation
 */
export function calculateFlowPositions(
    linkLength: number,
    phase: number,
    density: number,
    direction: number
): number[] {
    const positions: number[] = [];
    forEachFlowPosition(linkLength, phase, density, direction, (t) => positions.push(t));
    return positions;
}

/**
 * Calculate wave offset for organic flow movement.
 */
export function calculateWaveOffset(
    t: number,
    phase: number,
    intensity: number,
    isStatic: boolean
): number {
    if (isStatic) return 0;
    return Math.sin(t * Math.PI * SACRED.TRINITY + phase) * intensity;
}

/**
 * Calculate pulse effect for markers.
 */
export function calculatePulseEffect(
    t: number,
    phase: number,
    quality: number
): number {
    const pulseSpeed = 2 + quality * 0.5;
    return 0.8 + 0.2 * Math.sin(t * Math.PI * 2 + phase * pulseSpeed);
}

// =============================================================================
// Drawing Functions
// =============================================================================

/**
 * Draw a flow marker at a position.
 */
export function drawFlowMarker(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    size: number,
    color: Color,
    alpha: number,
    glowIntensity: number,
    rgb?: RgbColor | null
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Glow effect
    if (glowIntensity > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 5 * glowIntensity;
    }

    // Draw arrow marker
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, size * 0.7);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size, -size * 0.7);
    ctx.closePath();

    ctx.fillStyle = fastAlpha(rgb || null, color, alpha);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw energy particles along a link.
 */
export function drawEnergyParticles(
    ctx: CanvasRenderingContext2D,
    curve: BezierCurve,
    params: LinkAnimationParams,
    primaryColor: Color,
    secondaryColor: Color
): void {
    const { phase, quality, particleDensity, direction, isStatic } = params;
    const particleCount = Math.floor(3 + quality * 2 * particleDensity);

    const primaryRgb = getRgb(primaryColor);
    const secondaryRgb = getRgb(secondaryColor);

    for (let i = 0; i < particleCount; i++) {
        const baseT = i / particleCount;
        const offset = isStatic ? 0 : (phase * direction * 0.15 + i * 0.1) % 1;
        let t = (baseT + offset) % 1;
        if (t < 0) t += 1;

        const point = computeBezierPoint(
            t,
            curve.x1, curve.y1,
            curve.cp1x, curve.cp1y,
            curve.cp2x, curve.cp2y,
            curve.x2, curve.y2,
            SHARED_POINT_BUFFER
        );
        const size = 2 + quality + Math.sin(phase * 2 + i) * 1;
        const alpha = 0.6 + 0.4 * Math.sin(phase * 3 + i * PHI);

        // Particle gradient
        const gradient = ctx.createRadialGradient(
            point[0],
            point[1],
            0,
            point[0],
            point[1],
            size * 2
        );
        gradient.addColorStop(0, fastAlpha(primaryRgb, primaryColor, alpha));
        gradient.addColorStop(0.5, fastAlpha(secondaryRgb, secondaryColor, alpha * 0.5));
        gradient.addColorStop(1, fastAlpha(secondaryRgb, secondaryColor, 0));

        ctx.beginPath();
        ctx.arc(point[0], point[1], size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(point[0], point[1], size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = fastAlpha(primaryRgb, primaryColor, Math.min(alpha * 1.5, 1));
        ctx.fill();
    }
}

/**
 * Draw a glowing trail effect along a link.
 */
export function drawGlowTrail(
    ctx: CanvasRenderingContext2D,
    curve: BezierCurve,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    const { phase, glowIntensity, direction, isStatic } = params;
    const segments = 20;
    const trailLength = 0.3;
    const trailStart = isStatic ? 0.35 : ((phase * direction * 0.1) % 1);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * glowIntensity;

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
        const segmentT = i / segments;
        let t = trailStart + segmentT * trailLength;
        if (t > 1) t -= 1;

        const point = computeBezierPoint(
            t,
            curve.x1, curve.y1,
            curve.cp1x, curve.cp1y,
            curve.cp2x, curve.cp2y,
            curve.x2, curve.y2,
            SHARED_POINT_BUFFER
        );

        if (i === 0) {
            ctx.moveTo(point[0], point[1]);
        } else {
            ctx.lineTo(point[0], point[1]);
        }
    }

    ctx.strokeStyle = withAlpha(color, 0.7);
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.restore();
}

// =============================================================================
// Animation Style Functions
// =============================================================================

/**
 * Classic Flow animation (Style 9) - smooth flowing markers.
 */
export function classicFlowAnimation(
    ctx: CanvasRenderingContext2D,
    curve: BezierCurve,
    linkLength: number,
    params: LinkAnimationParams,
    color: Color,
    markerSize: number
): void {
    const rgb = getRgb(color);

    forEachFlowPosition(
        linkLength,
        params.phase,
        params.particleDensity,
        params.direction,
        (t) => {
            const point = computeBezierPoint(
                t,
                curve.x1, curve.y1,
                curve.cp1x, curve.cp1y,
                curve.cp2x, curve.cp2y,
                curve.x2, curve.y2,
                SHARED_POINT_BUFFER
            );
            const angle = computeBezierAngle(
                t,
                curve.x1, curve.y1,
                curve.cp1x, curve.cp1y,
                curve.cp2x, curve.cp2y,
                curve.x2, curve.y2
            );
            const pulse = calculatePulseEffect(t, params.phase, params.quality);
            const alpha = 0.7 + 0.3 * pulse;

            drawFlowMarker(
                ctx,
                point[0],
                point[1],
                angle,
                markerSize * pulse,
                color,
                alpha,
                params.glowIntensity,
                rgb
            );
        }
    );
}

/**
 * Sacred Flow animation (Style 1) - sinusoidal flowing line with particles.
 * Ported from the original JS monolith.
 */
export function sacredFlowAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    const { phase, quality, particleDensity, glowIntensity, direction, isStatic } = params;
    const adjustedPhase = isStatic ? phase : phase * direction;

    // Flowing line with sacred geometry sine waves
    const points = Math.floor(SACRED.TRINITY * quality * 10 * Math.max(particleDensity, 0.5));
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const basePoint = getPoint(t);
        const flowX = Math.sin(t * Math.PI * SACRED.TRINITY + adjustedPhase) * 10;
        const flowY = Math.cos(t * Math.PI * SACRED.TRINITY + adjustedPhase) * 10;
        const offsetX = flowX * Math.sin(t * Math.PI + adjustedPhase);
        const offsetY = flowY * Math.sin(t * Math.PI + adjustedPhase);
        const x = basePoint[0] + offsetX;
        const y = basePoint[1] + offsetY;

        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.stroke();

    // Sacred particles
    const particleCount = Math.floor(SACRED.TRINITY * quality * particleDensity);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    for (let i = 0; i < particleCount; i++) {
        const t = ((i / particleCount) + adjustedPhase * 0.1) % 1;
        const basePoint = getPoint(t);
        const flowX = Math.sin(t * Math.PI * SACRED.TRINITY + adjustedPhase) * 10;
        const flowY = Math.cos(t * Math.PI * SACRED.TRINITY + adjustedPhase) * 10;
        const x = basePoint[0] + flowX * Math.sin(t * Math.PI + adjustedPhase);
        const y = basePoint[1] + flowY * Math.sin(t * Math.PI + adjustedPhase);

        ctx.beginPath();
        ctx.arc(x, y, thickness * 0.75, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Crystal Stream animation (Style 2) - geometric crystalline particles flowing along the link.
 */
export function crystalStreamAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    getAngle: (t: number) => number,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    const { phase, quality, particleDensity, glowIntensity, direction, isStatic } = params;
    const adjustedPhase = isStatic ? phase : phase * direction;
    const crystalCount = Math.floor(5 + quality * 3 * particleDensity);

    ctx.save();

    for (let i = 0; i < crystalCount; i++) {
        const baseT = i / crystalCount;
        const offset = isStatic ? 0 : (adjustedPhase * 0.08) % 1;
        let t = (baseT + offset) % 1;
        if (t < 0) t += 1;

        const point = getPoint(t);
        const angle = getAngle(t);
        const size = (thickness + quality) * (0.6 + 0.4 * Math.sin(phase * 2 + i * PHI));
        const alpha = 0.5 + 0.5 * Math.sin(phase * 3 + i * 0.7);

        // Draw hexagonal crystal
        ctx.save();
        ctx.translate(point[0], point[1]);
        ctx.rotate(angle + phase * 0.5);

        ctx.beginPath();
        const sides = 6;
        for (let j = 0; j <= sides; j++) {
            const a = (j / sides) * Math.PI * 2;
            const px = Math.cos(a) * size;
            const py = Math.sin(a) * size;
            j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.strokeStyle = withAlpha(color, alpha);
        ctx.lineWidth = 1.5;
        if (glowIntensity > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = glowIntensity * 0.5;
        }
        ctx.stroke();

        // Inner diamond
        ctx.beginPath();
        const innerSize = size * 0.4;
        for (let j = 0; j < 4; j++) {
            const a = (j / 4) * Math.PI * 2 + Math.PI / 4;
            const px = Math.cos(a) * innerSize;
            const py = Math.sin(a) * innerSize;
            j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = withAlpha(color, alpha * 0.3);
        ctx.fill();

        ctx.restore();
    }

    ctx.restore();
}

/**
 * Quantum Field animation (Style 3) - scattered quantum particles with noise.
 * Ported from the original JS monolith.
 */
export function quantumFieldAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    const { phase, quality, particleDensity, glowIntensity, direction, isStatic } = params;
    const adjustedPhase = isStatic ? phase : phase * direction;
    const particleCount = Math.floor(30 * particleDensity * quality);

    ctx.save();

    for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const noise = Math.sin(t * 50 + adjustedPhase);
        const basePoint = getPoint(t);
        const x = basePoint[0] + Math.cos(adjustedPhase * 2 + t * Math.PI * 4) * 30 * noise;
        const y = basePoint[1] + Math.sin(adjustedPhase * 3 + t * Math.PI * 6) * 15 * noise;
        const size = thickness * (0.5 + noise * 0.5);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(color, 0.4 + noise * 0.4);
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity * (0.5 + noise * 0.5);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Cosmic Weave animation (Style 4) - intertwining wave + spiral overlay.
 * Ported from the original JS monolith.
 */
export function cosmicWeaveAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    const { phase, quality, particleDensity, glowIntensity, direction, isStatic } = params;
    const adjustedPhase = isStatic ? phase : phase * direction;
    const points = Math.floor(SACRED.QUANTUM * quality * 8);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;

    // Main weaving line
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const basePoint = getPoint(t);
        const weave = Math.sin(t * Math.PI * 4 + adjustedPhase) * 20;
        const spiral = Math.cos(t * Math.PI * 8 + adjustedPhase) * 10;
        const x = basePoint[0] +
            Math.cos(adjustedPhase * 2 + t * Math.PI * 3) * weave +
            Math.sin(adjustedPhase + t * Math.PI * 5) * spiral;
        const y = basePoint[1] +
            Math.sin(adjustedPhase * 2 + t * Math.PI * 3) * weave +
            Math.cos(adjustedPhase + t * Math.PI * 5) * spiral;

        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.stroke();

    // Cosmic starlike particles
    const particleCount = Math.floor(SACRED.INFINITY * quality * particleDensity);
    ctx.shadowBlur = 0;
    for (let i = 0; i < particleCount; i++) {
        const t = ((i / particleCount) + adjustedPhase * 0.1) % 1;
        const basePoint = getPoint(t);
        const weave = Math.sin(t * Math.PI * 4 + adjustedPhase) * 20;
        const spiral = Math.cos(t * Math.PI * 8 + adjustedPhase) * 10;
        const x = basePoint[0] +
            Math.cos(adjustedPhase * 2 + t * Math.PI * 3) * weave +
            Math.sin(adjustedPhase + t * Math.PI * 5) * spiral;
        const y = basePoint[1] +
            Math.sin(adjustedPhase * 2 + t * Math.PI * 3) * weave +
            Math.cos(adjustedPhase + t * Math.PI * 5) * spiral;

        const size = thickness * 0.5;

        // Star spikes
        ctx.strokeStyle = withAlpha(color, 0.6);
        ctx.lineWidth = 1;
        for (let j = 0; j < 4; j++) {
            const angle = (j / 4) * Math.PI * 2 + adjustedPhase;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * size * 2, y + Math.sin(angle) * size * 2);
            ctx.stroke();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Energy Pulse animation (Style 5) - pulsating wave crests traveling along the link.
 */
export function energyPulseAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    const { phase, quality, particleDensity, glowIntensity, direction, isStatic } = params;
    const adjustedPhase = isStatic ? phase : phase * direction;
    const pulseCount = Math.floor(3 + quality * 2);

    ctx.save();

    // Multiple pulse waves traveling along the link
    for (let p = 0; p < pulseCount; p++) {
        const pulseCenter = ((p / pulseCount) + adjustedPhase * 0.15) % 1;
        const pulseWidth = 0.15 + quality * 0.02;
        const segments = Math.floor(20 * quality);

        ctx.beginPath();
        let firstPoint = true;

        for (let i = 0; i <= segments; i++) {
            const localT = (i / segments) * pulseWidth - pulseWidth / 2;
            let t = pulseCenter + localT;
            if (t < 0 || t > 1) continue;

            const basePoint = getPoint(t);
            const dist = Math.abs(localT) / (pulseWidth / 2);
            const envelope = Math.max(0, 1 - dist * dist); // Gaussian-like envelope
            const amp = envelope * (8 + quality * 4) * particleDensity;
            const wave = Math.sin(localT * Math.PI * 8 + adjustedPhase * 3) * amp;

            // Perpendicular offset
            const dt = 0.01;
            const p1 = getPoint(Math.max(0, t - dt));
            const p2 = getPoint(Math.min(1, t + dt));
            const nx = -(p2[1] - p1[1]);
            const ny = p2[0] - p1[0];
            const len = Math.sqrt(nx * nx + ny * ny) || 1;

            const x = basePoint[0] + (nx / len) * wave;
            const y = basePoint[1] + (ny / len) * wave;

            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }

        const pulseAlpha = 0.5 + 0.5 * Math.sin(phase * 2 + p * PHI);
        ctx.strokeStyle = withAlpha(color, pulseAlpha);
        ctx.lineWidth = thickness * (0.8 + 0.4 * Math.sin(phase + p));
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity * 0.7;
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * DNA Helix animation (Style 6) - double helix spiraling along the link path.
 */
export function dnaHelixAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    const { phase, quality, particleDensity, glowIntensity, direction, isStatic } = params;
    const adjustedPhase = isStatic ? phase : phase * direction;
    const segments = Math.floor(40 * quality);
    const helixRadius = 6 + quality * 2;
    const twists = 3 + quality;

    ctx.save();

    // Compute perpendicular normal at each sample point
    const samplePoint = (t: number, strand: number) => {
        const base = getPoint(t);
        const dt = 0.005;
        const p1 = getPoint(Math.max(0, t - dt));
        const p2 = getPoint(Math.min(1, t + dt));
        const nx = -(p2[1] - p1[1]);
        const ny = p2[0] - p1[0];
        const len = Math.sqrt(nx * nx + ny * ny) || 1;

        const helixAngle = t * Math.PI * 2 * twists + adjustedPhase + strand * Math.PI;
        const offset = Math.sin(helixAngle) * helixRadius;

        return {
            x: base[0] + (nx / len) * offset,
            y: base[1] + (ny / len) * offset,
            depth: Math.cos(helixAngle), // For depth-based alpha
        };
    };

    // Draw both strands
    for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const p = samplePoint(t, strand);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = withAlpha(color, strand === 0 ? 0.8 : 0.5);
        ctx.lineWidth = thickness * (strand === 0 ? 1 : 0.7);
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.stroke();
    }

    // Cross-links (base pairs)
    const crossCount = Math.floor(twists * 2 * particleDensity);
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (let i = 0; i < crossCount; i++) {
        const t = (i + 0.5) / crossCount;
        const a = samplePoint(t, 0);
        const b = samplePoint(t, 1);
        const crossAlpha = 0.3 + 0.2 * Math.sin(phase * 2 + i * PHI);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = withAlpha(color, crossAlpha);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Energy Surge animation (Style 8) - pulsing energy particles.
 */
export function energySurgeAnimation(
    ctx: CanvasRenderingContext2D,
    curve: BezierCurve,
    params: LinkAnimationParams,
    primaryColor: Color,
    secondaryColor: Color
): void {
    drawEnergyParticles(ctx, curve, params, primaryColor, secondaryColor);
}

/**
 * Lava/Quantum Flow animation (Style 7) - abstract quantum-inspired visuals.
 */
export function quantumFlowAnimation(
    ctx: CanvasRenderingContext2D,
    curve: BezierCurve,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    drawGlowTrail(ctx, curve, params, color, thickness);
    drawEnergyParticles(ctx, curve, params, color, color);
}

// =============================================================================
// Exports
// =============================================================================

export const LinkEffects = {
    classicFlow: classicFlowAnimation,
    sacredFlow: sacredFlowAnimation,
    crystalStream: crystalStreamAnimation,
    quantumField: quantumFieldAnimation,
    cosmicWeave: cosmicWeaveAnimation,
    energyPulse: energyPulseAnimation,
    dnaHelix: dnaHelixAnimation,
    energySurge: energySurgeAnimation,
    quantumFlow: quantumFlowAnimation,
};
