import { app } from "/scripts/app.js";
import { h as hexToRgb, w as withAlpha, P as PHI, L as LINK_DEFAULTS, c as createLinkState, a as createTimingManager, b as createPatternDesignerWindow } from "./chunks/designer-icUNrL3Y.js";
function getRgb(color) {
  if (typeof color === "string" && color.startsWith("#")) {
    return hexToRgb(color);
  }
  return null;
}
function fastAlpha(rgb, color, alpha) {
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
  }
  return withAlpha(color, alpha);
}
function calculateFlowPositions(linkLength, phase, density, direction) {
  const spacing = Math.max(30, 60 - density * 20);
  const markerCount = Math.max(1, Math.floor(linkLength / spacing));
  const positions = [];
  for (let i = 0; i < markerCount; i++) {
    const baseT = i / markerCount;
    const animOffset = phase * direction * 0.1 % 1;
    let t = (baseT + animOffset) % 1;
    if (t < 0) t += 1;
    positions.push(t);
  }
  return positions;
}
function calculatePulseEffect(t, phase, quality) {
  const pulseSpeed = 2 + quality * 0.5;
  return 0.8 + 0.2 * Math.sin(t * Math.PI * 2 + phase * pulseSpeed);
}
function drawFlowMarker(ctx, x, y, angle, size, color, alpha, glowIntensity, rgb) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (glowIntensity > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 5 * glowIntensity;
  }
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size, size * 0.7);
  ctx.lineTo(-size * 0.4, 0);
  ctx.lineTo(-size, -size * 0.7);
  ctx.closePath();
  ctx.fillStyle = fastAlpha(rgb || null, color, alpha);
  ctx.fill();
  ctx.restore();
}
function drawEnergyParticles(ctx, getPoint, params, primaryColor, secondaryColor) {
  const { phase, quality, particleDensity, direction, isStatic } = params;
  const particleCount = Math.floor(3 + quality * 2 * particleDensity);
  const primaryRgb = getRgb(primaryColor);
  const secondaryRgb = getRgb(secondaryColor);
  for (let i = 0; i < particleCount; i++) {
    const baseT = i / particleCount;
    const offset = isStatic ? 0 : (phase * direction * 0.15 + i * 0.1) % 1;
    let t = (baseT + offset) % 1;
    if (t < 0) t += 1;
    const point = getPoint(t);
    const size = 2 + quality + Math.sin(phase * 2 + i) * 1;
    const alpha = 0.6 + 0.4 * Math.sin(phase * 3 + i * PHI);
    const gradient = ctx.createRadialGradient(
      point[0],
      point[1],
      0,
      point[0],
      point[1],
      size * 2
    );
    gradient.addColorStop(0, fastAlpha(primaryRgb, primaryColor, alpha));
    gradient.addColorStop(0.5, fastAlpha(secondaryRgb, secondaryColor, alpha * 0.5));
    gradient.addColorStop(1, fastAlpha(secondaryRgb, secondaryColor, 0));
    ctx.beginPath();
    ctx.arc(point[0], point[1], size * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point[0], point[1], size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = fastAlpha(primaryRgb, primaryColor, Math.min(alpha * 1.5, 1));
    ctx.fill();
  }
}
function drawGlowTrail(ctx, getPoint, params, color, thickness) {
  const { phase, glowIntensity, direction, isStatic } = params;
  const segments = 20;
  const trailLength = 0.3;
  const trailStart = isStatic ? 0.35 : phase * direction * 0.1 % 1;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 * glowIntensity;
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const segmentT = i / segments;
    let t = trailStart + segmentT * trailLength;
    if (t > 1) t -= 1;
    const point = getPoint(t);
    if (i === 0) {
      ctx.moveTo(point[0], point[1]);
    } else {
      ctx.lineTo(point[0], point[1]);
    }
  }
  ctx.strokeStyle = withAlpha(color, 0.7);
  ctx.lineWidth = thickness;
  ctx.stroke();
  ctx.restore();
}
function classicFlowAnimation(ctx, getPoint, getAngle, linkLength, params, color, markerSize) {
  const positions = calculateFlowPositions(
    linkLength,
    params.phase,
    params.particleDensity,
    params.direction
  );
  const rgb = getRgb(color);
  for (const t of positions) {
    const point = getPoint(t);
    const angle = getAngle(t);
    const pulse = calculatePulseEffect(t, params.phase, params.quality);
    const alpha = 0.7 + 0.3 * pulse;
    drawFlowMarker(
      ctx,
      point[0],
      point[1],
      angle,
      markerSize * pulse,
      color,
      alpha,
      params.glowIntensity,
      rgb
    );
  }
}
function energySurgeAnimation(ctx, getPoint, params, primaryColor, secondaryColor) {
  drawEnergyParticles(ctx, getPoint, params, primaryColor, secondaryColor);
}
function quantumFlowAnimation(ctx, getPoint, params, color, thickness) {
  drawGlowTrail(ctx, getPoint, params, color, thickness);
  drawEnergyParticles(ctx, getPoint, params, color, color);
}
const LinkEffects = {
  classicFlow: classicFlowAnimation,
  energySurge: energySurgeAnimation,
  quantumFlow: quantumFlowAnimation
};
function computeBezierPoint(t, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, out) {
  const invT = 1 - t;
  const invT2 = invT * invT;
  const invT3 = invT2 * invT;
  const t2 = t * t;
  const t3 = t2 * t;
  const x = invT3 * x1 + 3 * invT2 * t * cp1x + 3 * invT * t2 * cp2x + t3 * x2;
  const y = invT3 * y1 + 3 * invT2 * t * cp1y + 3 * invT * t2 * cp2y + t3 * y2;
  if (out) {
    out[0] = x;
    out[1] = y;
    return out;
  }
  return [x, y];
}
function computeBezierAngle(t, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2) {
  const invT = 1 - t;
  const A = 3 * invT * invT;
  const B = 6 * invT * t;
  const C = 3 * t * t;
  const dx = A * (cp1x - x1) + B * (cp2x - cp1x) + C * (x2 - cp2x);
  const dy = A * (cp1y - y1) + B * (cp2y - cp1y) + C * (y2 - cp2y);
  return Math.atan2(dy, dx);
}
const SHARED_POINT_BUFFER = [0, 0];
const SETTINGS_UPDATE_INTERVAL = 500;
const settingsCache = {
  animate: LINK_DEFAULTS["🔗 Enhanced Links.Animate"],
  speed: LINK_DEFAULTS["🔗 Enhanced Links.Animation.Speed"],
  direction: LINK_DEFAULTS["🔗 Enhanced Links.Direction"],
  pauseDuringRender: LINK_DEFAULTS["🔗 Enhanced Links.Pause.During.Render"],
  intensity: LINK_DEFAULTS["🔗 Enhanced Links.Glow.Intensity"],
  quality: LINK_DEFAULTS["🔗 Enhanced Links.Quality"],
  particleDensity: LINK_DEFAULTS["🔗 Enhanced Links.Particle.Density"],
  isStatic: LINK_DEFAULTS["🔗 Enhanced Links.Static.Mode"],
  markerEnabled: LINK_DEFAULTS["🔗 Enhanced Links.Marker.Enabled"],
  markerSize: LINK_DEFAULTS["🔗 Enhanced Links.Marker.Size"],
  lastUpdate: -SETTINGS_UPDATE_INTERVAL
  // Start ready to update
};
function getSetting(name) {
  const defaultValue = LINK_DEFAULTS[name];
  return app.ui.settings.getSettingValue(name, defaultValue);
}
function updateSettingsCache(timestamp) {
  if (timestamp - settingsCache.lastUpdate < SETTINGS_UPDATE_INTERVAL) return;
  settingsCache.animate = getSetting("🔗 Enhanced Links.Animate");
  settingsCache.speed = getSetting("🔗 Enhanced Links.Animation.Speed");
  settingsCache.direction = getSetting("🔗 Enhanced Links.Direction");
  settingsCache.pauseDuringRender = getSetting("🔗 Enhanced Links.Pause.During.Render");
  settingsCache.intensity = getSetting("🔗 Enhanced Links.Glow.Intensity");
  settingsCache.quality = getSetting("🔗 Enhanced Links.Quality");
  settingsCache.particleDensity = getSetting("🔗 Enhanced Links.Particle.Density");
  settingsCache.isStatic = getSetting("🔗 Enhanced Links.Static.Mode");
  settingsCache.markerEnabled = getSetting("🔗 Enhanced Links.Marker.Enabled");
  settingsCache.markerSize = getSetting("🔗 Enhanced Links.Marker.Size");
  settingsCache.lastUpdate = timestamp;
}
const ext = {
  name: "enhanced.link.animations",
  async setup(app2) {
    const state = createLinkState();
    const timing = createTimingManager();
    function renderLoop(timestamp) {
      timing.update(timestamp);
      updateSettingsCache(timestamp);
      const isEnabled = settingsCache.animate > 0;
      const pauseDuringRender = settingsCache.pauseDuringRender;
      const isRendering = app2.graph && app2.graph.is_rendering;
      if (!isEnabled || isRendering && pauseDuringRender) {
        if (state.isRunning) {
          state.isRunning = false;
          app2.graph?.setDirtyCanvas(true, true);
        }
        requestAnimationFrame(renderLoop);
        return;
      }
      state.isRunning = true;
      const speed = settingsCache.speed;
      const direction = settingsCache.direction;
      const dt = (timestamp - state.lastFrame) / 1e3;
      state.lastFrame = timestamp;
      state.phase += dt * speed * direction;
      app2.graph?.setDirtyCanvas(true, false);
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
    const originalDrawLink = LGraphCanvas.prototype.drawLink;
    LGraphCanvas.prototype.drawLink = function(link_id, ctx, x1, y1, x2, y2, link_index, skip_border, fillStyle, strokeStyle, lineWidth) {
      originalDrawLink.call(
        this,
        link_id,
        ctx,
        x1,
        y1,
        x2,
        y2,
        link_index,
        skip_border,
        fillStyle,
        strokeStyle,
        lineWidth
      );
      const animStyle = settingsCache.animate;
      if (animStyle === 0) return;
      const intensity = settingsCache.intensity;
      const quality = settingsCache.quality;
      const particleDensity = settingsCache.particleDensity;
      const direction = settingsCache.direction;
      const isStatic = settingsCache.isStatic;
      const markerEnabled = settingsCache.markerEnabled;
      const markerSize = settingsCache.markerSize;
      const color = strokeStyle || "#ffffff";
      const params = {
        phase: state.phase,
        quality,
        glowIntensity: intensity / 10,
        particleDensity,
        direction,
        isStatic
      };
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const cp_dist = dist * 0.25;
      const cp1x = x1 + cp_dist;
      const cp1y = y1;
      const cp2x = x2 - cp_dist;
      const cp2y = y2;
      const getPoint = (t) => {
        return computeBezierPoint(t, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, SHARED_POINT_BUFFER);
      };
      const getAngle = (t) => {
        return computeBezierAngle(t, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2);
      };
      ctx.save();
      if (animStyle === 9) {
        LinkEffects.classicFlow(
          ctx,
          getPoint,
          getAngle,
          dist,
          params,
          color,
          markerEnabled ? markerSize : 0
        );
      } else if (animStyle === 8) {
        LinkEffects.energySurge(
          ctx,
          getPoint,
          params,
          color,
          "#ffffff"
          // Secondary color placeholder
        );
      } else if (animStyle === 7) {
        LinkEffects.quantumFlow(
          ctx,
          getPoint,
          params,
          color,
          lineWidth
        );
      }
      ctx.restore();
    };
    app2.ui.settings.addSetting({
      id: "🔗 Enhanced Links.UI & Æmotion Studio About",
      name: "🔽 Info Panel",
      type: "combo",
      options: [
        { value: 0, text: "Closed Panel" },
        { value: 1, text: "Open Panel" }
      ],
      defaultValue: LINK_DEFAULTS["🔗 Enhanced Links.UI & Æmotion Studio About"],
      onChange: (value) => {
        if (value === 1) {
          document.body.appendChild(createPatternDesignerWindow());
          setTimeout(() => app2.ui.settings.setSettingValue("🔗 Enhanced Links.UI & Æmotion Studio About", 0), 100);
        }
      }
    });
    console.log("[EnhancedLinks] Extension registered and ready.");
  }
};
app.registerExtension(ext);
//# sourceMappingURL=link_animations.js.map
