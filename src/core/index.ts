/**
 * Central export point for all core utilities.
 * Import from this file to get access to all shared functionality.
 *
 * @module core
 *
 * @example
 * import { PHI, hex2Hsl, createLinkState } from '@/core';
 */

// Configuration constants
export {
    PHI,
    SACRED,
    ANIMATION,
    CONFIG,
    LINK_DEFAULTS,
    NODE_DEFAULTS,
    type LinkSettingKey,
    type NodeSettingKey,
    type SettingKey,
} from './config';

// State management
export {
    createLinkState,
    createNodeState,
    resetLinkState,
    resetNodeState,
    markForUpdate,
    clearUpdateFlags,
} from './state';

// Timing utilities
export {
    createTimingManager,
    createAnimationController,
    createParticleController,
    createAnimationLoop,
    throttleRAF,
    type TimingState,
    type AnimationControllerState,
    type ParticleControllerState,
} from './timing';

// Type definitions
export type {
    // Color types
    HexColor,
    RgbaColor,
    HslColor,
    Color,
    ColorScheme,
    ColorMode,
    ParticleColorMode,

    // Link types
    LinkStyle,
    MarkerShape,
    MarkerEffect,
    LinkAnimationStyle,
    LinkAnimationParams,

    // Node types
    NodeAnimationStyle,
    NodeAnimationParams,
    NodeAnimationStyleName,

    // Geometry types
    Point,
    Vector2D,

    // State types
    BaseAnimationState,
    LinkState,
    NodeState,

    // Renderer types
    LinkRenderer,
    MarkerShapeRenderer,

    // ComfyUI types
    ComfyNode,
    ComfyApp,
    ComfyGraph,
    ComfyCanvas,
    ComfyUI,
    ComfySetting,
    ComfySettings,
    ComfyExtension,
    ComfyAPI,
} from './types';
