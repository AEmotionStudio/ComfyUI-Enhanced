/**
 * Central export point for all UI utilities.
 *
 * @module ui
 *
 * @example
 * import { createForceUpdateCallback, applyDefaultSettings } from '@/ui';
 */

// Settings utilities (legacy)
export {
    type SettingsCallback,
    type ForceUpdateOptions,
    createForceUpdateCallback as createForceUpdateCallbackLegacy,
    createStyleChangeCallback as createStyleChangeCallbackLegacy,
    createAnimationResetCallback,
    applyDefaultSettings,
    getSetting,
    isSettingModified,
} from './settings-utils';

// Settings definitions and types
export {
    type BaseSetting,
    type ComboSetting,
    type SliderSetting,
    type ColorSetting,
    type BooleanSetting,
    type ButtonSetting,
    type SettingDefinition,
    type SettingCallback,
    LINK_ANIMATION_OPTIONS,
    LINK_STYLE_OPTIONS,
    MARKER_SHAPE_OPTIONS,
    NODE_ANIMATION_OPTIONS,
    ENABLED_DISABLED_OPTIONS,
    ANIMATED_STATIC_OPTIONS,
    DIRECTION_OPTIONS,
    COLOR_MODE_OPTIONS,
    COLOR_SCHEME_OPTIONS,
    QUALITY_OPTIONS,
    createForceUpdateCallback,
    createStyleChangeCallback,
    registerSetting,
    getSettingValue,
    setSettingValue,
    getLinkDefaults,
    getNodeDefaults,
} from './settings';

// Context menu utilities
export {
    type MenuOption,
    type ContextMenuConfig,
    createAnimationStyleMenu,
    createParticlesOnlyMenu,
    createCompletionAnimationMenu,
    injectAnimationMenu,
    buildNodeContextMenu,
} from './context-menu';
