/**
 * Unit tests for state management
 */

import { describe, it, expect } from 'vitest';
import {
    createLinkState,
    createNodeState,
    resetLinkState,
    resetNodeState,
    markForUpdate,
    clearUpdateFlags,
} from '@/core/state';

describe('createLinkState', () => {
    it('should create a link state with default values', () => {
        const state = createLinkState();

        expect(state.isRunning).toBe(false);
        expect(state.phase).toBe(0);
        expect(state.lastFrame).toBeGreaterThan(0);
        expect(state.animationFrame).toBeNull();
        expect(state.particlePool).toBeInstanceOf(Map);
        expect(state.activeParticles).toBeInstanceOf(Set);
        expect(state.totalTime).toBe(0);
        expect(state.speedMultiplier).toBe(1);
        expect(state.linkPositions).toBeInstanceOf(Map);
        expect(state.lastNodePositions).toBeInstanceOf(Map);
        expect(state.staticPhase).toBeCloseTo(Math.PI / 4);
        expect(state.lastAnimStyle).toBeNull();
        expect(state.lastLinkStyle).toBeNull();
        expect(state.forceUpdate).toBe(false);
        expect(state.forceRedraw).toBe(false);
        expect(state.lastRenderState).toBeNull();
        expect(state.lastSettings).toBeNull();
    });

    it('should create independent state objects', () => {
        const state1 = createLinkState();
        const state2 = createLinkState();

        state1.phase = 1;
        state1.particlePool.set(1, 'test');

        expect(state2.phase).toBe(0);
        expect(state2.particlePool.size).toBe(0);
    });
});

describe('createNodeState', () => {
    it('should create a node state with default values', () => {
        const state = createNodeState();

        expect(state.isRunning).toBe(false);
        expect(state.phase).toBe(0);
        expect(state.particlePhase).toBe(0);
        expect(state.lastFrame).toBeGreaterThan(0);
        expect(state.lastRAFTime).toBe(0);
        expect(state.animationFrame).toBeNull();
        expect(state.nodeEffects).toBeInstanceOf(Map);
        expect(state.isAnimating).toBe(false);
        expect(state.frameSkipCount).toBe(0);
        expect(state.maxFrameSkips).toBe(3);
        expect(state.playCompletionAnimation).toBe(false);
        expect(state.completionPhase).toBe(0);
        expect(state.completingNodes).toBeInstanceOf(Set);
        expect(state.disabledCompletionNodes).toBeInstanceOf(Set);
        expect(state.primaryCompletionNode).toBeNull();
    });

    it('should create independent state objects', () => {
        const state1 = createNodeState();
        const state2 = createNodeState();

        state1.particlePhase = 1;
        state1.completingNodes.add(1);

        expect(state2.particlePhase).toBe(0);
        expect(state2.completingNodes.size).toBe(0);
    });
});

describe('resetLinkState', () => {
    it('should reset link state to initial values', () => {
        const state = createLinkState();

        // Modify state
        state.isRunning = true;
        state.phase = 5;
        state.totalTime = 100;
        state.particlePool.set(1, 'test');
        state.activeParticles.add('particle1');
        state.forceUpdate = true;
        state.forceRedraw = true;

        // Reset
        resetLinkState(state);

        expect(state.isRunning).toBe(false);
        expect(state.phase).toBe(0);
        expect(state.totalTime).toBe(0);
        expect(state.particlePool.size).toBe(0);
        expect(state.activeParticles.size).toBe(0);
        expect(state.forceUpdate).toBe(false);
        expect(state.forceRedraw).toBe(false);
    });

    it('should preserve object references', () => {
        const state = createLinkState();
        const originalPool = state.particlePool;
        const originalParticles = state.activeParticles;

        resetLinkState(state);

        expect(state.particlePool).toBe(originalPool);
        expect(state.activeParticles).toBe(originalParticles);
    });
});

describe('resetNodeState', () => {
    it('should reset node state to initial values', () => {
        const state = createNodeState();

        // Modify state
        state.isRunning = true;
        state.phase = 5;
        state.particlePhase = 3;
        state.playCompletionAnimation = true;
        state.completingNodes.add(1);
        state.completingNodes.add(2);
        state.primaryCompletionNode = 1;

        // Reset
        resetNodeState(state);

        expect(state.isRunning).toBe(false);
        expect(state.phase).toBe(0);
        expect(state.particlePhase).toBe(0);
        expect(state.playCompletionAnimation).toBe(false);
        expect(state.completingNodes.size).toBe(0);
        expect(state.primaryCompletionNode).toBeNull();
    });
});

describe('markForUpdate', () => {
    it('should set force update flags on link state', () => {
        const state = createLinkState();

        expect(state.forceUpdate).toBe(false);
        expect(state.forceRedraw).toBe(false);

        markForUpdate(state);

        expect(state.forceUpdate).toBe(true);
        expect(state.forceRedraw).toBe(true);
    });

    it('should set force update flags on node state', () => {
        const state = createNodeState();

        markForUpdate(state);

        expect(state.forceUpdate).toBe(true);
        expect(state.forceRedraw).toBe(true);
    });
});

describe('clearUpdateFlags', () => {
    it('should clear force update flags', () => {
        const state = createLinkState();
        state.forceUpdate = true;
        state.forceRedraw = true;

        clearUpdateFlags(state);

        expect(state.forceUpdate).toBe(false);
        expect(state.forceRedraw).toBe(false);
    });
});
