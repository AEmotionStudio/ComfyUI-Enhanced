/**
 * Central export for all animation effects.
 *
 * @module effects
 */

// Effect types
export type {
    AnimationParams,
    QualitySettings,
    ParticleSettings,
    ColorSettings,
    NodeEffectSettings,
    AnimationEffect,
    NodeAnimationStyleName,
} from './types';

export {
    isEffectivelyStatic,
    getScaledTime,
    calculateGlowRadius,
    calculateBreatheScale,
    calculateParticlePosition,
    calculateBlinkFactor,
} from './types';

// Node effects
export {
    gentlePulse,
    neonNexus,
    cosmicRipple,
    flowerOfLife,
    NodeEffects,
    getNodeEffect,
    drawHoverOutline,
    drawPulseGlow,
    drawParticles,
} from './node-effects';

// Link effects
export type {
    LinkAnimationParams,
    AnimatedLinkPoint,
} from './link-effects';

export {
    calculateFlowPositions,
    calculateWaveOffset,
    calculatePulseEffect,
    drawFlowMarker,
    drawEnergyParticles,
    drawGlowTrail,
    classicFlowAnimation,
    energySurgeAnimation,
    quantumFlowAnimation,
    LinkEffects,
} from './link-effects';
