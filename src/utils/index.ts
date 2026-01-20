/**
 * Central export point for all utility functions.
 *
 * @module utils
 *
 * @example
 * import { hex2Hsl, withAlpha, enhanceColor } from '@/utils';
 */

// Color utilities
export {
    // Configuration
    DEFAULT_COLOR,
    ANIMATION_COLORS,
    type AnimationStyle,

    // Validation
    validateHexColor,

    // HSL conversion
    hex2Hsl,
    hsl2Hex,
    hexToRgb,

    // Alpha handling
    withAlpha,

    // Color enhancement
    enhanceColor,

    // Utility functions
    getComplementaryColor,
    hsl,
    hsla,
    getAnimationColors,
} from './colors';

// Designer utilities
export { createPatternDesignerWindow } from './designer';

// Geometry utilities
export { computeBezierPoint, computeBezierAngle } from './geometry';
