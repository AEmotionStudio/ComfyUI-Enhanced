/**
 * Link animation effects for flow visualization.
 * These create visual flow indicators along link paths.
 *
 * @module effects/link-effects
 */

import type { Point, Color } from '@/core/types';
import { PHI, SACRED } from '@/core/config';
import { withAlpha, hexToRgb } from '@/utils/colors';

// =============================================================================
// Helpers
// =============================================================================

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
 * Calculate flow positions along a link.
 *
 * @param linkLength - Total length of the link
 * @param phase - Current animation phase
 * @param density - Marker density
 * @param direction - Flow direction
 * @returns Array of t values (0-1) for marker positions
 */
export function calculateFlowPositions(
    linkLength: number,
    phase: number,
    density: number,
    direction: number
): number[] {
    const spacing = Math.max(30, 60 - density * 20);
    const markerCount = Math.max(1, Math.floor(linkLength / spacing));
    const positions: number[] = [];

    for (let i = 0; i < markerCount; i++) {
        const baseT = i / markerCount;
        const animOffset = (phase * direction * 0.1) % 1;
        let t = (baseT + animOffset) % 1;
        if (t < 0) t += 1;
        positions.push(t);
    }

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
    getPoint: (t: number) => Point,
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

        const point = getPoint(t);
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
    getPoint: (t: number) => Point,
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

        const point = getPoint(t);

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
 * Classic Flow animation - smooth flowing markers.
 */
export function classicFlowAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    getAngle: (t: number) => number,
    linkLength: number,
    params: LinkAnimationParams,
    color: Color,
    markerSize: number
): void {
    const positions = calculateFlowPositions(
        linkLength,
        params.phase,
        params.particleDensity,
        params.direction
    );

    const rgb = getRgb(color);

    for (const t of positions) {
        const point = getPoint(t);
        const angle = getAngle(t);
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
}

/**
 * Energy Surge animation - pulsing energy particles.
 */
export function energySurgeAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    params: LinkAnimationParams,
    primaryColor: Color,
    secondaryColor: Color
): void {
    drawEnergyParticles(ctx, getPoint, params, primaryColor, secondaryColor);
}

/**
 * Quantum Flow animation - abstract quantum-inspired visuals.
 */
export function quantumFlowAnimation(
    ctx: CanvasRenderingContext2D,
    getPoint: (t: number) => Point,
    params: LinkAnimationParams,
    color: Color,
    thickness: number
): void {
    drawGlowTrail(ctx, getPoint, params, color, thickness);
    drawEnergyParticles(ctx, getPoint, params, color, color);
}

// =============================================================================
// Exports
// =============================================================================

export const LinkEffects = {
    classicFlow: classicFlowAnimation,
    energySurge: energySurgeAnimation,
    quantumFlow: quantumFlowAnimation,
};
