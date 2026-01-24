import { app } from "/scripts/app.js";
import { w as withAlpha, d as createNodeState, a as createTimingManager, N as NODE_DEFAULTS, b as createPatternDesignerWindow } from "./chunks/designer-icUNrL3Y.js";
function isEffectivelyStatic(params) {
  return params.isStaticMode || params.isPaused;
}
function calculateGlowRadius(node, quality) {
  return Math.max(node.size[0], node.size[1]) * (0.5 + quality.quality * 0.1) * quality.animationSize;
}
function calculateBreatheScale(phase, direction, animSpeed, isStatic) {
  const breathePhase = isStatic ? phase : phase * 0.375 * direction * animSpeed;
  return Math.pow(Math.sin(breathePhase), 2);
}
function calculateParticlePosition(index, particleCount, particleTime, orbitRadius, settings) {
  const { particleSpeed, particleIntensity, isStatic, phase, quality } = settings;
  const particleOffset = index * (Math.PI * 2 / particleCount);
  const individualSpeed = isStatic ? 1 : (0.5 + Math.sin(index) * 0.25) * particleIntensity * particleSpeed;
  const particlePhase = isStatic ? phase + particleOffset : particleTime * individualSpeed + particleOffset;
  const dynamicOrbit = orbitRadius * (0.8 + Math.sin(isStatic ? phase + index : particleTime * 0.2 * particleSpeed + index) * 0.25 + Math.cos(isStatic ? phase + index * 0.7 : particleTime * 0.3 * particleSpeed + index * 0.7) * 0.25);
  const angle = particlePhase + index * Math.PI * 2 / particleCount;
  const randomFactor = quality > 1 ? 12 : 6;
  const torusEffect = particleIntensity * 2;
  const orbitOffset = Math.sin(particleTime * 0.3 * particleSpeed + index) * torusEffect;
  const jitterX = isStatic ? 0 : Math.sin(particleTime * 3 * particleSpeed + index) * 1.2 * particleIntensity + Math.cos(particleTime * 2 * particleSpeed + index * 0.5) * 0.5 * particleIntensity;
  const jitterY = isStatic ? 0 : Math.cos(particleTime * 2.5 * particleSpeed + index) * 1.2 * particleIntensity + Math.sin(particleTime * 1.5 * particleSpeed + index * 0.7) * 0.5 * particleIntensity;
  const verticalOffset = -dynamicOrbit * 0.3;
  const x = Math.cos(angle) * (dynamicOrbit + orbitOffset) + Math.sin(isStatic ? phase + index : particleTime * 0.2 * particleSpeed + index) * randomFactor + jitterX;
  const y = Math.sin(angle) * (dynamicOrbit + orbitOffset) + verticalOffset + Math.cos(isStatic ? phase + index : particleTime * 0.15 * particleSpeed + index) * randomFactor + jitterY;
  const sizeFactor = isStatic ? 1 : 0.7 + Math.sin(particleTime * 0.5 * particleSpeed + index) * 0.4 + Math.random() * 0.3;
  return { x, y, sizeFactor };
}
function calculateBlinkFactor(index, particleTime, particleSpeed, isStatic) {
  if (isStatic) return 0.8;
  const blinkOffset = Math.abs(Math.sin(index * 12.9898) * 43758.5453 % (2 * Math.PI));
  const blinkSpeed = 1.2 + Math.sin(index * 0.7) * 0.6;
  return 0.4 + 0.8 * Math.pow(Math.sin(particleTime * blinkSpeed * particleSpeed + blinkOffset), 2);
}
function drawHoverOutline(ctx, node, settings) {
  if (!settings.colors.showHover) return;
  if (!node.selected && !node.mouseOver) return;
  const { hoverColor } = settings.colors;
  const { glowIntensity } = settings.quality;
  const outlineGlowSize = 15 * glowIntensity;
  ctx.save();
  ctx.shadowColor = withAlpha(hoverColor, 0.5);
  ctx.shadowBlur = node.selected ? outlineGlowSize * 1.5 : outlineGlowSize;
  ctx.strokeStyle = withAlpha(hoverColor, 0.7);
  ctx.lineWidth = 2;
  ctx.strokeRect(-node.size[0] / 2, -node.size[1] / 2, node.size[0], node.size[1]);
  ctx.restore();
}
function drawPulseGlow(ctx, glowRadius, breatheScale, intensity, settings) {
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, quality } = settings.quality;
  const modifiedIntensity = intensity * 0.75;
  const pulseScale = 0.4 + 0.4 * breatheScale * modifiedIntensity;
  const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulseScale);
  const innerAlpha = 0.2 * glowIntensity * (0.5 + breatheScale * 0.5);
  innerGlow.addColorStop(0, withAlpha("#ffffff", Math.min(innerAlpha + 0.15, 1)));
  innerGlow.addColorStop(0.3, withAlpha(primary, innerAlpha));
  innerGlow.addColorStop(0.7, withAlpha(secondary, innerAlpha * 0.6));
  innerGlow.addColorStop(1, withAlpha(accent, 0));
  const outerGlow = ctx.createRadialGradient(
    0,
    0,
    glowRadius * 0.6 * pulseScale,
    0,
    0,
    glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale
  );
  const outerAlpha = 0.1 * glowIntensity * (0.5 + breatheScale * 0.5);
  outerGlow.addColorStop(0, withAlpha(secondary, outerAlpha));
  outerGlow.addColorStop(0.6, withAlpha(accent, outerAlpha * 0.5));
  outerGlow.addColorStop(1, withAlpha(accent, 0));
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius * pulseScale, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.globalAlpha = Math.min(0.2 + Math.abs(breatheScale) * 0.3 + glowIntensity * 0.2, 1);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.globalAlpha = Math.min(0.15 + Math.abs(breatheScale) * 0.2 + glowIntensity * 0.15, 1);
  ctx.fill();
  if (quality > 1) {
    ctx.shadowColor = withAlpha(secondary, 0.3);
    ctx.shadowBlur = 10 * glowIntensity * (quality * 0.5);
  }
}
function drawParticles(ctx, node, settings, particleTime, getParticleColor) {
  const { particles, quality, animation } = settings;
  if (!particles.showParticles) return;
  const isStatic = isEffectivelyStatic(animation);
  const glowRadius = calculateGlowRadius(node, quality);
  const baseParticleCount = 8 + quality.quality * 2;
  const particleCount = Math.floor(baseParticleCount * particles.density);
  for (let i = 0; i < particleCount; i++) {
    const position = calculateParticlePosition(i, particleCount, particleTime, glowRadius, {
      particleSpeed: particles.speed,
      particleIntensity: particles.intensity,
      isStatic,
      phase: animation.phase,
      quality: quality.quality
    });
    const baseParticleSize = (4 + quality.quality) * quality.animationSize * particles.size;
    const particleSize = baseParticleSize * position.sizeFactor;
    const particleColor = getParticleColor(i, particleTime * particles.speed, particleCount);
    const particleGlow = ctx.createRadialGradient(
      position.x,
      position.y,
      0,
      position.x,
      position.y,
      particleSize * 2
    );
    particleGlow.addColorStop(0, withAlpha(particleColor, 0.8 * particles.glowIntensity));
    particleGlow.addColorStop(0.4, withAlpha(particleColor, 0.4 * particles.glowIntensity));
    particleGlow.addColorStop(1, withAlpha(particleColor, 0));
    const blinkFactor = calculateBlinkFactor(i, particleTime, particles.speed, isStatic);
    const particleAlpha = Math.min(blinkFactor, 1) * particles.glowIntensity;
    ctx.beginPath();
    ctx.arc(position.x, position.y, particleSize * 2, 0, Math.PI * 2);
    ctx.fillStyle = particleGlow;
    ctx.globalAlpha = particleAlpha * 0.8;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(position.x, position.y, particleSize * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = particleColor;
    ctx.globalAlpha = Math.min(particleAlpha * 1.5, 1);
    ctx.fill();
  }
}
function gentlePulse(ctx, node, settings, particleTime, getParticleColor) {
  const isStatic = isEffectivelyStatic(settings.animation);
  const glowRadius = calculateGlowRadius(node, settings.quality);
  const breatheScale = calculateBreatheScale(
    settings.animation.phase,
    settings.animation.direction,
    settings.animation.animSpeed,
    isStatic
  );
  ctx.save();
  ctx.translate(node.size[0] / 2, node.size[1] / 2);
  drawHoverOutline(ctx, node, settings);
  if (!node.particlesOnly) {
    drawPulseGlow(ctx, glowRadius, breatheScale, settings.animation.intensity, settings);
  }
  drawParticles(ctx, node, settings, particleTime, getParticleColor);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.restore();
}
function neonNexus(ctx, node, settings, particleTime, getParticleColor) {
  const isStatic = isEffectivelyStatic(settings.animation);
  const glowRadius = calculateGlowRadius(node, settings.quality);
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, quality } = settings.quality;
  const { phase, animSpeed, direction, intensity } = settings.animation;
  ctx.save();
  ctx.translate(node.size[0] / 2, node.size[1] / 2);
  drawHoverOutline(ctx, node, settings);
  if (!node.particlesOnly) {
    const neonPhase = isStatic ? phase : phase * 0.5 * direction * animSpeed;
    const electricGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    const electricAlpha = 0.3 * glowIntensity * (0.6 + Math.sin(neonPhase) * 0.4);
    electricGlow.addColorStop(0, withAlpha(primary, electricAlpha));
    electricGlow.addColorStop(0.5, withAlpha(secondary, electricAlpha * 0.5));
    electricGlow.addColorStop(1, withAlpha(accent, 0));
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = electricGlow;
    ctx.globalAlpha = intensity * 0.8;
    ctx.fill();
    if (quality > 1) {
      const hexSize = glowRadius * 0.3;
      const hexCount = quality + 2;
      ctx.strokeStyle = withAlpha(primary, 0.3 * glowIntensity);
      ctx.lineWidth = 1;
      for (let i = 0; i < hexCount; i++) {
        const hexAngle = i / hexCount * Math.PI * 2 + neonPhase * 0.3;
        const hexDist = glowRadius * 0.6 * (1 + Math.sin(neonPhase + i) * 0.2);
        ctx.save();
        ctx.translate(Math.cos(hexAngle) * hexDist, Math.sin(hexAngle) * hexDist);
        ctx.rotate(hexAngle + neonPhase * 0.5);
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = j / 6 * Math.PI * 2;
          const x = Math.cos(angle) * hexSize;
          const y = Math.sin(angle) * hexSize;
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.globalAlpha = 0.2 + Math.sin(neonPhase + i * 0.5) * 0.1;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  drawParticles(ctx, node, settings, particleTime, getParticleColor);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.restore();
}
function cosmicRipple(ctx, node, settings, particleTime, getParticleColor) {
  const isStatic = isEffectivelyStatic(settings.animation);
  const glowRadius = calculateGlowRadius(node, settings.quality);
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, quality } = settings.quality;
  const { phase, animSpeed, intensity } = settings.animation;
  ctx.save();
  ctx.translate(node.size[0] / 2, node.size[1] / 2);
  drawHoverOutline(ctx, node, settings);
  if (!node.particlesOnly) {
    const ripplePhase = isStatic ? phase : phase * animSpeed;
    const rippleCount = quality + 2;
    for (let i = 0; i < rippleCount; i++) {
      const rippleProgress = (ripplePhase * 0.25 + i / rippleCount) % 1;
      const rippleRadius = glowRadius * 0.3 + glowRadius * 0.9 * rippleProgress;
      const rippleAlpha = (1 - rippleProgress) * 0.4 * glowIntensity * intensity;
      ctx.beginPath();
      ctx.arc(0, 0, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(
        i % 3 === 0 ? primary : i % 3 === 1 ? secondary : accent,
        rippleAlpha
      );
      ctx.lineWidth = 2 * (1 - rippleProgress);
      ctx.stroke();
    }
    const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * 0.4);
    centerGlow.addColorStop(0, withAlpha(primary, 0.4 * glowIntensity));
    centerGlow.addColorStop(1, withAlpha(accent, 0));
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = centerGlow;
    ctx.globalAlpha = intensity * 0.6;
    ctx.fill();
  }
  drawParticles(ctx, node, settings, particleTime, getParticleColor);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.restore();
}
function flowerOfLife(ctx, node, settings, particleTime, getParticleColor) {
  const isStatic = isEffectivelyStatic(settings.animation);
  const glowRadius = calculateGlowRadius(node, settings.quality);
  const { primary, secondary, accent } = settings.colors;
  const { glowIntensity, quality } = settings.quality;
  const { phase, animSpeed, direction, intensity } = settings.animation;
  ctx.save();
  ctx.translate(node.size[0] / 2, node.size[1] / 2);
  drawHoverOutline(ctx, node, settings);
  if (!node.particlesOnly) {
    const flowerPhase = isStatic ? phase : phase * 0.3 * direction * animSpeed;
    const petalRadius = glowRadius * 0.25;
    const petalCount = 6;
    ctx.save();
    ctx.rotate(flowerPhase * 0.5);
    for (let layer = 0; layer < quality; layer++) {
      const layerRadius = petalRadius * (1 + layer * 0.8);
      const layerAlpha = 0.3 * glowIntensity * (1 - layer * 0.2) * intensity;
      for (let i = 0; i < petalCount; i++) {
        const angle = i / petalCount * Math.PI * 2;
        const x = Math.cos(angle) * layerRadius;
        const y = Math.sin(angle) * layerRadius;
        ctx.beginPath();
        ctx.arc(x, y, petalRadius, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(
          layer % 3 === 0 ? primary : layer % 3 === 1 ? secondary : accent,
          layerAlpha
        );
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.arc(0, 0, petalRadius, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(primary, 0.4 * glowIntensity * intensity);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    const bgGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    bgGlow.addColorStop(0, withAlpha(primary, 0.15 * glowIntensity));
    bgGlow.addColorStop(0.5, withAlpha(secondary, 0.08 * glowIntensity));
    bgGlow.addColorStop(1, withAlpha(accent, 0));
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = bgGlow;
    ctx.globalAlpha = intensity * 0.5;
    ctx.fill();
  }
  drawParticles(ctx, node, settings, particleTime, getParticleColor);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.restore();
}
function getNodeEffect(style) {
  switch (style) {
    case 1:
      return gentlePulse;
    case 2:
      return neonNexus;
    case 3:
      return cosmicRipple;
    case 4:
      return flowerOfLife;
    default:
      return gentlePulse;
  }
}
function getSetting(name) {
  const defaultValue = NODE_DEFAULTS[name];
  return app.ui.settings.getSettingValue(name, defaultValue);
}
const ext = {
  name: "enhanced.node.animations",
  async setup(app2) {
    const state = createNodeState();
    const timing = createTimingManager();
    let isEnabled = true;
    let pauseDuringRender = true;
    let animStyle = 0;
    let lastSettingsUpdate = 0;
    function updateSettingsCache() {
      isEnabled = getSetting("📦 Enhanced Nodes.Animations.Enabled");
      pauseDuringRender = getSetting("📦 Enhanced Nodes.Pause.During.Render");
      animStyle = getSetting("📦 Enhanced Nodes.Animate");
    }
    function renderLoop(timestamp) {
      if (timestamp - lastSettingsUpdate > 500) {
        updateSettingsCache();
        lastSettingsUpdate = timestamp;
      }
      timing.update(timestamp);
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
      const speed = getSetting("📦 Enhanced Nodes.Animation.Speed");
      const dt = (timestamp - state.lastFrame) / 1e3;
      state.lastFrame = timestamp;
      state.phase += dt * speed;
      app2.graph?.setDirtyCanvas(true, false);
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
    const originalDrawNode = LGraphCanvas.prototype.drawNode;
    LGraphCanvas.prototype.drawNode = function(node, ctx) {
      if (isEnabled && animStyle > 0 && state.isRunning) {
        const effectName = animStyle === 1 ? "gentlePulse" : animStyle === 2 ? "neonNexus" : animStyle === 3 ? "cosmicRipple" : animStyle === 4 ? "flowerOfLife" : "gentlePulse";
        const effect = getNodeEffect(effectName);
        if (effect) {
          const glowIntensity = getSetting("📦 Enhanced Nodes.Glow.Intensity") || 1;
          const glowSize = getSetting("📦 Enhanced Nodes.Animation.Size") || 1;
          const quality = getSetting("📦 Enhanced Nodes.Quality") || 1;
          const isRunning = node.id === app2.runningNodeId;
          const isSelected = this.selected_nodes && this.selected_nodes[node.id];
          const primaryColor = isRunning ? "#00ff00" : isSelected ? "#00ffff" : node.color || "#333";
          ctx.save();
          effect(
            ctx,
            node,
            {
              animation: { phase: state.phase, intensity: glowIntensity, direction: 1, animSpeed: 1, isStaticMode: false, isPaused: false },
              quality: { quality, animationSize: glowSize, glowIntensity },
              particles: { showParticles: true, density: 1, speed: 1, intensity: 1, size: 1, glowIntensity: 0.5 * glowIntensity },
              colors: { primary: primaryColor, secondary: "#ffffff", accent: primaryColor, hoverColor: primaryColor, showHover: true }
            },
            state.phase,
            () => primaryColor
          );
          ctx.restore();
        }
      }
      originalDrawNode.call(this, node, ctx);
    };
    app2.ui.settings.addSetting({
      id: "📦 Enhanced Nodes.UI & Æmotion Studio About",
      name: "🔽 Info Panel",
      type: "combo",
      options: [
        { value: 0, text: "Closed Panel" },
        { value: 1, text: "Open Panel" }
      ],
      defaultValue: NODE_DEFAULTS["📦 Enhanced Nodes.UI & Æmotion Studio About"],
      onChange: (value) => {
        if (value === 1) {
          document.body.appendChild(createPatternDesignerWindow());
          setTimeout(() => app2.ui.settings.setSettingValue("📦 Enhanced Nodes.UI & Æmotion Studio About", 0), 100);
        }
      }
    });
    console.log("[EnhancedNodes] Extension registered and ready.");
  }
};
app.registerExtension(ext);
//# sourceMappingURL=node_animations.js.map
