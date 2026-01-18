import { app } from "/scripts/app.js";
import { w as withAlpha, P as PHI, c as createLinkState, a as createTimingManager, L as LINK_DEFAULTS, b as createPatternDesignerWindow } from "./chunks/designer-CQ6kedQI.js";
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
function drawFlowMarker(ctx, x, y, angle, size, color, alpha, glowIntensity) {
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
  ctx.fillStyle = withAlpha(color, alpha);
  ctx.fill();
  ctx.restore();
}
function drawEnergyParticles(ctx, getPoint, params, primaryColor, secondaryColor) {
  const { phase, quality, particleDensity, direction, isStatic } = params;
  const particleCount = Math.floor(3 + quality * 2 * particleDensity);
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
    gradient.addColorStop(0, withAlpha(primaryColor, alpha));
    gradient.addColorStop(0.5, withAlpha(secondaryColor, alpha * 0.5));
    gradient.addColorStop(1, withAlpha(secondaryColor, 0));
    ctx.beginPath();
    ctx.arc(point[0], point[1], size * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point[0], point[1], size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(primaryColor, Math.min(alpha * 1.5, 1));
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
      params.glowIntensity
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
function getSetting(name) {
  const defaultValue = LINK_DEFAULTS[name];
  return app.ui.settings.getSettingValue(name, defaultValue);
}
const ext = {
  name: "enhanced.link.animations",
  async setup(app2) {
    const state = createLinkState();
    const timing = createTimingManager();
    const settingsCache = {
      animStyle: 0,
      intensity: 0,
      quality: 0,
      particleDensity: 0,
      direction: 0,
      isStatic: false,
      markerEnabled: false,
      markerSize: 0,
      pauseDuringRender: false,
      speed: 0,
      lastUpdate: -500
      // Force immediate update on first frame
    };
    function updateSettingsCache(timestamp) {
      if (timestamp - settingsCache.lastUpdate < 500) return;
      settingsCache.animStyle = getSetting("🔗 Enhanced Links.Animate");
      settingsCache.intensity = getSetting("🔗 Enhanced Links.Glow.Intensity");
      settingsCache.quality = getSetting("🔗 Enhanced Links.Quality");
      settingsCache.particleDensity = getSetting("🔗 Enhanced Links.Particle.Density");
      settingsCache.direction = getSetting("🔗 Enhanced Links.Direction");
      settingsCache.isStatic = getSetting("🔗 Enhanced Links.Static.Mode");
      settingsCache.markerEnabled = getSetting("🔗 Enhanced Links.Marker.Enabled");
      settingsCache.markerSize = getSetting("🔗 Enhanced Links.Marker.Size");
      settingsCache.pauseDuringRender = getSetting("🔗 Enhanced Links.Pause.During.Render");
      settingsCache.speed = getSetting("🔗 Enhanced Links.Animation.Speed");
      settingsCache.lastUpdate = timestamp;
    }
    function renderLoop(timestamp) {
      timing.update(timestamp);
      updateSettingsCache(timestamp);
      const isEnabled = settingsCache.animStyle > 0;
      const isRendering = app2.graph && app2.graph.is_rendering;
      if (!isEnabled || isRendering && settingsCache.pauseDuringRender) {
        if (state.isRunning) {
          state.isRunning = false;
          app2.graph?.setDirtyCanvas(true, true);
        }
        requestAnimationFrame(renderLoop);
        return;
      }
      state.isRunning = true;
      const dt = (timestamp - state.lastFrame) / 1e3;
      state.lastFrame = timestamp;
      state.phase += dt * settingsCache.speed * settingsCache.direction;
      app2.graph?.setDirtyCanvas(true, false);
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
    const originalDrawLink = LGraphCanvas.prototype.drawLink;
    const _pointBuffer = [0, 0];
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
      if (settingsCache.animStyle === 0) return;
      const color = strokeStyle || "#ffffff";
      const params = {
        phase: state.phase,
        quality: settingsCache.quality,
        glowIntensity: settingsCache.intensity / 10,
        particleDensity: settingsCache.particleDensity,
        direction: settingsCache.direction,
        isStatic: settingsCache.isStatic
      };
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const cp_dist = dist * 0.25;
      const cp1x = x1 + cp_dist;
      const cp1y = y1;
      const cp2x = x2 - cp_dist;
      const cp2y = y2;
      const computeBezier = (t, out) => {
        const invT = 1 - t;
        const invT2 = invT * invT;
        const invT3 = invT2 * invT;
        const t2 = t * t;
        const t3 = t2 * t;
        out[0] = invT3 * x1 + 3 * invT2 * t * cp1x + 3 * invT * t2 * cp2x + t3 * x2;
        out[1] = invT3 * y1 + 3 * invT2 * t * cp1y + 3 * invT * t2 * cp2y + t3 * y2;
        return out;
      };
      const getPoint = (t) => {
        return computeBezier(t, _pointBuffer);
      };
      const _angleBuffer = [0, 0];
      const getAngle = (t) => {
        const delta = 0.01;
        const t_prev = Math.max(0, t - delta);
        const t_next = Math.min(1, t + delta);
        computeBezier(t_prev, _angleBuffer);
        const prevX = _angleBuffer[0];
        const prevY = _angleBuffer[1];
        computeBezier(t_next, _angleBuffer);
        const nextX = _angleBuffer[0];
        const nextY = _angleBuffer[1];
        return Math.atan2(nextY - prevY, nextX - prevX);
      };
      ctx.save();
      if (settingsCache.animStyle === 9) {
        LinkEffects.classicFlow(
          ctx,
          getPoint,
          getAngle,
          dist,
          params,
          color,
          settingsCache.markerEnabled ? settingsCache.markerSize : 0
        );
      } else if (settingsCache.animStyle === 8) {
        LinkEffects.energySurge(
          ctx,
          getPoint,
          params,
          color,
          "#ffffff"
          // Secondary color placeholder
        );
      } else if (settingsCache.animStyle === 7) {
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
