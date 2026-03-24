/**
 * Settings definitions and registration utilities for ComfyUI extension.
 * Provides type-safe settings configuration and registration helpers.
 *
 * @module ui/settings
 */

import type { ComfyApp, LinkState, NodeState } from '@/core/types';
import { LINK_DEFAULTS, NODE_DEFAULTS } from '@/core/config';

// =============================================================================
// Types
// =============================================================================

/** Base setting type with common properties */
export interface BaseSetting {
    /** Unique identifier for the setting */
    id: string;
    /** Display name for the setting */
    name: string;
    /** Optional tooltip description */
    tooltip?: string;
    /** Category for grouping in settings panel */
    category?: string[];
}

/** Combo/dropdown setting */
export interface ComboSetting extends BaseSetting {
    type: 'combo';
    options: Array<{ value: unknown; text: string }>;
    defaultValue: unknown;
}

/** Slider setting */
export interface SliderSetting extends BaseSetting {
    type: 'slider';
    min: number;
    max: number;
    step: number;
    defaultValue: number;
}

/** Color picker setting */
export interface ColorSetting extends BaseSetting {
    type: 'color';
    defaultValue: string;
}

/** Boolean toggle setting */
export interface BooleanSetting extends BaseSetting {
    type: 'boolean';
    defaultValue: boolean;
}

/** Button setting (info/action) */
export interface ButtonSetting extends BaseSetting {
    type: 'button';
}

/** Union of all setting types */
export type SettingDefinition =
    | ComboSetting
    | SliderSetting
    | ColorSetting
    | BooleanSetting
    | ButtonSetting;

/** Callback type for settings changes */
export type SettingCallback = (value: unknown) => void;

// =============================================================================
// Link Animation Styles
// =============================================================================

/** Link animation style options */
export const LINK_ANIMATION_OPTIONS = [
    { value: 0, text: '⭘️ Off' },
    { value: 9, text: '🔄 Classic Flow' },
    { value: 1, text: '✨ Sacred Flow' },
    { value: 2, text: '💎 Crystal Stream' },
    { value: 3, text: '🔬 Quantum Field' },
    { value: 4, text: '🌌 Cosmic Weave' },
    { value: 5, text: '⚡ Energy Pulse' },
    { value: 6, text: '🧬 DNA Helix' },
    { value: 7, text: '🌋 Lava Flow' },
    { value: 8, text: '🌠 Stellar Plasma' },
] as const;

/** Link style options */
export const LINK_STYLE_OPTIONS = [
    { value: 'spline', text: '🔗 Spline (Default)' },
    { value: 'straight', text: '📏 Straight' },
    { value: 'linear', text: '📐 Linear (Right Angle)' },
    { value: 'hidden', text: '👻 Hidden' },
    { value: 'dotted', text: '⚪ Dotted' },
    { value: 'dashed', text: '➖ Dashed' },
    { value: 'double', text: '= Double' },
    { value: 'stepped', text: '📶 Stepped' },
    { value: 'zigzag', text: '⚡ Zigzag' },
    { value: 'rope', text: '🧵 Rope' },
    { value: 'glowpath', text: '✨ Glow Path' },
    { value: 'chain', text: '⛓️ Chain' },
    { value: 'pulse', text: '💓 Pulse' },
    { value: 'holographic', text: '🌈 Holographic' },
] as const;

/** Marker shape options */
export const MARKER_SHAPE_OPTIONS = [
    { value: 'none', text: '⭘️ None' },
    { value: 'arrow', text: '➤ Arrow' },
    { value: 'diamond', text: '◇ Diamond' },
    { value: 'circle', text: '● Circle' },
    { value: 'square', text: '■ Square' },
    { value: 'triangle', text: '▲ Triangle' },
    { value: 'star', text: '★ Star' },
    { value: 'heart', text: '♥ Heart' },
    { value: 'cross', text: '✚ Cross' },
    { value: 'hexagon', text: '⬡ Hexagon' },
    { value: 'flower', text: '✿ Flower' },
    { value: 'spiral', text: '🌀 Spiral' },
] as const;

// =============================================================================
// Node Animation Styles
// =============================================================================

/** Node animation style options */
export const NODE_ANIMATION_OPTIONS = [
    { value: 0, text: '⭘️ Off' },
    { value: 1, text: '💫 Gentle Pulse' },
    { value: 2, text: '⚡ Neon Nexus' },
    { value: 3, text: '🌌 Cosmic Ripple' },
    { value: 4, text: '✿ Flower of Life' },
] as const;

// =============================================================================
// Common Option Sets
// =============================================================================

/** Enabled/Disabled toggle */
export const ENABLED_DISABLED_OPTIONS = [
    { value: true, text: '✅ Enabled' },
    { value: false, text: '❌ Disabled' },
] as const;

/** Animated/Static toggle */
export const ANIMATED_STATIC_OPTIONS = [
    { value: false, text: '✨ Animated' },
    { value: true, text: '🖼️ Static' },
] as const;

/** Direction options */
export const DIRECTION_OPTIONS = [
    { value: 1, text: '➡️ Forward' },
    { value: -1, text: '⬅️ Reverse' },
] as const;

/** Color mode options */
export const COLOR_MODE_OPTIONS = [
    { value: 'default', text: '🎨 Default' },
    { value: 'custom', text: '🖌️ Custom' },
] as const;

/** Color scheme options */
export const COLOR_SCHEME_OPTIONS = [
    { value: 'default', text: '🎨 Original' },
    { value: 'saturated', text: '🌈 Saturated' },
    { value: 'vivid', text: '💥 Vivid' },
    { value: 'contrast', text: '⚡ High Contrast' },
    { value: 'bright', text: '☀️ Bright' },
    { value: 'muted', text: '🌙 Muted' },
] as const;

/** Quality options */
export const QUALITY_OPTIONS = [
    { value: 1, text: '🚀 Basic (Fast)' },
    { value: 2, text: '⚖️ Balanced' },
    { value: 3, text: '💎 Enhanced' },
] as const;

// =============================================================================
// Callback Factory
// =============================================================================

/**
 * Creates a standard force-update callback for settings.
 */
export function createForceUpdateCallback(
    state: LinkState | NodeState,
    app: ComfyApp
): SettingCallback {
    return () => {
        state.forceUpdate = true;
        state.forceRedraw = true;

        if (app.graph && app.graph.canvas) {
            app.graph.canvas.dirty_canvas = true;
            app.graph.canvas.dirty_bgcanvas = true;
            app.graph.canvas.draw(true, true);
        }
    };
}

/**
 * Creates an aggressive style-change callback with mouse events.
 */
export function createStyleChangeCallback(
    state: LinkState | NodeState,
    app: ComfyApp
): SettingCallback {
    return () => {
        state.forceUpdate = true;
        state.forceRedraw = true;

        if (app.graph && app.graph.canvas) {
            const canvas = app.graph.canvas;
            canvas.dirty_canvas = true;
            canvas.dirty_bgcanvas = true;
            canvas.draw(true, true);

            if (canvas._canvas) {
                canvas._canvas.dispatchEvent(new MouseEvent('mousemove'));
                canvas._canvas.dispatchEvent(new MouseEvent('mousedown'));
                canvas._canvas.dispatchEvent(new MouseEvent('mouseup'));
            }

            requestAnimationFrame(() => {
                canvas.draw(true, true);
            });
        }
    };
}

// =============================================================================
// Setting Registration Helpers
// =============================================================================

/**
 * Registers a setting with the ComfyUI settings system.
 */
export function registerSetting(
    app: ComfyApp,
    setting: SettingDefinition,
    callback?: SettingCallback
): void {
    const settingConfig: Record<string, unknown> = {
        id: setting.id,
        name: setting.name,
        type: setting.type,
    };

    if (setting.tooltip) {
        settingConfig.tooltip = setting.tooltip;
    }

    if (setting.category) {
        settingConfig.category = setting.category;
    }

    if ('options' in setting) {
        settingConfig.options = setting.options;
    }

    if ('defaultValue' in setting) {
        settingConfig.defaultValue = setting.defaultValue;
    }

    if ('min' in setting) {
        settingConfig.min = setting.min;
        settingConfig.max = setting.max;
        settingConfig.step = setting.step;
    }

    if (callback) {
        settingConfig.callback = callback;
    }

    app.ui.settings.addSetting(settingConfig);
}

/**
 * Gets a typed setting value with default fallback.
 */
export function getSettingValue<T>(
    app: ComfyApp,
    id: string,
    defaultValue: T
): T {
    const val = app.ui.settings.getSettingValue(id);
    return (val ?? defaultValue) as T;
}

/**
 * Sets a setting value.
 */
export function setSettingValue(
    app: ComfyApp,
    id: string,
    value: unknown
): void {
    app.ui.settings.setSettingValue(id, value);
}

// =============================================================================
// Preset Settings
// =============================================================================

/**
 * Get all link-related default values.
 */
export function getLinkDefaults(): typeof LINK_DEFAULTS {
    return LINK_DEFAULTS;
}

/**
 * Get all node-related default values.
 */
export function getNodeDefaults(): typeof NODE_DEFAULTS {
    return NODE_DEFAULTS;
}
