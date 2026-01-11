/**
 * Central export point for all UI utilities.
 *
 * @module ui
 *
 * @example
 * import { createForceUpdateCallback, applyDefaultSettings } from '@/ui';
 */

export {
    type SettingsCallback,
    type ForceUpdateOptions,
    createForceUpdateCallback,
    createStyleChangeCallback,
    createAnimationResetCallback,
    applyDefaultSettings,
    getSetting,
    isSettingModified,
} from './settings-utils';
