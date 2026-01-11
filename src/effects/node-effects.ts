/**
 * Node animation effects.
 * These functions render visual effects around nodes in ComfyUI.
 *
 * @module effects/node-effects
 */

import type { ComfyNode } from '@/core/types';
import type { NodeEffectSettings } from './types';
import { withAlpha } from '@/utils/colors';
import {
    isEffectivelyStatic,
    calculateGlowRadius,
    calculateBreatheScale,
    calculateParticlePosition,
    calculateBlinkFactor,
} from './types';

// =============================================================================
// Shared Drawing Functions
// =============================================================================

/**
 * Draw a hover outline around a selected/hovered node.
 */
export function drawHoverOutline(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings
): void {
    if (!settings.colors.showHover) return;
    if (!node.selected && !node.mouseOver) return;

    const { hoverColor } = settings.colors;
    const { glowIntensity } = settings.quality;
    const outlineGlowSize = 15 * glowIntensity;

    ctx.save();
    ctx.shadowColor = withAlpha(hoverColor, 0.5);
    ctx.shadowBlur = node.selected ? outlineGlowSize * 1.5 : outlineGlowSize;
    ctx.strokeStyle = withAlpha(hoverColor, 0.7);
    ctx.lineWidth = 2;
    ctx.strokeRect(-node.size[0] / 2, -node.size[1] / 2, node.size[0], node.size[1]);
    ctx.restore();
}

/**
 * Draw the base glow effect for gentle pulse style.
 */
export function drawPulseGlow(
    ctx: CanvasRenderingContext2D,
    glowRadius: number,
    breatheScale: number,
    intensity: number,
    settings: NodeEffectSettings
): void {
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, quality } = settings.quality;
    const modifiedIntensity = intensity * 0.75;
    const pulseScale = 0.4 + 0.4 * breatheScale * modifiedIntensity;

    // Inner glow gradient
    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulseScale);
    const innerAlpha = 0.2 * glowIntensity * (0.5 + breatheScale * 0.5);
    innerGlow.addColorStop(0, withAlpha('#ffffff', Math.min(innerAlpha + 0.15, 1)));
    innerGlow.addColorStop(0.3, withAlpha(primary, innerAlpha));
    innerGlow.addColorStop(0.7, withAlpha(secondary, innerAlpha * 0.6));
    innerGlow.addColorStop(1, withAlpha(accent, 0));

    // Outer glow gradient
    const outerGlow = ctx.createRadialGradient(
        0,
        0,
        glowRadius * 0.6 * pulseScale,
        0,
        0,
        glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale
    );
    const outerAlpha = 0.1 * glowIntensity * (0.5 + breatheScale * 0.5);
    outerGlow.addColorStop(0, withAlpha(secondary, outerAlpha));
    outerGlow.addColorStop(0.6, withAlpha(accent, outerAlpha * 0.5));
    outerGlow.addColorStop(1, withAlpha(accent, 0));

    // Draw inner glow
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = innerGlow;
    ctx.globalAlpha = Math.min(0.2 + Math.abs(breatheScale) * 0.3 + glowIntensity * 0.2, 1);
    ctx.fill();

    // Draw outer glow
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.globalAlpha = Math.min(0.15 + Math.abs(breatheScale) * 0.2 + glowIntensity * 0.15, 1);
    ctx.fill();

    // Quality-based shadow
    if (quality > 1) {
        ctx.shadowColor = withAlpha(secondary, 0.3);
        ctx.shadowBlur = 10 * glowIntensity * (quality * 0.5);
    }
}

/**
 * Draw particles around a node.
 */
export function drawParticles(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string
): void {
    const { particles, quality, animation } = settings;
    if (!particles.showParticles) return;

    const isStatic = isEffectivelyStatic(animation);
    const glowRadius = calculateGlowRadius(node, quality);
    const baseParticleCount = 8 + quality.quality * 2;
    const particleCount = Math.floor(baseParticleCount * particles.density);

    for (let i = 0; i < particleCount; i++) {
        const position = calculateParticlePosition(i, particleCount, particleTime, glowRadius, {
            particleSpeed: particles.speed,
            particleIntensity: particles.intensity,
            isStatic,
            phase: animation.phase,
            quality: quality.quality,
        });

        const baseParticleSize = (4 + quality.quality) * quality.animationSize * particles.size;
        const particleSize = baseParticleSize * position.sizeFactor;

        const particleColor = getParticleColor(i, particleTime * particles.speed, particleCount);

        // Particle glow gradient
        const particleGlow = ctx.createRadialGradient(
            position.x,
            position.y,
            0,
            position.x,
            position.y,
            particleSize * 2.0
        );
        particleGlow.addColorStop(0, withAlpha(particleColor, 0.8 * particles.glowIntensity));
        particleGlow.addColorStop(0.4, withAlpha(particleColor, 0.4 * particles.glowIntensity));
        particleGlow.addColorStop(1, withAlpha(particleColor, 0));

        const blinkFactor = calculateBlinkFactor(i, particleTime, particles.speed, isStatic);
        const particleAlpha = Math.min(blinkFactor, 1) * particles.glowIntensity;

        // Draw outer glow
        ctx.beginPath();
        ctx.arc(position.x, position.y, particleSize * 2.0, 0, Math.PI * 2);
        ctx.fillStyle = particleGlow;
        ctx.globalAlpha = particleAlpha * 0.8;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(position.x, position.y, particleSize * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = Math.min(particleAlpha * 1.5, 1);
        ctx.fill();
    }
}

// =============================================================================
// Effect Renderers
// =============================================================================

/**
 * Gentle Pulse animation effect.
 * Creates a soft, breathing glow with firefly-like particles.
 */
export function gentlePulse(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string
): void {
    const isStatic = isEffectivelyStatic(settings.animation);
    const glowRadius = calculateGlowRadius(node, settings.quality);
    const breatheScale = calculateBreatheScale(
        settings.animation.phase,
        settings.animation.direction,
        settings.animation.animSpeed,
        isStatic
    );

    ctx.save();
    ctx.translate(node.size[0] / 2, node.size[1] / 2);

    // Draw hover outline
    drawHoverOutline(ctx, node, settings);

    // Draw glow effects (skip if particles only mode)
    if (!node.particlesOnly) {
        drawPulseGlow(ctx, glowRadius, breatheScale, settings.animation.intensity, settings);
    }

    // Draw particles
    drawParticles(ctx, node, settings, particleTime, getParticleColor);

    // Clean up
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
}

/**
 * Neon Nexus animation effect.
 * Creates electric, neon-style glow with geometric patterns.
 */
export function neonNexus(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string
): void {
    const isStatic = isEffectivelyStatic(settings.animation);
    const glowRadius = calculateGlowRadius(node, settings.quality);
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, quality } = settings.quality;
    const { phase, animSpeed, direction, intensity } = settings.animation;

    ctx.save();
    ctx.translate(node.size[0] / 2, node.size[1] / 2);

    // Draw hover outline
    drawHoverOutline(ctx, node, settings);

    // Neon-specific effects
    if (!node.particlesOnly) {
        const neonPhase = isStatic ? phase : phase * 0.5 * direction * animSpeed;

        // Electric glow effect
        const electricGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        const electricAlpha = 0.3 * glowIntensity * (0.6 + Math.sin(neonPhase) * 0.4);
        electricGlow.addColorStop(0, withAlpha(primary, electricAlpha));
        electricGlow.addColorStop(0.5, withAlpha(secondary, electricAlpha * 0.5));
        electricGlow.addColorStop(1, withAlpha(accent, 0));

        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = electricGlow;
        ctx.globalAlpha = intensity * 0.8;
        ctx.fill();

        // Draw hexagonal pattern for neon effect
        if (quality > 1) {
            const hexSize = glowRadius * 0.3;
            const hexCount = quality + 2;
            ctx.strokeStyle = withAlpha(primary, 0.3 * glowIntensity);
            ctx.lineWidth = 1;

            for (let i = 0; i < hexCount; i++) {
                const hexAngle = (i / hexCount) * Math.PI * 2 + neonPhase * 0.3;
                const hexDist = glowRadius * 0.6 * (1 + Math.sin(neonPhase + i) * 0.2);

                ctx.save();
                ctx.translate(Math.cos(hexAngle) * hexDist, Math.sin(hexAngle) * hexDist);
                ctx.rotate(hexAngle + neonPhase * 0.5);

                ctx.beginPath();
                for (let j = 0; j < 6; j++) {
                    const angle = (j / 6) * Math.PI * 2;
                    const x = Math.cos(angle) * hexSize;
                    const y = Math.sin(angle) * hexSize;
                    j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.globalAlpha = 0.2 + Math.sin(neonPhase + i * 0.5) * 0.1;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    // Draw particles
    drawParticles(ctx, node, settings, particleTime, getParticleColor);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
}

/**
 * Cosmic Ripple animation effect.
 * Creates expanding ring effects with cosmic colors.
 */
export function cosmicRipple(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string
): void {
    const isStatic = isEffectivelyStatic(settings.animation);
    const glowRadius = calculateGlowRadius(node, settings.quality);
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, quality } = settings.quality;
    const { phase, animSpeed, intensity } = settings.animation;

    ctx.save();
    ctx.translate(node.size[0] / 2, node.size[1] / 2);

    // Draw hover outline
    drawHoverOutline(ctx, node, settings);

    // Cosmic ripple effects
    if (!node.particlesOnly) {
        const ripplePhase = isStatic ? phase : phase * animSpeed;
        const rippleCount = quality + 2;

        for (let i = 0; i < rippleCount; i++) {
            const rippleProgress = ((ripplePhase * 0.25 + i / rippleCount) % 1);
            const rippleRadius = glowRadius * 0.3 + glowRadius * 0.9 * rippleProgress;
            const rippleAlpha = (1 - rippleProgress) * 0.4 * glowIntensity * intensity;

            ctx.beginPath();
            ctx.arc(0, 0, rippleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = withAlpha(
                i % 3 === 0 ? primary : i % 3 === 1 ? secondary : accent,
                rippleAlpha
            );
            ctx.lineWidth = 2 * (1 - rippleProgress);
            ctx.stroke();
        }

        // Central glow
        const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * 0.4);
        centerGlow.addColorStop(0, withAlpha(primary, 0.4 * glowIntensity));
        centerGlow.addColorStop(1, withAlpha(accent, 0));

        ctx.beginPath();
        ctx.arc(0, 0, glowRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = centerGlow;
        ctx.globalAlpha = intensity * 0.6;
        ctx.fill();
    }

    // Draw particles
    drawParticles(ctx, node, settings, particleTime, getParticleColor);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
}

/**
 * Flower of Life animation effect.
 * Creates sacred geometry patterns with overlapping circles.
 */
export function flowerOfLife(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string
): void {
    const isStatic = isEffectivelyStatic(settings.animation);
    const glowRadius = calculateGlowRadius(node, settings.quality);
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, quality } = settings.quality;
    const { phase, animSpeed, direction, intensity } = settings.animation;

    ctx.save();
    ctx.translate(node.size[0] / 2, node.size[1] / 2);

    // Draw hover outline
    drawHoverOutline(ctx, node, settings);

    // Flower of life pattern
    if (!node.particlesOnly) {
        const flowerPhase = isStatic ? phase : phase * 0.3 * direction * animSpeed;
        const petalRadius = glowRadius * 0.25;
        const petalCount = 6;

        ctx.save();
        ctx.rotate(flowerPhase * 0.5);

        // Central flower pattern
        for (let layer = 0; layer < quality; layer++) {
            const layerRadius = petalRadius * (1 + layer * 0.8);
            const layerAlpha = 0.3 * glowIntensity * (1 - layer * 0.2) * intensity;

            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const x = Math.cos(angle) * layerRadius;
                const y = Math.sin(angle) * layerRadius;

                ctx.beginPath();
                ctx.arc(x, y, petalRadius, 0, Math.PI * 2);
                ctx.strokeStyle = withAlpha(
                    layer % 3 === 0 ? primary : layer % 3 === 1 ? secondary : accent,
                    layerAlpha
                );
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        // Central circle
        ctx.beginPath();
        ctx.arc(0, 0, petalRadius, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(primary, 0.4 * glowIntensity * intensity);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Background glow
        const bgGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        bgGlow.addColorStop(0, withAlpha(primary, 0.15 * glowIntensity));
        bgGlow.addColorStop(0.5, withAlpha(secondary, 0.08 * glowIntensity));
        bgGlow.addColorStop(1, withAlpha(accent, 0));

        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = bgGlow;
        ctx.globalAlpha = intensity * 0.5;
        ctx.fill();
    }

    // Draw particles
    drawParticles(ctx, node, settings, particleTime, getParticleColor);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
}

// =============================================================================
// Exports
// =============================================================================

/** Map of all node animation effects */
export const NodeEffects = {
    gentlePulse,
    neonNexus,
    cosmicRipple,
    flowerOfLife,
};

/**
 * Get an effect by style number.
 */
export function getNodeEffect(style: number): typeof gentlePulse {
    switch (style) {
        case 1:
            return gentlePulse;
        case 2:
            return neonNexus;
        case 3:
            return cosmicRipple;
        case 4:
            return flowerOfLife;
        default:
            return gentlePulse;
    }
}
