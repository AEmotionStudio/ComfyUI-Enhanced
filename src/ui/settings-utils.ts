/**
 * Settings utility functions for the ComfyUI Enhanced Links and Nodes extension.
 * Provides callback factories and settings management helpers.
 *
 * @module ui/settings-utils
 */

import type { ComfyApp, LinkState, NodeState } from '@/core/types';

// =============================================================================
// Types
// =============================================================================

/** Callback function for settings changes */
export type SettingsCallback = (value: unknown) => void;

/** Options for creating force update callbacks */
export interface ForceUpdateOptions {
    /** Whether to dispatch mouse events to trigger redraws */
    dispatchMouseEvents?: boolean;
    /** Delay before second redraw (ms) */
    redrawDelay?: number;
}

// =============================================================================
// Callback Factories
// =============================================================================

/**
 * Creates a standard settings callback that forces canvas redraw.
 * Use this for most settings that affect visual appearance.
 *
 * @param state - Animation state object (LinkState or NodeState)
 * @param app - ComfyUI app reference
 * @returns Callback function for use in settings
 *
 * @example
 * app.ui.settings.addSetting({
 *   id: 'my.setting',
 *   type: 'slider',
 *   callback: createForceUpdateCallback(State, app),
 * });
 */
export function createForceUpdateCallback(
    state: LinkState | NodeState,
    app: ComfyApp
): SettingsCallback {
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
 * Creates a settings callback with mouse event dispatch.
 * Use this for style changes that need more aggressive redraws.
 *
 * @param state - Animation state object
 * @param app - ComfyUI app reference
 * @param options - Optional configuration
 * @returns Callback function for use in settings
 */
export function createStyleChangeCallback(
    state: LinkState | NodeState,
    app: ComfyApp,
    options: ForceUpdateOptions = {}
): SettingsCallback {
    const { dispatchMouseEvents = true, redrawDelay = 0 } = options;

    return () => {
        state.forceUpdate = true;
        state.forceRedraw = true;

        if (app.graph && app.graph.canvas) {
            const canvas = app.graph.canvas;
            canvas.dirty_canvas = true;
            canvas.dirty_bgcanvas = true;
            canvas.draw(true, true);

            if (dispatchMouseEvents && canvas._canvas) {
                // Dispatch mouse events to trigger full redraws
                canvas._canvas.dispatchEvent(new MouseEvent('mousemove'));
                canvas._canvas.dispatchEvent(new MouseEvent('mousedown'));
                canvas._canvas.dispatchEvent(new MouseEvent('mouseup'));
            }

            // Optional delayed redraw for complex changes
            if (redrawDelay > 0) {
                requestAnimationFrame(() => {
                    canvas.draw(true, true);
                });
            }
        }
    };
}

/**
 * Creates a callback that also resets animation state.
 * Use this for settings that change animation style.
 *
 * @param state - Animation state object
 * @param app - ComfyUI app reference
 * @returns Callback function for use in settings
 */
export function createAnimationResetCallback(
    state: LinkState | NodeState,
    app: ComfyApp
): SettingsCallback {
    return () => {
        state.forceUpdate = true;
        state.forceRedraw = true;
        state.lastAnimStyle = null;

        if (app.graph && app.graph.canvas) {
            const canvas = app.graph.canvas;
            canvas.dirty_canvas = true;
            canvas.dirty_bgcanvas = true;

            // Force multiple redraws for animation style changes
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
// Settings Helpers
// =============================================================================

/**
 * Applies default settings if they haven't been set yet.
 *
 * @param defaults - Object mapping setting IDs to default values
 * @param app - ComfyUI app reference
 */
export function applyDefaultSettings(
    defaults: Record<string, unknown>,
    app: ComfyApp
): void {
    try {
        const entries = Object.entries(defaults);

        for (const [key, value] of entries) {
            const setting = app.ui.settings.items.find((s) => s.id === key);

            if (setting && app.ui.settings.getSettingValue(key) === undefined) {
                app.ui.settings.setSettingValue(key, value);

                // Call the callback if it exists to ensure UI updates
                if (setting.callback) {
                    setting.callback(value);
                }
            }
        }

        // Force a canvas update after applying all defaults
        if (app.graph && app.graph.canvas) {
            app.graph.canvas.dirty_canvas = true;
            app.graph.canvas.dirty_bgcanvas = true;
            app.graph.canvas.draw(true, true);
        }
    } catch (error) {
        console.warn('Error applying default settings:', error);
    }
}

/**
 * Gets a setting value with type safety.
 *
 * @param app - ComfyUI app reference
 * @param id - Setting ID
 * @param defaultValue - Default value if setting not found
 * @returns The setting value
 */
export function getSetting<T>(app: ComfyApp, id: string, defaultValue: T): T {
    const val = app.ui.settings.getSettingValue(id);
    return val === undefined ? defaultValue : (val as T);
}

/**
 * Checks if a setting has been modified from its default.
 *
 * @param app - ComfyUI app reference
 * @param id - Setting ID
 * @param defaultValue - The default value to compare against
 * @returns True if the setting differs from the default
 */
export function isSettingModified<T>(
    app: ComfyApp,
    id: string,
    defaultValue: T
): boolean {
    const currentValue = app.ui.settings.getSettingValue(id, defaultValue);
    return currentValue !== defaultValue;
}
