import { app } from "/scripts/app.js";
function hex2Hsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s2 = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s2 = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s2 * 100, l * 100];
}
function hsl2Hex(h, s2, l) {
  l /= 100;
  const a = s2 * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function validateHexColor(color) {
  if (!color || typeof color !== "string") return null;
  let c = color;
  if (c[0] !== "#") c = "#" + c;
  if (!/^#[0-9A-Fa-f]{6}$/.test(c)) return null;
  return c;
}
function enhanceColor(color, scheme) {
  if (!color || scheme === "default") return color;
  const valid = validateHexColor(color);
  if (!valid) return color;
  try {
    const [h, s2, l] = hex2Hsl(valid);
    switch (scheme) {
      case "saturated":
        return hsl2Hex(h, Math.min(s2 * 1.3, 100), l);
      case "vivid":
        return hsl2Hex(h, Math.min(s2 * 1.4, 100), Math.min(l * 1.1, 100));
      case "contrast":
        return hsl2Hex(h, Math.min(s2 * 1.2, 100), l > 50 ? Math.min(l * 1.2, 100) : Math.max(l * 0.8, 0));
      case "bright":
        return hsl2Hex(h, s2, Math.min(l * 1.25, 100));
      case "muted":
        return hsl2Hex(h, Math.max(s2 * 0.7, 0), Math.min(l * 1.1, 100));
      default:
        return valid;
    }
  } catch {
    return color;
  }
}
function s(key) {
  return app.ui.settings.getSettingValue(key);
}
function getCustomLinkColors() {
  const colorMode = s("🔗 Enhanced Links.Color.Mode") ?? "default";
  const colorScheme = s("🔗 Enhanced Links.Color.Scheme") ?? "default";
  if (colorMode === "off") return null;
  if (colorMode === "custom") {
    const primary = s("🔗 Enhanced Links.Color.Primary") ?? "#ffffff";
    const secondary = s("🔗 Enhanced Links.Color.Secondary") ?? "#ff6600";
    const accent = s("🔗 Enhanced Links.Color.Accent") ?? "#ff8800";
    return {
      primary: enhanceColor(validateHexColor(primary) || "#ffffff", colorScheme),
      secondary: enhanceColor(validateHexColor(secondary) || "#ff6600", colorScheme),
      accent: enhanceColor(validateHexColor(accent) || "#ff8800", colorScheme)
    };
  }
  return null;
}
function getLinkColor(defaultColor) {
  const colors = getCustomLinkColors();
  const scheme = s("🔗 Enhanced Links.Color.Scheme") ?? "default";
  return colors ? colors.primary : enhanceColor(defaultColor, scheme);
}
function getSecondaryColor(defaultColor) {
  const colors = getCustomLinkColors();
  const scheme = s("🔗 Enhanced Links.Color.Scheme") ?? "default";
  return colors ? colors.secondary : enhanceColor(defaultColor, scheme);
}
function getAccentColor(defaultColor) {
  const colors = getCustomLinkColors();
  const scheme = s("🔗 Enhanced Links.Color.Scheme") ?? "default";
  return colors ? colors.accent : enhanceColor(defaultColor, scheme);
}
const NODE_ANIMATION_COLORS = Object.freeze({
  gentlePulse: Object.freeze({ primary: "#44aaff", secondary: "#88ccff", accent: "#0088ff" }),
  neonNexus: Object.freeze({ primary: "#00ff88", secondary: "#00ffcc", accent: "#00ff44" }),
  cosmicRipple: Object.freeze({ primary: "#ff00ff", secondary: "#aa00ff", accent: "#ff40ff" }),
  flowerOfLife: Object.freeze({ primary: "#ffcc00", secondary: "#ff8800", accent: "#ffaa00" })
});
function getCustomNodeColors() {
  const colorMode = s("📦 Enhanced Nodes.Color.Mode") ?? "default";
  const colorScheme = s("📦 Enhanced Nodes.Color.Scheme") ?? "default";
  const animStyle = s("📦 Enhanced Nodes.Animate") ?? 1;
  const animColors = (() => {
    switch (animStyle) {
      case 2:
        return NODE_ANIMATION_COLORS.neonNexus;
      case 3:
        return NODE_ANIMATION_COLORS.cosmicRipple;
      case 4:
        return NODE_ANIMATION_COLORS.flowerOfLife;
      default:
        return NODE_ANIMATION_COLORS.gentlePulse;
    }
  })();
  if (colorMode === "custom") {
    const primary = s("📦 Enhanced Nodes.Color.Primary") ?? animColors.primary;
    const secondary = s("📦 Enhanced Nodes.Color.Secondary") ?? animColors.secondary;
    const accent = s("📦 Enhanced Nodes.Color.Accent") ?? animColors.accent;
    return {
      primary: enhanceColor(validateHexColor(primary) || animColors.primary, colorScheme),
      secondary: enhanceColor(validateHexColor(secondary) || animColors.secondary, colorScheme),
      accent: enhanceColor(validateHexColor(accent) || animColors.accent, colorScheme)
    };
  }
  return {
    primary: enhanceColor(animColors.primary, colorScheme),
    secondary: enhanceColor(animColors.secondary, colorScheme),
    accent: enhanceColor(animColors.accent, colorScheme)
  };
}
export {
  getCustomLinkColors as a,
  getSecondaryColor as b,
  getAccentColor as c,
  getCustomNodeColors as d,
  enhanceColor as e,
  getLinkColor as g,
  validateHexColor as v
};
//# sourceMappingURL=color-manager-BxBlhZuL.js.map
