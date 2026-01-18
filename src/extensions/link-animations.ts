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
} from '@/core';
import { LinkEffects } from '@/effects/link-effects';
import { createPatternDesignerWindow } from '@/utils';

// =============================================================================
// Settings Management
// =============================================================================

/**
 * Retrieves a setting value with a fallback to the default.
 */
function getSetting<T>(name: string): T {
    const defaultValue = LINK_DEFAULTS[name as keyof typeof LINK_DEFAULTS];
    return app.ui.settings.getSettingValue(name, defaultValue) as T;
}

interface SettingsCache {
    animStyle: number;
    intensity: number;
    quality: number;
    particleDensity: number;
    direction: number;
    isStatic: boolean;
    markerEnabled: boolean;
    markerSize: number;
    pauseDuringRender: boolean;
    speed: number;
}

// Cache settings to avoid repeated lookups per link per frame
const settingsCache: SettingsCache = {
    animStyle: 0,
    intensity: 0,
    quality: 0,
    particleDensity: 0,
    direction: 0,
    isStatic: false,
    markerEnabled: false,
    markerSize: 0,
    pauseDuringRender: false,
    speed: 0
};

function updateSettingsCache() {
    settingsCache.animStyle = getSetting<number>('🔗 Enhanced Links.Animate');
    settingsCache.intensity = getSetting<number>('🔗 Enhanced Links.Glow.Intensity');
    settingsCache.quality = getSetting<number>('🔗 Enhanced Links.Quality');
    settingsCache.particleDensity = getSetting<number>('🔗 Enhanced Links.Particle.Density');
    settingsCache.direction = getSetting<number>('🔗 Enhanced Links.Direction');
    settingsCache.isStatic = getSetting<boolean>('🔗 Enhanced Links.Static.Mode');
    settingsCache.markerEnabled = getSetting<boolean>('🔗 Enhanced Links.Marker.Enabled');
    settingsCache.markerSize = getSetting<number>('🔗 Enhanced Links.Marker.Size');
    settingsCache.pauseDuringRender = getSetting<boolean>('🔗 Enhanced Links.Pause.During.Render');
    settingsCache.speed = getSetting<number>('🔗 Enhanced Links.Animation.Speed');
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

        // Initial population of cache
        updateSettingsCache();
        let lastSettingsUpdate = 0;

        /**
         * Main render loop for animations.
         * Driven by the timing manager's RAF loop.
         */
        function renderLoop(timestamp: number) {
            // Update settings cache every 500ms
            if (timestamp - lastSettingsUpdate > 500) {
                updateSettingsCache();
                lastSettingsUpdate = timestamp;
            }

            // Update timing
            timing.update(timestamp);

            // Check if animations should be active
            const isEnabled = settingsCache.animStyle > 0;
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
            const animStyle = settingsCache.animStyle;
            if (animStyle === 0) return;

            // Get Settings
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
            const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

            // LiteGraph uses this heuristic for control points
            const cp_dist = dist * 0.25;
            const cp1x = x1 + cp_dist;
            const cp1y = y1;
            const cp2x = x2 - cp_dist;
            const cp2y = y2;

            // Reusable buffer to avoid allocations in getAngle
            const _tmpPoint: [number, number] = [0, 0];

            const computeBezier = (t: number, out: [number, number]) => {
                const invT = 1 - t;
                const invT2 = invT * invT;
                const invT3 = invT2 * invT;
                const t2 = t * t;
                const t3 = t2 * t;

                out[0] = invT3 * x1 + 3 * invT2 * t * cp1x + 3 * invT * t2 * cp2x + t3 * x2;
                out[1] = invT3 * y1 + 3 * invT2 * t * cp1y + 3 * invT * t2 * cp2y + t3 * y2;
            };

            const getPoint = (t: number) => {
                const p: [number, number] = [0, 0];
                computeBezier(t, p);
                return p;
            };

            const getAngle = (t: number) => {
                const delta = 0.01;
                const t_prev = Math.max(0, t - delta);
                const t_next = Math.min(1, t + delta);

                computeBezier(t_prev, _tmpPoint);
                const prevX = _tmpPoint[0];
                const prevY = _tmpPoint[1];

                computeBezier(t_next, _tmpPoint);
                const nextX = _tmpPoint[0];
                const nextY = _tmpPoint[1];

                return Math.atan2(nextY - prevY, nextX - prevX);
            };

            // Render based on selected animation style
            // 9 = Classic Flow (default map)
            // This mapping should ideally come from a config/enum

            ctx.save();

            // Ensure we're drawing on top
            // ctx.globalCompositeOperation = 'screen'; // Optional: for glowy look

            if (animStyle === 9) { // Classic Flow
                LinkEffects.classicFlow(
                    ctx,
                    getPoint,
                    getAngle,
                    dist,
                    params,
                    color,
                    markerEnabled ? markerSize : 0
                );
            } else if (animStyle === 8) { // Energy Surge
                LinkEffects.energySurge(
                    ctx,
                    getPoint,
                    params,
                    color,
                    '#ffffff' // Secondary color placeholder
                );
            } else if (animStyle === 7) { // Quantum Flow
                LinkEffects.quantumFlow(
                    ctx,
                    getPoint,
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
