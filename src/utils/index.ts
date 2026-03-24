/**
 * Central export point for all utility functions.
 *
 * @module utils
 *
 * @example
 * import { withAlpha, enhanceColor } from '@/utils';
 */

// Color utilities (basic alpha/HSL helpers)
export {
    DEFAULT_COLOR,
    ANIMATION_COLORS,
    type AnimationStyle,
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
} from './colors';

// Color Manager (settings-aware color resolution)
export {
    getCustomLinkColors,
    getLinkColor,
    getSecondaryColor,
    getAccentColor,
    getCustomNodeColors,
    NODE_ANIMATION_COLORS,
    validateHexColor as validateHex,
    enhanceColor as enhance,
} from './color-manager';

// Designer utilities
export { createPatternDesignerWindow } from './designer';

// Geometry utilities
export { computeBezierPoint, computeBezierAngle } from './geometry';
