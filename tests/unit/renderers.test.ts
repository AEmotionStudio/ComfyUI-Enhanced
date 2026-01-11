/**
 * Unit tests for renderer utilities
 */

import { describe, it, expect } from 'vitest';
import {
    MarkerShapes,
    getMarkerShape,
    getLinkRenderer,
    splineRenderer,
    straightRenderer,
    linearRenderer,
} from '@/renderers';
import type { Point } from '@/core/types';

describe('MarkerShapes', () => {
    it('should have all expected shapes', () => {
        const expectedShapes = [
            'none',
            'diamond',
            'circle',
            'arrow',
            'square',
            'triangle',
            'star',
            'heart',
            'cross',
            'hexagon',
            'flower',
            'spiral',
        ];

        for (const shape of expectedShapes) {
            expect(MarkerShapes[shape]).toBeDefined();
            expect(typeof MarkerShapes[shape]).toBe('function');
        }
    });

    it('should return arrow as default for unknown shapes', () => {
        expect(getMarkerShape('unknown')).toBe(MarkerShapes.arrow);
        expect(getMarkerShape('')).toBe(MarkerShapes.arrow);
    });

    it('should return correct shape by name', () => {
        expect(getMarkerShape('diamond')).toBe(MarkerShapes.diamond);
        expect(getMarkerShape('circle')).toBe(MarkerShapes.circle);
        expect(getMarkerShape('star')).toBe(MarkerShapes.star);
    });
});

describe('LinkRenderers', () => {
    describe('splineRenderer', () => {
        const start: Point = [0, 0];
        const end: Point = [100, 0];

        it('should calculate path length', () => {
            const length = splineRenderer.getLength(start, end);
            // Spline is curved, so length should be close to but potentially slightly different from straight distance
            expect(length).toBeGreaterThan(0);
            expect(length).toBeGreaterThanOrEqual(100); // At least as long as straight line
        });

        it('should get points along the path', () => {
            const startPoint = splineRenderer.getPoint(start, end, 0);
            const endPoint = splineRenderer.getPoint(start, end, 1);
            const midPoint = splineRenderer.getPoint(start, end, 0.5);

            // Start point should match start
            expect(startPoint[0]).toBeCloseTo(start[0], 1);
            expect(startPoint[1]).toBeCloseTo(start[1], 1);

            // End point should match end
            expect(endPoint[0]).toBeCloseTo(end[0], 1);
            expect(endPoint[1]).toBeCloseTo(end[1], 1);

            // Mid point should be somewhere in between
            expect(midPoint[0]).toBeGreaterThan(start[0]);
            expect(midPoint[0]).toBeLessThan(end[0]);
        });

        it('should calculate normalized t for distance', () => {
            const length = splineRenderer.getLength(start, end);
            const midT = splineRenderer.getNormalizedT(start, end, length / 2, length);

            expect(midT).toBeGreaterThan(0);
            expect(midT).toBeLessThan(1);
        });
    });

    describe('straightRenderer', () => {
        const start: Point = [0, 0];
        const end: Point = [100, 0];

        it('should calculate exact distance', () => {
            const length = straightRenderer.getLength(start, end);
            expect(length).toBe(100);
        });

        it('should get points along straight line', () => {
            const midPoint = straightRenderer.getPoint(start, end, 0.5);
            expect(midPoint[0]).toBe(50);
            expect(midPoint[1]).toBe(0);

            const quarterPoint = straightRenderer.getPoint(start, end, 0.25);
            expect(quarterPoint[0]).toBe(25);
            expect(quarterPoint[1]).toBe(0);
        });

        it('should calculate linear normalized t', () => {
            const length = straightRenderer.getLength(start, end);
            const t = straightRenderer.getNormalizedT(start, end, 50, length);
            expect(t).toBe(0.5);
        });
    });

    describe('linearRenderer', () => {
        const start: Point = [0, 0];
        const end: Point = [100, 100];

        it('should calculate Manhattan-like path length', () => {
            const length = linearRenderer.getLength(start, end);
            // Linear path goes horizontal, then vertical, then horizontal
            // midX = 50, so horizontal1 = 50, vertical = 100, horizontal2 = 50
            expect(length).toBe(200);
        });

        it('should get points in three segments', () => {
            // First third: horizontal movement
            const p1 = linearRenderer.getPoint(start, end, 0.16);
            expect(p1[1]).toBeCloseTo(0, 1); // Still at start y

            // Middle third: vertical movement
            const p2 = linearRenderer.getPoint(start, end, 0.5);
            expect(p2[0]).toBe(50); // At midX

            // Last third: horizontal movement
            const p3 = linearRenderer.getPoint(start, end, 0.84);
            expect(p3[1]).toBeCloseTo(100, 1); // At end y
        });
    });

    describe('getLinkRenderer', () => {
        it('should return spline as default for unknown styles', () => {
            expect(getLinkRenderer('unknown')).toBe(splineRenderer);
            expect(getLinkRenderer('')).toBe(splineRenderer);
        });

        it('should return correct renderer by style', () => {
            expect(getLinkRenderer('straight')).toBe(straightRenderer);
            expect(getLinkRenderer('linear')).toBe(linearRenderer);
        });
    });
});
