/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Link Animations Extension
 *
 * This extension enhances the visual representation of links (connections) between nodes
 * by adding configurable animations such as flowing particles, energy pulses, and glow effects.
 *
 * @module extensions/link-animations
 */

import { app } from '/scripts/app.js';
import {
    createLinkState,
    createTimingManager,
    LINK_DEFAULTS,
    type LinkState,
    type ComfyExtension,
    type ComfyApp,
    type LinkAnimationParams,
    type Color,
    type BezierCurve,
} from '@/core';
import { LinkEffects } from '@/effects/link-effects';
import { createPatternDesignerWindow } from '@/utils';

// =============================================================================
// Shared Resources
// =============================================================================

// Shared buffer to avoid allocation during Bezier curve calculations
// This avoids creating thousands of small objects per frame in the render loop
const SHARED_CURVE: BezierCurve = {
    x1: 0, y1: 0,
    cp1x: 0, cp1y: 0,
    cp2x: 0, cp2y: 0,
    x2: 0, y2: 0
};

// =============================================================================
// Settings Management
// =============================================================================

const SETTINGS_UPDATE_INTERVAL = 500;

/**
 * Cache for extension settings to avoid repeated costly lookups during the render loop.
 * The cache is updated throttled in the render loop.
 */
interface CachedSettings {
    // Animation Control
    animate: number;
    speed: number;
    direction: number;
    pauseDuringRender: boolean;

    // Visual Style
    intensity: number;
    quality: number;
    particleDensity: number;
    isStatic: boolean;

    // Markers
    markerEnabled: boolean;
    markerSize: number;

    // Cache State
    lastUpdate: number;
}

// Initialize with defaults.
// lastUpdate is set to a negative value to force an immediate update on first frame.
const settingsCache: CachedSettings = {
    animate: LINK_DEFAULTS['🔗 Enhanced Links.Animate'],
    speed: LINK_DEFAULTS['🔗 Enhanced Links.Animation.Speed'],
    direction: LINK_DEFAULTS['🔗 Enhanced Links.Direction'],
    pauseDuringRender: LINK_DEFAULTS['🔗 Enhanced Links.Pause.During.Render'],
    intensity: LINK_DEFAULTS['🔗 Enhanced Links.Glow.Intensity'],
    quality: LINK_DEFAULTS['🔗 Enhanced Links.Quality'],
    particleDensity: LINK_DEFAULTS['🔗 Enhanced Links.Particle.Density'],
    isStatic: LINK_DEFAULTS['🔗 Enhanced Links.Static.Mode'],
    markerEnabled: LINK_DEFAULTS['🔗 Enhanced Links.Marker.Enabled'],
    markerSize: LINK_DEFAULTS['🔗 Enhanced Links.Marker.Size'],
    lastUpdate: -SETTINGS_UPDATE_INTERVAL // Start ready to update
};

/**
 * Retrieves a setting value with a fallback to the default.
 */
function getSetting<T>(name: string): T {
    const defaultValue = LINK_DEFAULTS[name as keyof typeof LINK_DEFAULTS];
    return app.ui.settings.getSettingValue(name, defaultValue) as T;
}

/**
 * Updates the settings cache from the app settings.
 * This should be called periodically (e.g. every 500ms).
 */
function updateSettingsCache(timestamp: number) {
    // Update throttle
    if (timestamp - settingsCache.lastUpdate < SETTINGS_UPDATE_INTERVAL) return;

    settingsCache.animate = getSetting<number>('🔗 Enhanced Links.Animate');
    settingsCache.speed = getSetting<number>('🔗 Enhanced Links.Animation.Speed');
    settingsCache.direction = getSetting<number>('🔗 Enhanced Links.Direction');
    settingsCache.pauseDuringRender = getSetting<boolean>('🔗 Enhanced Links.Pause.During.Render');

    settingsCache.intensity = getSetting<number>('🔗 Enhanced Links.Glow.Intensity');
    settingsCache.quality = getSetting<number>('🔗 Enhanced Links.Quality');
    settingsCache.particleDensity = getSetting<number>('🔗 Enhanced Links.Particle.Density');
    settingsCache.isStatic = getSetting<boolean>('🔗 Enhanced Links.Static.Mode');
    settingsCache.markerEnabled = getSetting<boolean>('🔗 Enhanced Links.Marker.Enabled');
    settingsCache.markerSize = getSetting<number>('🔗 Enhanced Links.Marker.Size');

    settingsCache.lastUpdate = timestamp;
}

// =============================================================================
// Extension Implementation
// =============================================================================

const ext: ComfyExtension = {
    name: 'enhanced.link.animations',

    async setup(app: ComfyApp) {
        // Initialize State
        const state: LinkState = createLinkState();
        const timing = createTimingManager();

        /**
         * Main render loop for animations.
         * Driven by the timing manager's RAF loop.
         */
        function renderLoop(timestamp: number) {
            // Update timing
            timing.update(timestamp);

            // Update settings cache (throttled)
            updateSettingsCache(timestamp);

            // Check if animations should be active
            const isEnabled = settingsCache.animate > 0;
            const pauseDuringRender = settingsCache.pauseDuringRender;
            const isRendering = app.graph && (app.graph as any).is_rendering; // Accessing internal property

            if (!isEnabled || (isRendering && pauseDuringRender)) {
                if (state.isRunning) {
                    state.isRunning = false;
                    // Force one last redraw to clear/reset state if needed
                    app.graph?.setDirtyCanvas(true, true);
                }
                requestAnimationFrame(renderLoop);
                return;
            }

            state.isRunning = true;

            // Calculate delta time and phase
            const speed = settingsCache.speed;
            const direction = settingsCache.direction;
            const dt = (timestamp - state.lastFrame) / 1000;
            state.lastFrame = timestamp;

            // Update phase
            state.phase += dt * speed * direction;

            // Force redraw of canvas to trigger drawLink overrides
            // We use setDirtyCanvas(true, false) to redraw canvas but not recompute execution order
            app.graph?.setDirtyCanvas(true, false);

            requestAnimationFrame(renderLoop);
        }

        // Start the loop
        requestAnimationFrame(renderLoop);

        /**
         * Overridden drawLink method to inject our custom rendering.
         * This wraps the original LiteGraph execution.
         */
        const originalDrawLink = LGraphCanvas.prototype.drawLink;

        LGraphCanvas.prototype.drawLink = function (
            link_id: number,
            ctx: CanvasRenderingContext2D,
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            link_index: number,
            skip_border: boolean,
            fillStyle: string,
            strokeStyle: string,
            lineWidth: number
        ) {
            // Call original to draw the base wire
            // We might want to customize this later to hide the base wire if needed,
            // but for now, we draw on top of it.
            originalDrawLink.call(
                this,
                link_id,
                ctx,
                x1,
                y1,
                x2,
                y2,
                link_index,
                skip_border,
                fillStyle,
                strokeStyle,
                lineWidth
            );

            // Skip if animations disabled
            const animStyle = settingsCache.animate;
            if (animStyle === 0) return;

            // Get Settings from Cache
            const intensity = settingsCache.intensity;
            const quality = settingsCache.quality;
            const particleDensity = settingsCache.particleDensity;
            const direction = settingsCache.direction;
            const isStatic = settingsCache.isStatic;
            const markerEnabled = settingsCache.markerEnabled;
            const markerSize = settingsCache.markerSize;

            // Colors
            // In a real implementation we would parse the strokeStyle or use our palette settings
            // For now, let's derive from strokeStyle if possible, or use a default
            // This is a simplification; the full version parses the hex/canvas color
            const color: Color = strokeStyle as any || '#ffffff'; // Fallback

            // Prepare animation params
            const params: LinkAnimationParams = {
                phase: state.phase,
                quality,
                glowIntensity: intensity / 10,
                particleDensity,
                direction,
                isStatic
            };

            // Calculate Path (Simplified for now - assumes Bezier as LiteGraph default)
            // Ideally we should use the same path calculation as LiteGraph
            // LiteGraph typically uses bezier curves for links

            // Helper to sample the bezier curve
            // P(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // LiteGraph uses this heuristic for control points
            const cp_dist = dist * 0.25;
            const cp1x = x1 + cp_dist;
            const cp1y = y1;
            const cp2x = x2 - cp_dist;
            const cp2y = y2;

            // Populate shared curve object to avoid allocation
            SHARED_CURVE.x1 = x1;
            SHARED_CURVE.y1 = y1;
            SHARED_CURVE.cp1x = cp1x;
            SHARED_CURVE.cp1y = cp1y;
            SHARED_CURVE.cp2x = cp2x;
            SHARED_CURVE.cp2y = cp2y;
            SHARED_CURVE.x2 = x2;
            SHARED_CURVE.y2 = y2;

            // Render based on selected animation style
            // 9 = Classic Flow (default map)
            // This mapping should ideally come from a config/enum

            ctx.save();

            // Ensure we're drawing on top
            // ctx.globalCompositeOperation = 'screen'; // Optional: for glowy look

            if (animStyle === 9) { // Classic Flow
                LinkEffects.classicFlow(
                    ctx,
                    SHARED_CURVE,
                    dist,
                    params,
                    color,
                    markerEnabled ? markerSize : 0
                );
            } else if (animStyle === 8) { // Energy Surge
                LinkEffects.energySurge(
                    ctx,
                    SHARED_CURVE,
                    params,
                    color,
                    '#ffffff' // Secondary color placeholder
                );
            } else if (animStyle === 7) { // Quantum Flow
                LinkEffects.quantumFlow(
                    ctx,
                    SHARED_CURVE,
                    params,
                    color,
                    lineWidth
                );
            }

            ctx.restore();
        };

        // UI & Æmotion Studio About
        app.ui.settings.addSetting({
            id: '🔗 Enhanced Links.UI & Æmotion Studio About',
            name: '🔽 Info Panel',
            type: 'combo',
            options: [
                { value: 0, text: 'Closed Panel' },
                { value: 1, text: 'Open Panel' }
            ],
            defaultValue: LINK_DEFAULTS['🔗 Enhanced Links.UI & Æmotion Studio About'],
            onChange: (value: number) => {
                if (value === 1) {
                    document.body.appendChild(createPatternDesignerWindow());
                    // Reset setting back to 0 (Closed) after opening
                    setTimeout(() => app.ui.settings.setSettingValue('🔗 Enhanced Links.UI & Æmotion Studio About', 0), 100);
                }
            }
        });

        console.log('[EnhancedLinks] Extension registered and ready.');
    },
};

app.registerExtension(ext);
