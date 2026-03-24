/**
 * Context menu extensions for ComfyUI nodes.
 * Adds animation-related options to node right-click menus.
 *
 * @module ui/context-menu
 */

import type { ComfyNode, ComfyApp } from '@/core/types';
import { NODE_ANIMATION_OPTIONS } from './settings';

// =============================================================================
// Types
// =============================================================================

/** Menu option definition */
export interface MenuOption {
    /** Display text */
    content: string;
    /** Whether this is a submenu */
    has_submenu?: boolean;
    /** Whether this is disabled */
    disabled?: boolean;
    /** Whether this option is checked */
    checked?: boolean;
    /** Callback when selected */
    callback?: () => void;
    /** Submenu options */
    submenu?: {
        options: MenuOption[];
    };
}

/** Context menu configuration */
export interface ContextMenuConfig {
    /** Whether to add separator before */
    separator?: boolean;
    /** Menu options to add */
    options: MenuOption[];
}

// =============================================================================
// Animation Style Menu
// =============================================================================

/**
 * Creates menu options for selecting node animation style.
 */
export function createAnimationStyleMenu(
    node: ComfyNode,
    onStyleChange: (style: number) => void
): MenuOption {
    const currentStyle = node.animationStyle ?? 0;

    return {
        content: '🎨 Animation Style',
        has_submenu: true,
        submenu: {
            options: NODE_ANIMATION_OPTIONS.map((option) => ({
                content: option.text,
                checked: currentStyle === option.value,
                callback: () => {
                    node.animationStyle = option.value;
                    onStyleChange(option.value);
                },
            })),
        },
    };
}

/**
 * Creates menu option for toggling particles-only mode.
 */
export function createParticlesOnlyMenu(
    node: ComfyNode,
    onToggle: () => void
): MenuOption {
    return {
        content: '🌠 Particles Only',
        checked: node.particlesOnly,
        callback: () => {
            node.particlesOnly = !node.particlesOnly;
            onToggle();
        },
    };
}

/**
 * Creates menu option for toggling completion animation.
 */
export function createCompletionAnimationMenu(
    node: ComfyNode,
    disabledNodes: Set<number>,
    onToggle: () => void
): MenuOption {
    const isDisabled = disabledNodes.has(node.id);

    return {
        content: '🎆 Animate on Completion',
        checked: !isDisabled,
        callback: () => {
            if (isDisabled) {
                disabledNodes.delete(node.id);
            } else {
                disabledNodes.add(node.id);
            }
            onToggle();
        },
    };
}

// =============================================================================
// Menu Injection
// =============================================================================

/**
 * Injects animation options into a node's context menu.
 *
 * @param existingOptions - Current menu options array
 * @param node - The node being right-clicked
 * @param config - Animation menu configuration
 * @returns Modified options array
 */
export function injectAnimationMenu(
    existingOptions: MenuOption[],
    node: ComfyNode,
    config: {
        onStyleChange: (style: number) => void;
        onParticlesToggle: () => void;
        onCompletionToggle: () => void;
        disabledCompletionNodes: Set<number>;
    }
): MenuOption[] {
    const animationOptions: MenuOption[] = [
        // Separator
        { content: '', disabled: true },

        // Animation style submenu
        createAnimationStyleMenu(node, config.onStyleChange),

        // Particles only toggle
        createParticlesOnlyMenu(node, config.onParticlesToggle),

        // Completion animation toggle
        createCompletionAnimationMenu(
            node,
            config.disabledCompletionNodes,
            config.onCompletionToggle
        ),
    ];

    return [...existingOptions, ...animationOptions];
}

// =============================================================================
// Menu Builder
// =============================================================================

/**
 * Builds a complete context menu configuration for a node.
 */
export function buildNodeContextMenu(
    node: ComfyNode,
    app: ComfyApp,
    state: {
        disabledCompletionNodes: Set<number>;
    }
): ContextMenuConfig {
    const triggerRedraw = () => {
        if (app.graph && app.graph.canvas) {
            app.graph.canvas.dirty_canvas = true;
            app.graph.canvas.draw(true, true);
        }
    };

    return {
        separator: true,
        options: [
            createAnimationStyleMenu(node, triggerRedraw),
            createParticlesOnlyMenu(node, triggerRedraw),
            createCompletionAnimationMenu(
                node,
                state.disabledCompletionNodes,
                triggerRedraw
            ),
        ],
    };
}
