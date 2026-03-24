/**
 * Unit tests for animation effects calculation helpers
 */

import { describe, it, expect } from 'vitest';
import {
    isEffectivelyStatic,
    getScaledTime,
    calculateBreatheScale,
    calculateParticlePosition,
    calculateBlinkFactor,
} from '@/effects/types';
import {
    calculateFlowPositions,
    calculateWaveOffset,
    calculatePulseEffect,
} from '@/effects/link-effects';

describe('isEffectivelyStatic', () => {
    it('should return true when isStaticMode is true', () => {
        expect(
            isEffectivelyStatic({
                phase: 0,
                intensity: 1,
                isStaticMode: true,
                isPaused: false,
                animSpeed: 1,
                direction: 1,
            })
        ).toBe(true);
    });

    it('should return true when isPaused is true', () => {
        expect(
            isEffectivelyStatic({
                phase: 0,
                intensity: 1,
                isStaticMode: false,
                isPaused: true,
                animSpeed: 1,
                direction: 1,
            })
        ).toBe(true);
    });

    it('should return false when neither static nor paused', () => {
        expect(
            isEffectivelyStatic({
                phase: 0,
                intensity: 1,
                isStaticMode: false,
                isPaused: false,
                animSpeed: 1,
                direction: 1,
            })
        ).toBe(false);
    });
});

describe('getScaledTime', () => {
    it('should return phase directly when static', () => {
        const params = {
            phase: 5,
            intensity: 1,
            isStaticMode: true,
            isPaused: false,
            animSpeed: 2,
            direction: 1,
        };
        expect(getScaledTime(params)).toBe(5);
    });

    it('should scale phase by animSpeed when not static', () => {
        const params = {
            phase: 5,
            intensity: 1,
            isStaticMode: false,
            isPaused: false,
            animSpeed: 2,
            direction: 1,
        };
        expect(getScaledTime(params)).toBe(10);
    });
});

describe('calculateBreatheScale', () => {
    it('should return between 0 and 1', () => {
        for (let phase = 0; phase < Math.PI * 4; phase += 0.5) {
            const scale = calculateBreatheScale(phase, 1, 1, false);
            expect(scale).toBeGreaterThanOrEqual(0);
            expect(scale).toBeLessThanOrEqual(1);
        }
    });

    it('should use phase directly when static', () => {
        const scale1 = calculateBreatheScale(Math.PI / 2, 1, 1, true);
        const scale2 = calculateBreatheScale(Math.PI / 2, -1, 2, true);
        // Both should be the same since static ignores direction and speed
        expect(scale1).toBe(scale2);
    });
});

describe('calculateParticlePosition', () => {
    it('should return position with x, y, and sizeFactor', () => {
        const result = calculateParticlePosition(0, 8, 0, 50, {
            particleSpeed: 1,
            particleIntensity: 1,
            isStatic: false,
            phase: 0,
            quality: 2,
        });

        expect(result).toHaveProperty('x');
        expect(result).toHaveProperty('y');
        expect(result).toHaveProperty('sizeFactor');
        expect(typeof result.x).toBe('number');
        expect(typeof result.y).toBe('number');
        expect(typeof result.sizeFactor).toBe('number');
    });

    it('should return sizeFactor of 1 when static', () => {
        const result = calculateParticlePosition(0, 8, 0, 50, {
            particleSpeed: 1,
            particleIntensity: 1,
            isStatic: true,
            phase: 0,
            quality: 2,
        });

        expect(result.sizeFactor).toBe(1);
    });
});

describe('calculateBlinkFactor', () => {
    it('should return 0.8 when static', () => {
        expect(calculateBlinkFactor(0, 0, 1, true)).toBe(0.8);
        expect(calculateBlinkFactor(5, 100, 2, true)).toBe(0.8);
    });

    it('should return value between 0 and 1.2 when animated', () => {
        for (let time = 0; time < 10; time += 0.5) {
            const factor = calculateBlinkFactor(0, time, 1, false);
            expect(factor).toBeGreaterThanOrEqual(0);
            expect(factor).toBeLessThanOrEqual(1.2);
        }
    });
});

describe('calculateFlowPositions', () => {
    it('should return array of positions', () => {
        const positions = calculateFlowPositions(200, 0, 1, 1);
        expect(Array.isArray(positions)).toBe(true);
        expect(positions.length).toBeGreaterThan(0);
    });

    it('should return positions between 0 and 1', () => {
        const positions = calculateFlowPositions(200, 5, 1.5, -1);
        for (const t of positions) {
            expect(t).toBeGreaterThanOrEqual(0);
            expect(t).toBeLessThanOrEqual(1);
        }
    });

    it('should have more positions with higher density', () => {
        const lowDensity = calculateFlowPositions(200, 0, 0.5, 1);
        const highDensity = calculateFlowPositions(200, 0, 2, 1);
        expect(highDensity.length).toBeGreaterThanOrEqual(lowDensity.length);
    });
});

describe('calculateWaveOffset', () => {
    it('should return 0 when static', () => {
        expect(calculateWaveOffset(0.5, 1, 10, true)).toBe(0);
    });

    it('should return sinusoidal value when animated', () => {
        const offset = calculateWaveOffset(0.5, 0, 5, false);
        expect(offset).toBeGreaterThanOrEqual(-5);
        expect(offset).toBeLessThanOrEqual(5);
    });
});

describe('calculatePulseEffect', () => {
    it('should return value around 0.8 - 1.0', () => {
        for (let phase = 0; phase < Math.PI * 4; phase += 0.5) {
            const pulse = calculatePulseEffect(0.5, phase, 2);
            expect(pulse).toBeGreaterThanOrEqual(0.6);
            expect(pulse).toBeLessThanOrEqual(1.0);
        }
    });
});
