/**
 * Rendering utility functions for canvas operations.
 * Contains shared drawing helpers, math utilities, and canvas state management.
 *
 * @module utils/render
 */

import type { Point } from '@/core/types';
import { PHI } from '@/core/config';

// =============================================================================
// Point Utilities
// =============================================================================

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

/**
 * Linear interpolate between two values
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Linear interpolate between two points
 */
export function lerpPoint(p1: Point, p2: Point, t: number): Point {
    return [lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t)];
}

/**
 * Calculate angle from p1 to p2 in radians
 */
export function angle(p1: Point, p2: Point): number {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}

/**
 * Rotate a point around an origin
 */
export function rotatePoint(
    point: Point,
    origin: Point,
    angleRad: number
): Point {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = point[0] - origin[0];
    const dy = point[1] - origin[1];
    return [origin[0] + dx * cos - dy * sin, origin[1] + dx * sin + dy * cos];
}

// =============================================================================
// Color Utilities
// =============================================================================

/**
 * Parse color to RGBA components
 */
export function parseColor(
    color: string
): { r: number; g: number; b: number; a: number } | null {
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: 1,
            };
        }
    }

    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
    if (rgbaMatch) {
        return {
            r: parseInt(rgbaMatch[1]),
            g: parseInt(rgbaMatch[2]),
            b: parseInt(rgbaMatch[3]),
            a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
        };
    }

    return null;
}

// =============================================================================
// Flow Field Effects
// =============================================================================

/**
 * Create a flow field offset for dynamic effects
 */
export function createFlowField(
    t: number,
    phase: number,
    scale = 10
): { x: number; y: number } {
    return {
        x: Math.sin(t * Math.PI * 3 + phase) * scale,
        y: Math.cos(t * Math.PI * 3 + phase) * scale,
    };
}

/**
 * Calculate sacred geometry spiral point
 */
export function sacredSpiral(
    angle: number,
    growthFactor: number = PHI
): { x: number; y: number } {
    const r = Math.pow(growthFactor, angle / (2 * Math.PI));
    return {
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
    };
}

// =============================================================================
// Canvas State Management
// =============================================================================

/**
 * Save canvas state, apply style, and return restore function
 */
export function withCanvasStyle(
    ctx: CanvasRenderingContext2D,
    style: Partial<{
        fillStyle: string;
        strokeStyle: string;
        lineWidth: number;
        lineCap: CanvasLineCap;
        lineJoin: CanvasLineJoin;
        globalAlpha: number;
        shadowColor: string;
        shadowBlur: number;
        shadowOffsetX: number;
        shadowOffsetY: number;
    }>
): () => void {
    ctx.save();

    if (style.fillStyle !== undefined) ctx.fillStyle = style.fillStyle;
    if (style.strokeStyle !== undefined) ctx.strokeStyle = style.strokeStyle;
    if (style.lineWidth !== undefined) ctx.lineWidth = style.lineWidth;
    if (style.lineCap !== undefined) ctx.lineCap = style.lineCap;
    if (style.lineJoin !== undefined) ctx.lineJoin = style.lineJoin;
    if (style.globalAlpha !== undefined) ctx.globalAlpha = style.globalAlpha;
    if (style.shadowColor !== undefined) ctx.shadowColor = style.shadowColor;
    if (style.shadowBlur !== undefined) ctx.shadowBlur = style.shadowBlur;
    if (style.shadowOffsetX !== undefined) ctx.shadowOffsetX = style.shadowOffsetX;
    if (style.shadowOffsetY !== undefined) ctx.shadowOffsetY = style.shadowOffsetY;

    return () => ctx.restore();
}

/**
 * Draw with glow effect
 */
export function drawWithGlow(
    ctx: CanvasRenderingContext2D,
    color: string,
    glowIntensity: number,
    drawFn: () => void
): void {
    if (glowIntensity <= 0) {
        drawFn();
        return;
    }

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    drawFn();
    ctx.restore();
}

// =============================================================================
// Shape Drawing Utilities
// =============================================================================

/**
 * Draw a regular polygon
 */
export function drawPolygon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    sides: number,
    rotation = 0
): void {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + rotation;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
}

/**
 * Draw a star shape
 */
export function drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
    rotation = 0
): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * Math.PI * 2 + rotation;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
}

/**
 * Draw a gradient line along a path
 */
export function drawGradientPath(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    startColor: string,
    endColor: string,
    lineWidth: number
): void {
    if (points.length < 2) return;

    const start = points[0];
    const end = points[points.length - 1];

    const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}
