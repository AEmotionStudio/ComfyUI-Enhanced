/**
 * State management factories for the ComfyUI Enhanced Links and Nodes extension.
 * Provides state creation and management for link and node animations.
 *
 * @module core/state
 */

import type { LinkState, NodeState } from './types';

// =============================================================================
// Link State Factory
// =============================================================================

/**
 * Creates a new link animation state object.
 * Contains all state needed for link animation rendering.
 *
 * @returns Fresh link state object
 */
export function createLinkState(): LinkState {
    return {
        isRunning: false,
        phase: 0,
        lastFrame: performance.now(),
        animationFrame: null,
        particlePool: new Map(),
        activeParticles: new Set(),
        totalTime: 0,
        speedMultiplier: 1,
        linkPositions: new Map(),
        lastNodePositions: new Map(),
        staticPhase: Math.PI / 4,
        lastAnimStyle: null,
        lastLinkStyle: null,
        forceUpdate: false,
        forceRedraw: false,
        lastRenderState: null,
        lastSettings: null,
    };
}

// =============================================================================
// Node State Factory
// =============================================================================

/**
 * Creates a new node animation state object.
 * Contains all state needed for node animation rendering.
 *
 * @returns Fresh node state object
 */
export function createNodeState(): NodeState {
    return {
        isRunning: false,
        phase: 0,
        particlePhase: 0,
        lastFrame: performance.now(),
        lastRAFTime: 0,
        animationFrame: null,
        totalTime: 0,
        speedMultiplier: 1,
        staticPhase: Math.PI / 4,
        forceUpdate: false,
        forceRedraw: false,
        lastRenderState: null,
        nodeEffects: new Map(),
        isAnimating: false,
        frameSkipCount: 0,
        maxFrameSkips: 3,
        lastAnimStyle: null,
        particlePool: new Map(),
        activeParticles: new Set(),
        playCompletionAnimation: false,
        completionPhase: 0,
        completingNodes: new Set(),
        disabledCompletionNodes: new Set(),
        primaryCompletionNode: null,
    };
}

// =============================================================================
// State Reset Utilities
// =============================================================================

/**
 * Resets link state to initial values while preserving object references.
 *
 * @param state - Link state to reset
 */
export function resetLinkState(state: LinkState): void {
    state.isRunning = false;
    state.phase = 0;
    state.lastFrame = performance.now();
    state.animationFrame = null;
    state.particlePool.clear();
    state.activeParticles.clear();
    state.totalTime = 0;
    state.speedMultiplier = 1;
    state.linkPositions.clear();
    state.lastNodePositions.clear();
    state.staticPhase = Math.PI / 4;
    state.lastAnimStyle = null;
    state.lastLinkStyle = null;
    state.forceUpdate = false;
    state.forceRedraw = false;
    state.lastRenderState = null;
    state.lastSettings = null;
}

/**
 * Resets node state to initial values while preserving object references.
 *
 * @param state - Node state to reset
 */
export function resetNodeState(state: NodeState): void {
    state.isRunning = false;
    state.phase = 0;
    state.particlePhase = 0;
    state.lastFrame = performance.now();
    state.lastRAFTime = 0;
    state.animationFrame = null;
    state.totalTime = 0;
    state.speedMultiplier = 1;
    state.staticPhase = Math.PI / 4;
    state.forceUpdate = false;
    state.forceRedraw = false;
    state.lastRenderState = null;
    state.nodeEffects.clear();
    state.isAnimating = false;
    state.frameSkipCount = 0;
    state.maxFrameSkips = 3;
    state.lastAnimStyle = null;
    state.particlePool.clear();
    state.activeParticles.clear();
    state.playCompletionAnimation = false;
    state.completionPhase = 0;
    state.completingNodes.clear();
    state.disabledCompletionNodes.clear();
    state.primaryCompletionNode = null;
}

// =============================================================================
// State Utilities
// =============================================================================

/**
 * Marks the state for forced update on next frame.
 *
 * @param state - State object to mark
 */
export function markForUpdate(state: LinkState | NodeState): void {
    state.forceUpdate = true;
    state.forceRedraw = true;
}

/**
 * Clears force update flags from state.
 *
 * @param state - State object to clear
 */
export function clearUpdateFlags(state: LinkState | NodeState): void {
    state.forceUpdate = false;
    state.forceRedraw = false;
}
