import { describe, it, expect } from 'vitest';
import { computeBezierPoint, computeBezierAngle } from '@/utils/geometry';

describe('geometry', () => {
    describe('computeBezierPoint', () => {
        // Simple linear bezier (P0 to P3 straight line)
        const x1 = 0, y1 = 0;
        const cp1x = 33, cp1y = 0;
        const cp2x = 66, cp2y = 0;
        const x2 = 100, y2 = 0;

        it('should compute start point correctly at t=0', () => {
            const point = computeBezierPoint(0, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2);
            expect(point[0]).toBeCloseTo(0);
            expect(point[1]).toBeCloseTo(0);
        });

        it('should compute end point correctly at t=1', () => {
            const point = computeBezierPoint(1, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2);
            expect(point[0]).toBeCloseTo(100);
            expect(point[1]).toBeCloseTo(0);
        });

        it('should compute mid point correctly at t=0.5', () => {
            const point = computeBezierPoint(0.5, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2);
            // 49.625 is the correct cubic bezier value for these control points
            expect(point[0]).toBeCloseTo(49.625);
            expect(point[1]).toBeCloseTo(0);
        });

        it('should write to output buffer if provided', () => {
            const buffer: [number, number] = [0, 0];
            const result = computeBezierPoint(0.5, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, buffer);
            expect(result).toBe(buffer); // Should return same reference
            expect(buffer[0]).toBeCloseTo(49.625);
            expect(buffer[1]).toBeCloseTo(0);
        });
    });

    describe('computeBezierAngle', () => {
        // Vertical line
        const x1 = 0, y1 = 0;
        const cp1x = 0, cp1y = 33;
        const cp2x = 0, cp2y = 66;
        const x2 = 0, y2 = 100;

        it('should compute angle correctly', () => {
            const angle = computeBezierAngle(0.5, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2);
            // Expect roughly 90 degrees (PI/2) for vertical line going down (y increases)
            expect(angle).toBeCloseTo(Math.PI / 2);
        });
    });
});
