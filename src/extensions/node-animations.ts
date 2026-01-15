/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Node Animations Extension
 * 
 * This extension adds visual enhancements to nodes, including:
 * - Idle animations (breathing, pulsing)
 * - Selection highlights
 * - Execution state visualization (active/running nodes)
 * 
 * @module extensions/node-animations
 */

import { app } from '/scripts/app.js';
import {
    createNodeState,
    createTimingManager,
    NODE_DEFAULTS,
    type NodeState,
    type ComfyExtension,
    type ComfyApp,
    type ComfyNode,
    type NodeAnimationStyleName,
    type Color,
} from '@/core';
import { getNodeEffect } from '@/effects/node-effects';
import { createPatternDesignerWindow } from '@/utils';

// =============================================================================
// Settings
// =============================================================================

function getSetting<T>(name: string): T {
    const defaultValue = NODE_DEFAULTS[name as keyof typeof NODE_DEFAULTS];
    return app.ui.settings.getSettingValue(name, defaultValue) as T;
}

// =============================================================================
// Extension Implementation
// =============================================================================

const ext: ComfyExtension = {
    name: 'enhanced.node.animations',

    async setup(app: ComfyApp) {
        const state: NodeState = createNodeState();
        const timing = createTimingManager();

        // Animation Loop
        let isEnabled = true;
        let pauseDuringRender = true;
        let animStyle = 0;

        // Update settings every 500ms instead of every frame (60fps) to save resources
        let lastSettingsUpdate = 0;
        function updateSettingsCache() {
            isEnabled = getSetting<boolean>('📦 Enhanced Nodes.Animations.Enabled');
            pauseDuringRender = getSetting<boolean>('📦 Enhanced Nodes.Pause.During.Render');
            animStyle = getSetting<number>('📦 Enhanced Nodes.Animate');
        }

        function renderLoop(timestamp: number) {
            // Update settings cache occasionally
            if (timestamp - lastSettingsUpdate > 500) {
                updateSettingsCache();
                lastSettingsUpdate = timestamp;
            }

            timing.update(timestamp);

            const isRendering = app.graph && (app.graph as any).is_rendering;

            if (!isEnabled || (isRendering && pauseDuringRender)) {
                if (state.isRunning) {
                    state.isRunning = false;
                    app.graph?.setDirtyCanvas(true, true);
                }
                requestAnimationFrame(renderLoop);
                return;
            }

            state.isRunning = true;

            const speed = getSetting<number>('📦 Enhanced Nodes.Animation.Speed');
            const dt = (timestamp - state.lastFrame) / 1000;
            state.lastFrame = timestamp;
            state.phase += dt * speed;

            // Trigger redraw only if visible or needed
            app.graph?.setDirtyCanvas(true, false);
            requestAnimationFrame(renderLoop);
        }

        requestAnimationFrame(renderLoop);

        // =====================================================================
        // Canvas Overrides
        // =====================================================================

        const originalDrawNode = LGraphCanvas.prototype.drawNode;

        LGraphCanvas.prototype.drawNode = function (node: ComfyNode, ctx: CanvasRenderingContext2D) {
            // 1. Pre-render effects (Behind node)
            if (isEnabled && animStyle > 0 && state.isRunning) {
                // Determine effect type based on mapping
                const effectName: NodeAnimationStyleName =
                    animStyle === 1 ? 'gentlePulse' :
                        animStyle === 2 ? 'neonNexus' :
                            animStyle === 3 ? 'cosmicRipple' :
                                animStyle === 4 ? 'flowerOfLife' : 'gentlePulse';

                const effect = getNodeEffect(effectName as any);

                if (effect) {
                    const glowIntensity = getSetting<number>('📦 Enhanced Nodes.Glow.Intensity') || 1;
                    const glowSize = getSetting<number>('📦 Enhanced Nodes.Animation.Size') || 1;
                    const quality = getSetting<number>('📦 Enhanced Nodes.Quality') || 1;

                    // Active/Running state override
                    const isRunning = node.id === (app as any).runningNodeId;
                    const isSelected = this.selected_nodes && this.selected_nodes[node.id];

                    const primaryColor = isRunning ? '#00ff00' : (isSelected ? '#00ffff' : node.color || '#333');

                    ctx.save();
                    // @ts-ignore - handled by getNodeEffect
                    effect(
                        ctx,
                        node,
                        {
                            animation: { phase: state.phase, intensity: glowIntensity, direction: 1, animSpeed: 1, isStaticMode: false, isPaused: false },
                            quality: { quality, animationSize: glowSize, glowIntensity },
                            particles: { showParticles: true, density: 1, speed: 1, intensity: 1, size: 1, glowIntensity: 0.5 * glowIntensity },
                            colors: { primary: primaryColor as Color, secondary: '#ffffff', accent: primaryColor as Color, hoverColor: primaryColor as string, showHover: true }
                        },
                        state.phase,
                        () => primaryColor
                    );
                    ctx.restore();
                }
            }

            // 2. Render Node (Original)
            originalDrawNode.call(this, node, ctx);
        };

        // UI & Æmotion Studio About
        app.ui.settings.addSetting({
            id: '📦 Enhanced Nodes.UI & Æmotion Studio About',
            name: '🔽 Info Panel',
            type: 'combo',
            options: [
                { value: 0, text: 'Closed Panel' },
                { value: 1, text: 'Open Panel' }
            ],
            defaultValue: NODE_DEFAULTS['📦 Enhanced Nodes.UI & Æmotion Studio About'],
            onChange: (value: number) => {
                if (value === 1) {
                    document.body.appendChild(createPatternDesignerWindow());
                    // Reset setting back to 0 (Closed) after opening
                    setTimeout(() => app.ui.settings.setSettingValue('📦 Enhanced Nodes.UI & Æmotion Studio About', 0), 100);
                }
            }
        });

        console.log('[EnhancedNodes] Extension registered and ready.');
    }
};

app.registerExtension(ext);
