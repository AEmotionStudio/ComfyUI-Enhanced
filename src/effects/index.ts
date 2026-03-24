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

// Animated link renderers
export {
    renderAnimatedStyle,
    renderSacredFlow,
    renderCrystalStream,
    renderQuantumField,
    renderCosmicWeave,
    renderEnergyPulse,
    renderDNAHelix,
    renderLavaFlow,
    renderStellarPlasma,
    renderClassicFlow,
    type RenderItem,
} from './animated-renderers';

// Static link renderers
export {
    renderStaticStyle,
} from './static-renderers';

// Legacy link effects (kept for backwards compatibility)
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
