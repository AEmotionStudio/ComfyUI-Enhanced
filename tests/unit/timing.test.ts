/**
 * Unit tests for timing utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createTimingManager,
    createAnimationController,
    createParticleController,
    createAnimationLoop,
    throttleRAF,
} from '@/core/timing';

describe('createTimingManager', () => {
    it('should create a timing manager with initial values', () => {
        const manager = createTimingManager();
        expect(manager.smoothDelta).toBe(0);
        expect(manager.frameCount).toBe(0);
        expect(manager.lastTime).toBeGreaterThan(0);
    });

    it('should update delta time on each call', () => {
        const manager = createTimingManager();
        const startTime = performance.now();

        // Simulate some time passing
        const delta1 = manager.update(startTime + 16);
        expect(delta1).toBeGreaterThan(0);
        expect(manager.frameCount).toBe(1);

        const delta2 = manager.update(startTime + 32);
        expect(delta2).toBeGreaterThan(0);
        expect(manager.frameCount).toBe(2);
    });

    it('should smooth delta values over time', () => {
        const manager = createTimingManager();
        const startTime = performance.now();

        // First update with a large delta
        manager.update(startTime + 100);

        // Second update with a smaller delta
        const delta = manager.update(startTime + 116);

        // Smoothed delta should be less than raw delta due to smoothing
        expect(delta).toBeLessThan(0.1);
    });

    it('should cap maximum delta time', () => {
        const manager = createTimingManager();
        const startTime = performance.now();

        // Simulate a huge time gap (like when tab is inactive)
        const delta = manager.update(startTime + 1000);

        // Delta should be capped at MAX_DELTA (1/30 seconds)
        expect(delta).toBeLessThanOrEqual(1 / 30);
    });

    it('should reset to initial values', () => {
        const manager = createTimingManager();
        const startTime = performance.now();

        manager.update(startTime + 16);
        manager.update(startTime + 32);

        manager.reset();

        expect(manager.smoothDelta).toBe(0);
        expect(manager.frameCount).toBe(0);
    });
});

describe('createAnimationController', () => {
    it('should create controller with default values', () => {
        const controller = createAnimationController();
        expect(controller.targetPhase).toBe(0);
        expect(controller.direction).toBe(1);
    });

    it('should update phase based on delta and speed', () => {
        const controller = createAnimationController();
        const startTime = performance.now();

        const newPhase = controller.update(
            startTime + 20,
            0.016,
            0,
            () => 1,
            () => 1
        );

        expect(newPhase).toBeGreaterThan(0);
    });

    it('should handle direction changes', () => {
        const controller = createAnimationController();
        const startTime = performance.now();
        let direction = 1;

        // Update with forward direction
        controller.update(startTime + 20, 0.016, 0, () => direction, () => 1);

        // Change direction
        direction = -1;
        const phase = controller.update(
            startTime + 40,
            0.016,
            1,
            () => direction,
            () => 1
        );

        expect(controller.direction).toBe(-1);
        expect(phase).toBeDefined();
    });

    it('should respect speed multiplier', () => {
        const controller1 = createAnimationController();
        const controller2 = createAnimationController();
        const startTime = performance.now();

        // Normal speed
        const phase1 = controller1.update(startTime + 20, 0.016, 0, () => 1, () => 1);

        // Double speed
        const phase2 = controller2.update(startTime + 20, 0.016, 0, () => 1, () => 2);

        // Phase with 2x speed should be roughly 2x the normal phase
        expect(phase2).toBeGreaterThan(phase1);
    });

    it('should reset to initial values', () => {
        const controller = createAnimationController();
        const startTime = performance.now();

        controller.update(startTime + 20, 0.016, 0, () => 1, () => 1);
        controller.reset();

        expect(controller.targetPhase).toBe(0);
        expect(controller.direction).toBe(1);
    });
});

describe('createParticleController', () => {
    it('should create controller with initial values', () => {
        const controller = createParticleController();
        expect(controller.phase).toBe(0);
        expect(controller.direction).toBe(1);
    });

    it('should update particle phase', () => {
        const controller = createParticleController();
        const startTime = performance.now();

        const phase = controller.update(
            startTime + 20,
            0.016,
            () => 1,
            () => 1
        );

        expect(phase).toBeGreaterThan(0);
    });

    it('should handle direction changes', () => {
        const controller = createParticleController();
        const startTime = performance.now();
        let direction = 1;

        controller.update(startTime + 20, 0.016, () => direction, () => 1);

        direction = -1;
        controller.update(startTime + 40, 0.016, () => direction, () => 1);

        expect(controller.direction).toBe(-1);
    });

    it('should reset to initial values', () => {
        const controller = createParticleController();
        const startTime = performance.now();

        controller.update(startTime + 20, 0.016, () => 1, () => 1);
        controller.reset();

        expect(controller.phase).toBe(0);
        expect(controller.direction).toBe(1);
    });
});

describe('createAnimationLoop', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should call callback with delta time', () => {
        const callback = vi.fn();
        const cleanup = createAnimationLoop(callback);

        // Advance timers to trigger RAF
        vi.advanceTimersByTime(16);

        expect(callback).toHaveBeenCalled();
        cleanup();
    });

    it('should stop loop when cleanup is called', () => {
        const callback = vi.fn();
        const cleanup = createAnimationLoop(callback);

        cleanup();
        vi.advanceTimersByTime(100);

        // Callback should only be called once (initial frame), not continuously
        expect(callback.mock.calls.length).toBeLessThanOrEqual(1);
    });
});

describe('throttleRAF', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should throttle function calls to animation frames', () => {
        const fn = vi.fn();
        const throttled = throttleRAF(fn);

        // Call multiple times in quick succession
        throttled('a');
        throttled('b');
        throttled('c');

        // Should not be called yet
        expect(fn).not.toHaveBeenCalled();

        // Advance to next frame
        vi.advanceTimersByTime(16);

        // Should only be called once with the latest args
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('c');
    });

    it('should allow calls after frame completes', () => {
        const fn = vi.fn();
        const throttled = throttleRAF(fn);

        throttled('first');
        vi.advanceTimersByTime(16);

        throttled('second');
        vi.advanceTimersByTime(16);

        expect(fn).toHaveBeenCalledTimes(2);
    });
});
