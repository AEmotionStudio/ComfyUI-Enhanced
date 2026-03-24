/**
 * Unit tests for color utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    validateHexColor,
    hex2Hsl,
    hsl2Hex,
    hexToRgb,
    withAlpha,
    enhanceColor,
    getComplementaryColor,
    hsl,
    hsla,
    getAnimationColors,
    ANIMATION_COLORS,
} from '@/utils/colors';

describe('validateHexColor', () => {
    it('should validate valid 6-digit hex colors', () => {
        expect(validateHexColor('#ff0000')).toBe('#ff0000');
        expect(validateHexColor('#AABBCC')).toBe('#aabbcc');
        expect(validateHexColor('#000000')).toBe('#000000');
        expect(validateHexColor('#ffffff')).toBe('#ffffff');
    });

    it('should add # prefix if missing', () => {
        expect(validateHexColor('ff0000')).toBe('#ff0000');
        expect(validateHexColor('aabbcc')).toBe('#aabbcc');
    });

    it('should return null for invalid inputs', () => {
        expect(validateHexColor(null)).toBeNull();
        expect(validateHexColor(undefined)).toBeNull();
        expect(validateHexColor('')).toBeNull();
        expect(validateHexColor('#fff')).toBeNull(); // shorthand not supported
        expect(validateHexColor('#gggggg')).toBeNull(); // invalid hex chars
        expect(validateHexColor('not a color')).toBeNull();
        expect(validateHexColor(123)).toBeNull();
    });
});

describe('hex2Hsl', () => {
    it('should convert red to HSL', () => {
        const [h, s, l] = hex2Hsl('#ff0000');
        expect(h).toBeCloseTo(0, 0);
        expect(s).toBeCloseTo(100, 0);
        expect(l).toBeCloseTo(50, 0);
    });

    it('should convert green to HSL', () => {
        const [h, s, l] = hex2Hsl('#00ff00');
        expect(h).toBeCloseTo(120, 0);
        expect(s).toBeCloseTo(100, 0);
        expect(l).toBeCloseTo(50, 0);
    });

    it('should convert blue to HSL', () => {
        const [h, s, l] = hex2Hsl('#0000ff');
        expect(h).toBeCloseTo(240, 0);
        expect(s).toBeCloseTo(100, 0);
        expect(l).toBeCloseTo(50, 0);
    });

    it('should convert white to HSL', () => {
        const [_h, s, l] = hex2Hsl('#ffffff');
        expect(s).toBeCloseTo(0, 0);
        expect(l).toBeCloseTo(100, 0);
    });

    it('should convert black to HSL', () => {
        const [_h, s, l] = hex2Hsl('#000000');
        expect(s).toBeCloseTo(0, 0);
        expect(l).toBeCloseTo(0, 0);
    });

    it('should handle gray', () => {
        const [_h, s, l] = hex2Hsl('#808080');
        expect(s).toBeCloseTo(0, 0);
        expect(l).toBeCloseTo(50, 0);
    });

    it('should return default gray for invalid color', () => {
        const [h, s, l] = hex2Hsl('invalid');
        expect([h, s, l]).toEqual([0, 0, 50]);
    });
});

describe('hsl2Hex', () => {
    it('should convert HSL red to hex', () => {
        expect(hsl2Hex(0, 100, 50).toLowerCase()).toBe('#ff0000');
    });

    it('should convert HSL green to hex', () => {
        expect(hsl2Hex(120, 100, 50).toLowerCase()).toBe('#00ff00');
    });

    it('should convert HSL blue to hex', () => {
        expect(hsl2Hex(240, 100, 50).toLowerCase()).toBe('#0000ff');
    });

    it('should convert HSL white to hex', () => {
        expect(hsl2Hex(0, 0, 100).toLowerCase()).toBe('#ffffff');
    });

    it('should convert HSL black to hex', () => {
        expect(hsl2Hex(0, 0, 0).toLowerCase()).toBe('#000000');
    });
});

describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid colors', () => {
        expect(hexToRgb('invalid')).toBeNull();
        expect(hexToRgb('')).toBeNull();
    });
});

describe('withAlpha', () => {
    it('should add alpha to hex color', () => {
        expect(withAlpha('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
        expect(withAlpha('#00ff00', 1)).toBe('rgba(0, 255, 0, 1)');
    });

    it('should clamp alpha values', () => {
        expect(withAlpha('#ff0000', 2)).toBe('rgba(255, 0, 0, 1)');
        expect(withAlpha('#ff0000', -1)).toBe('rgba(255, 0, 0, 0)');
    });

    it('should handle null/undefined with default cyan', () => {
        expect(withAlpha(null, 0.5)).toBe('rgba(0, 255, 255, 0.5)');
        expect(withAlpha(undefined, 0.5)).toBe('rgba(0, 255, 255, 0.5)');
    });

    it('should handle HSL colors', () => {
        expect(withAlpha('hsl(0, 100%, 50%)', 0.5)).toBe('hsla(0, 100%, 50%, 0.5)');
    });

    it('should handle existing RGBA colors', () => {
        expect(withAlpha('rgba(255, 0, 0, 1)', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });
});

describe('enhanceColor', () => {
    const baseGray = '#808080';
    const baseRed = '#ff0000';

    it('should return same color for default scheme', () => {
        expect(enhanceColor(baseRed, 'default')).toBe(baseRed);
        expect(enhanceColor(baseGray, 'default')).toBe(baseGray);
    });

    it('should saturate colors', () => {
        const result = enhanceColor(baseGray, 'saturated');
        // Gray has 0 saturation, so saturated gray is still gray
        expect(result).toBeDefined();
    });

    it('should brighten colors', () => {
        const result = enhanceColor('#404040', 'bright');
        const [, , l] = hex2Hsl(result as string);
        expect(l).toBeGreaterThan(25); // Original gray is ~25% lightness
    });

    it('should mute colors', () => {
        const result = enhanceColor(baseRed, 'muted');
        expect(result).not.toBe(baseRed);
    });

    it('should return original for invalid colors', () => {
        expect(enhanceColor('invalid' as any, 'saturated')).toBe('invalid');
    });
});

describe('getComplementaryColor', () => {
    it('should return complementary color', () => {
        // Red (0°) -> Cyan (180°)
        const result = getComplementaryColor('#ff0000');
        const [h] = hex2Hsl(result);
        expect(h).toBeCloseTo(180, 0);
    });

    it('should handle blue', () => {
        // Blue (240°) -> Yellow (60°)
        const result = getComplementaryColor('#0000ff');
        const [h] = hex2Hsl(result);
        expect(h).toBeCloseTo(60, 0);
    });
});

describe('hsl and hsla helpers', () => {
    it('should create hsl string', () => {
        expect(hsl(0, 100, 50)).toBe('hsl(0, 100%, 50%)');
        expect(hsl(120, 50, 75)).toBe('hsl(120, 50%, 75%)');
    });

    it('should create hsla string', () => {
        expect(hsla(0, 100, 50, 0.5)).toBe('hsla(0, 100%, 50%, 0.5)');
    });

    it('should clamp alpha in hsla', () => {
        expect(hsla(0, 100, 50, 2)).toBe('hsla(0, 100%, 50%, 1)');
        expect(hsla(0, 100, 50, -1)).toBe('hsla(0, 100%, 50%, 0)');
    });
});

describe('getAnimationColors', () => {
    it('should return colors by style name', () => {
        expect(getAnimationColors('gentlePulse')).toBe(ANIMATION_COLORS.gentlePulse);
        expect(getAnimationColors('neonNexus')).toBe(ANIMATION_COLORS.neonNexus);
        expect(getAnimationColors('cosmicRipple')).toBe(ANIMATION_COLORS.cosmicRipple);
        expect(getAnimationColors('flowerOfLife')).toBe(ANIMATION_COLORS.flowerOfLife);
    });

    it('should return colors by style number', () => {
        expect(getAnimationColors(1)).toBe(ANIMATION_COLORS.gentlePulse);
        expect(getAnimationColors(2)).toBe(ANIMATION_COLORS.neonNexus);
        expect(getAnimationColors(3)).toBe(ANIMATION_COLORS.cosmicRipple);
        expect(getAnimationColors(4)).toBe(ANIMATION_COLORS.flowerOfLife);
    });

    it('should default to gentlePulse for unknown styles', () => {
        expect(getAnimationColors(0)).toBe(ANIMATION_COLORS.gentlePulse);
        expect(getAnimationColors(99)).toBe(ANIMATION_COLORS.gentlePulse);
    });
});

describe('roundtrip conversion', () => {
    it('should preserve color through hex -> hsl -> hex conversion', () => {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00'];

        for (const originalHex of colors) {
            const [h, s, l] = hex2Hsl(originalHex);
            const resultHex = hsl2Hex(h, s, l);
            expect(resultHex.toLowerCase()).toBe(originalHex.toLowerCase());
        }
    });
});
