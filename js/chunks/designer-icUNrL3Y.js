const PHI = 1.618033988749895;
const ANIMATION = Object.freeze({
  /** Target frame interval in ms (~60fps) */
  RAF_THROTTLE: 1e3 / 60,
  /** Maximum size of particle pool */
  PARTICLE_POOL_SIZE: 1e3,
  /** Smoothing factor for delta time */
  SMOOTH_FACTOR: 0.95,
  /** Maximum delta time cap (seconds) */
  MAX_DELTA: 1 / 30,
  /** Default transition speed for phase animations */
  TRANSITION_SPEED: 2 * Math.PI / 15,
  /** Faster transition speed for more responsive animations */
  FAST_TRANSITION_SPEED: 2 * Math.PI / 10
});
const LINK_DEFAULTS = Object.freeze({
  "🔗 Enhanced Links.Animate": 9,
  // Classic Flow
  "🔗 Enhanced Links.Animation.Speed": 1,
  // Normal speed
  "🔗 Enhanced Links.Color.Mode": "default",
  // Default colors
  "🔗 Enhanced Links.Color.Accent": "#9d00ff",
  // Purple
  "🔗 Enhanced Links.Color.Secondary": "#fb00ff",
  // Pink
  "🔗 Enhanced Links.Color.Primary": "#ffb300",
  // Orange
  "🔗 Enhanced Links.Color.Scheme": "default",
  // Original colors
  "🔗 Enhanced Links.Direction": 1,
  // Forward
  "🔗 Enhanced Links.Glow.Intensity": 10,
  // Medium glow
  "🔗 Enhanced Links.Link.Style": "spline",
  // Spline style
  "🔗 Enhanced Links.Marker.Enabled": true,
  // Markers enabled
  "🔗 Enhanced Links.Marker.Effects": "none",
  // No effects
  "🔗 Enhanced Links.Marker.Glow": 10,
  // Medium glow
  "🔗 Enhanced Links.Marker.Color": "#00fff7",
  // Cyan
  "🔗 Enhanced Links.Marker.Color.Mode": "default",
  // Default colors
  "🔗 Enhanced Links.Marker.Size": 3,
  // Large size
  "🔗 Enhanced Links.Marker.Shape": "arrow",
  // Arrow shape
  "🔗 Enhanced Links.Particle.Density": 0.5,
  // Minimal
  "🔗 Enhanced Links.Quality": 1,
  // Basic (Fast)
  "🔗 Enhanced Links.Link.Shadow.Enabled": true,
  // Link shadows
  "🔗 Enhanced Links.Marker.Shadow.Enabled": true,
  // Marker shadows
  "🔗 Enhanced Links.Thickness": 3,
  // Medium thickness
  "🔗 Enhanced Links.UI & Æmotion Studio About": 0,
  // Closed panel
  "🔗 Enhanced Links.Static.Mode": false,
  // Animated mode
  "🔗 Enhanced Links.Pause.During.Render": true
  // Pause during render
});
const NODE_DEFAULTS = Object.freeze({
  "📦 Enhanced Nodes.Animate": 1,
  // Gentle Pulse
  "📦 Enhanced Nodes.Animation.Glow": 0.5,
  // Medium glow
  "📦 Enhanced Nodes.Animation.Size": 1,
  // Normal size
  "📦 Enhanced Nodes.Animation.Speed": 1,
  // Normal speed
  "📦 Enhanced Nodes.Animations.Enabled": true,
  // Animations on
  "📦 Enhanced Nodes.Color.Accent": "#0088ff",
  // Deep blue
  "📦 Enhanced Nodes.Color.Mode": "default",
  // Default colors
  "📦 Enhanced Nodes.Color.Particle": "#ffff00",
  // Yellow
  "📦 Enhanced Nodes.Color.Primary": "#44aaff",
  // Bright blue
  "📦 Enhanced Nodes.Color.Scheme": "default",
  // Original colors
  "📦 Enhanced Nodes.Color.Secondary": "#88ccff",
  // Light blue
  "📦 Enhanced Nodes.Direction": 1,
  // Forward
  "📦 Enhanced Nodes.End Animation.Enabled": false,
  // No end animation
  "📦 Enhanced Nodes.Glow": 0.5,
  // Medium glow
  "📦 Enhanced Nodes.Glow.Show": true,
  // Show glow
  "📦 Enhanced Nodes.Intensity": 1,
  // Normal intensity
  "📦 Enhanced Nodes.Particle.Color.Mode": "default",
  // Default particle colors
  "📦 Enhanced Nodes.Particle.Density": 1,
  // Normal density
  "📦 Enhanced Nodes.Particle.Glow": 0.5,
  // Medium particle glow
  "📦 Enhanced Nodes.Particle.Intensity": 1,
  // Normal intensity
  "📦 Enhanced Nodes.Particle.Show": true,
  // Show particles
  "📦 Enhanced Nodes.Particle.Size": 1,
  // Normal size
  "📦 Enhanced Nodes.Particle.Speed": 1,
  // Normal speed
  "📦 Enhanced Nodes.Quality": 2,
  // Balanced
  "📦 Enhanced Nodes.Static.Mode": false,
  // Animated mode
  "📦 Enhanced Nodes.Pause.During.Render": true,
  // Pause during render
  "📦 Enhanced Nodes.Text.Animation.Enabled": false,
  // No text animation
  "📦 Enhanced Nodes.Text.Color": "#00ffff",
  // Cyan
  "📦 Enhanced Nodes.UI & Æmotion Studio About": 0
  // Closed panel
});
function createLinkState() {
  return {
    isRunning: false,
    phase: 0,
    lastFrame: performance.now(),
    animationFrame: null,
    particlePool: /* @__PURE__ */ new Map(),
    activeParticles: /* @__PURE__ */ new Set(),
    totalTime: 0,
    speedMultiplier: 1,
    linkPositions: /* @__PURE__ */ new Map(),
    lastNodePositions: /* @__PURE__ */ new Map(),
    staticPhase: Math.PI / 4,
    lastAnimStyle: null,
    lastLinkStyle: null,
    forceUpdate: false,
    forceRedraw: false,
    lastRenderState: null,
    lastSettings: null
  };
}
function createNodeState() {
  return {
    isRunning: false,
    phase: 0,
    particlePhase: 0,
    lastFrame: performance.now(),
    lastRAFTime: 0,
    animationFrame: null,
    totalTime: 0,
    speedMultiplier: 1,
    staticPhase: Math.PI / 4,
    forceUpdate: false,
    forceRedraw: false,
    lastRenderState: null,
    nodeEffects: /* @__PURE__ */ new Map(),
    isAnimating: false,
    frameSkipCount: 0,
    maxFrameSkips: 3,
    lastAnimStyle: null,
    particlePool: /* @__PURE__ */ new Map(),
    activeParticles: /* @__PURE__ */ new Set(),
    playCompletionAnimation: false,
    completionPhase: 0,
    completingNodes: /* @__PURE__ */ new Set(),
    disabledCompletionNodes: /* @__PURE__ */ new Set(),
    primaryCompletionNode: null
  };
}
function createTimingManager() {
  const state = {
    smoothDelta: 0,
    frameCount: 0,
    lastTime: performance.now()
  };
  return {
    ...state,
    get smoothDelta() {
      return state.smoothDelta;
    },
    get frameCount() {
      return state.frameCount;
    },
    get lastTime() {
      return state.lastTime;
    },
    /**
     * Update timing and return smoothed delta time
     * @param currentTime - Current timestamp from performance.now()
     * @returns Smoothed delta time in seconds
     */
    update(currentTime) {
      const rawDelta = Math.min(
        (currentTime - state.lastTime) / 1e3,
        ANIMATION.MAX_DELTA
      );
      state.lastTime = currentTime;
      state.frameCount++;
      state.smoothDelta = state.smoothDelta * ANIMATION.SMOOTH_FACTOR + rawDelta * (1 - ANIMATION.SMOOTH_FACTOR);
      return state.smoothDelta;
    },
    /**
     * Reset timing state
     */
    reset() {
      state.smoothDelta = 0;
      state.frameCount = 0;
      state.lastTime = performance.now();
    }
  };
}
function validateHexColor(color) {
  if (!color || typeof color !== "string") return null;
  const normalized = color.startsWith("#") ? color : `#${color}`;
  if (!/^#[0-9A-Fa-f]{6}$/i.test(normalized)) return null;
  return normalized.toLowerCase();
}
function hexToRgb(hex) {
  const validated = validateHexColor(hex);
  if (!validated) return null;
  return {
    r: parseInt(validated.slice(1, 3), 16),
    g: parseInt(validated.slice(3, 5), 16),
    b: parseInt(validated.slice(5, 7), 16)
  };
}
function withAlpha(color, alpha) {
  const validAlpha = Math.max(0, Math.min(1, alpha));
  if (!color) {
    return `rgba(0, 255, 255, ${validAlpha})`;
  }
  if (typeof color === "string" && color.startsWith("#")) {
    const rgb = hexToRgb(color);
    if (rgb) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${validAlpha})`;
    }
    return `rgba(0, 255, 255, ${validAlpha})`;
  }
  if (typeof color === "string" && color.startsWith("hsl(")) {
    return color.replace(/hsl\((.*)\)/, `hsla($1, ${validAlpha})`);
  }
  if (typeof color === "string" && color.startsWith("hsla(")) {
    return color.replace(/hsla\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `hsla($1,$2,$3, ${validAlpha})`);
  }
  if (typeof color === "string" && color.startsWith("rgba(")) {
    return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3, ${validAlpha})`);
  }
  return color;
}
const generateNonce = () => {
  if (typeof window !== "undefined" && window.crypto) {
    if (typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    if (typeof window.crypto.getRandomValues === "function") {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
  }
  throw new Error("Secure random number generation is not available.");
};
const createPatternDesignerWindow = () => {
  const previousFocus = document.activeElement;
  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "designer-title");
  modal.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: #0a0a0a;
        padding: 10px;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
        width: 90vw;
        height: 90vh;
        display: flex;
        flex-direction: column;
    `;
  const titleBar = document.createElement("div");
  titleBar.style.cssText = `
        padding: 10px;
        margin-bottom: 10px;
        cursor: move;
        background-color: #2a2a2a;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
  const title = document.createElement("span");
  title.id = "designer-title";
  title.textContent = "About Æmotion Studio";
  title.style.cssText = `
        color: #e0e0e0;
        font-weight: bold;
        font-family: 'Orbitron', sans-serif;
    `;
  titleBar.appendChild(title);
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  const onMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      modal.style.left = currentX + "px";
      modal.style.top = currentY + "px";
    }
  };
  const onMouseUp = () => {
    isDragging = false;
  };
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      closeButton.click();
    }
  };
  document.addEventListener("keydown", onKeyDown);
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.setAttribute("title", "Close");
  closeButton.style.cssText = `
        background: none;
        border: none;
        color: #e0e0e0;
        font-size: 20px;
        cursor: pointer;
        transition: color 0.2s ease;
    `;
  closeButton.onclick = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("keydown", onKeyDown);
    modal.remove();
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  };
  closeButton.onmouseenter = () => {
    closeButton.style.color = "#ffffff";
  };
  closeButton.onmouseleave = () => {
    closeButton.style.color = "#e0e0e0";
  };
  titleBar.appendChild(closeButton);
  modal.appendChild(titleBar);
  const iframe = document.createElement("iframe");
  iframe.style.cssText = `
        flex: 1;
        border: none;
        border-radius: 4px;
        background-color: #1a1a1a;
    `;
  const nonce = generateNonce();
  const htmlContent = `
        <html lang="en">
            <head>
            <meta charset="UTF-8" />
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none';" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Æmotion Studio</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
                href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Montserrat:wght@300;400;700&display=swap"
                rel="stylesheet"
            />
                <style id="injected-styles" nonce="${nonce}">
                /* Styles will be injected here programmatically */
                </style>
                <style nonce="${nonce}">
                * {
                    box-sizing: border-box;
                        margin: 0;
                    padding: 0;
                }

                body {
                    background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
                    font-family: 'Montserrat', sans-serif;
                    overflow: hidden;
                    color: #e0e0e0;
                }

                #overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: radial-gradient(circle, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2));
                    z-index: 1000;
                    pointer-events: none;
                    animation: fadeOut 1.5s ease-out forwards;
                }

                @keyframes fadeOut {
                    from { opacity: 0.8; }
                    to { opacity: 0; }
                }

                #splash {
                        width: 100%;
                    height: 100vh;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding-top: 40px;
                    overflow-y: auto;
                    background: radial-gradient(circle at center, rgba(40,40,40,0.2) 0%, rgba(0,0,0,0.4) 100%);
                    animation: splashEntrance 1s ease-out forwards;
                }

                @keyframes splashEntrance {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                #centerTitle {
                    font-size: 3rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    -webkit-text-stroke: 2px var(--text-color);
                    color: white;
                    text-shadow: 0 0 10px var(--text-glow);
                    animation: textGlow 6s ease-in-out infinite; 
                    font-family: 'Orbitron', sans-serif;
                    margin-bottom: 1rem;
                    --text-color: #00ffff;
                    --text-glow: rgba(0, 255, 255, 0.8);
                }

                @keyframes textGlow {
                    0% {
                        -webkit-text-stroke: 2px rgba(0, 255, 255, 1);
                        text-shadow:
                            0 0 10px rgba(0, 255, 255, 0.8),
                            0 0 20px rgba(0, 255, 255, 0.4);
                    }
                    50% {
                        -webkit-text-stroke: 2px rgba(0, 255, 255, 0.5);
                        text-shadow:
                            0 0 15px rgba(0, 255, 255, 0.4),
                            0 0 25px rgba(0, 255, 255, 0.2);
                    }
                    100% {
                        -webkit-text-stroke: 2px rgba(0, 255, 255, 1);
                        text-shadow:
                            0 0 10px rgba(0, 255, 255, 0.8),
                            0 0 20px rgba(0, 255, 255, 0.4);
                    }
                }

                #ballsContainer {
                    position: relative;
                    width: 100%;
                    height: 45vh;  
                    margin-top: 0; 
                    perspective: 1000px;
                }

                #ballsContainer:has(.ball-link:hover) .ball-link {
                    animation-play-state: paused;
                }

                .ball-link {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    text-decoration: none;
                    color: inherit;
                    transition: transform 0.3s ease;
                    animation: orbitalMotion 20s linear infinite;
                    transform-origin: 50% 160px;
                }

                .ball-link:nth-child(1) { animation-delay: 0s; }
                .ball-link:nth-child(2) { animation-delay: -5s; }
                .ball-link:nth-child(3) { animation-delay: -10s; }
                .ball-link:nth-child(4) { animation-delay: -15s; }

                @keyframes orbitalMotion {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg) translateY(-160px) rotate(0deg) scale(0.7);
                    }
                    25% {
                        transform: translate(-50%, -50%) rotate(-90deg) translateY(-160px) rotate(90deg) scale(1);
                    }
                    50% {
                        transform: translate(-50%, -50%) rotate(-180deg) translateY(-160px) rotate(180deg) scale(1.3);
                    }
                    75% {
                        transform: translate(-50%, -50%) rotate(-270deg) translateY(-160px) rotate(270deg) scale(1);
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(-360deg) translateY(-160px) rotate(360deg) scale(0.7);
                    }
                }

                .ball-link:hover {
                    transform: translate(-50%, -50%) scale(1.1);
                }

                .sphere-container {
                    width: 90px;
                    height: 90px;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: hoverEffect 3s ease-in-out infinite;
                    animation-play-state: running !important;
                }

                .sphere {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    cursor: pointer;
                    pointer-events: auto;
                }

                .logo {
                    position: absolute;
                    top: 53%; 
                    left: 50%;
                    transform: translate(-50%, -50%);
                    filter: drop-shadow(0 0 2px rgba(255,255,255,0.5));
                    z-index: 1;
                    pointer-events: none;
                }

                @keyframes hoverEffect {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0); }
                }

                .sphere-container.youtube,
                .sphere-container.github,
                .sphere-container.discord,
                .sphere-container.website {
                    width: 90px;
                    height: 90px;
                }

                .logo svg {
                    width: 30px;
                    height: 30px;
                    transition: all 0.3s ease;
                }

                .sphere {
                    transition: all 0.3s ease;
                }

                .sphere::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%,
                        rgba(255, 255, 255, 0.3) 0%,
                        rgba(255, 255, 255, 0.1) 50%,
                        rgba(0, 0, 0, 0.1) 100%);
                    pointer-events: none;
                }

                .sphere-youtube {
                    background: radial-gradient(circle at 30% 30%,
                        rgba(255, 0, 0, 0.8) 0%,
                        rgba(255, 0, 0, 0.2) 60%,
                        rgba(255, 0, 0, 0) 100%);
                    box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
                }

                .sphere-github {
                    background: radial-gradient(circle at 30% 30%,
                        rgba(51, 51, 51, 0.8) 0%,
                        rgba(51, 51, 51, 0.2) 60%,
                        rgba(51, 51, 51, 0) 100%);
                    box-shadow: 0 0 30px rgba(51, 51, 51, 0.3);
                }

                .sphere-discord {
                    background: radial-gradient(circle at 30% 30%,
                        rgba(88, 101, 242, 0.8) 0%,
                        rgba(88, 101, 242, 0.2) 60%,
                        rgba(88, 101, 242, 0) 100%);
                    box-shadow: 0 0 30px rgba(88, 101, 242, 0.3);
                }

                .sphere-website {
                    background: radial-gradient(circle at 30% 30%,
                        rgba(255, 0, 255, 0.8) 0%,
                        rgba(255, 0, 255, 0.2) 60%,
                        rgba(255, 0, 255, 0) 100%);
                    box-shadow: 0 0 30px rgba(255, 0, 255, 0.3);
                }

                #about {
                    margin-top: 5px;
                    padding: 12px;
                    font-size: 0.8rem;
                    max-width: 550px;
                    color: white;
                    text-align: center;
                    line-height: 1.4;
                    background: rgba(255,255,255,0.05);
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    transition: transform 0.3s ease;
                    --text-color: #00ffff;
                }

                #aboutContent {
                    margin-bottom: 12px;
                }

                #aboutContent p {
                    margin-bottom: 0.5em;
                    line-height: 1.3;
                    color: white;
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                    transition: text-shadow 0.3s ease;
                    font-size: 0.95rem;
                    letter-spacing: -0.01em;
                    font-weight: 400;
                }

                #aboutContent p:hover {
                    text-shadow: 0 0 15px #00ffff;
                }

                #rainbowText {
                    font-size: 1rem;
                    margin-top: 10px;
                    font-weight: bold;
                    text-align: center;
                    font-family: 'Orbitron', sans-serif;
                    letter-spacing: 0.02em;
                    padding-top: 2px;
                    color: #ff00ff;
                }

                @keyframes rainbowWave {
                    0% { transform: translateY(0); color: #ff00ff; }
                    20% { transform: translateY(-5px); color: #ff40ff; }
                    40% { transform: translateY(0); color: #ff00ff; }
                    60% { transform: translateY(-5px); color: #ff40ff; }
                    80% { transform: translateY(0); color: #ff00ff; }
                    100% { transform: translateY(0); color: #ff00ff; }
                }

                .sphere-container.youtube .logo svg {
                    width: 45px;
                    height: 35px;
                    filter: drop-shadow(0 0 2px rgba(255,255,255,0.6));
                }

                .sphere-container.github .logo svg,
                .sphere-container.discord .logo svg,
                .sphere-container.website .logo svg {
                    width: 40px;
                    height: 40px;
                    filter: drop-shadow(0 0 2px rgba(255,255,255,0.6));
                }
            </style>
        </head>
        <body>
            <div id="overlay"></div>
            <div id="splash">
                <div id="centerTitle">Æmotion Studio</div>
                <div id="ballsContainer">
                    <a class="ball-link" href="https://www.youtube.com/@aemotionstudio/videos" target="_blank" rel="noopener noreferrer" aria-label="YouTube Channel" title="YouTube Channel">
                        <div class="sphere-container youtube">
                            <div class="sphere sphere-youtube"></div>
                            <div class="logo">
                                <svg viewBox="0 0 71.412065 50" width="45" height="35" xmlns="http://www.w3.org/2000/svg" fill="white">
                                    <path d="M69.912,7.82a8.977,8.977,0,0,0-6.293-6.293C58.019,0,35.706,0,35.706,0S13.393,0,7.793,1.527A8.977,8.977,0,0,0,1.5,7.82C0,13.42,0,25,0,25S0,36.58,1.5,42.18a8.977,8.977,0,0,0,6.293,6.293C13.393,50,35.706,50,35.706,50s22.313,0,27.913-1.527a8.977,8.977,0,0,0,6.293-6.293C71.412,36.58,71.412,25,71.412,25S71.412,13.42,69.912,7.82ZM28.564,35.714V14.286L47.471,25Z"/>
                                </svg>
                            </div>
                        </div>
                    </a>
                    <a class="ball-link" href="https://github.com/AEmotionStudio/" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository" title="GitHub Repository">
                        <div class="sphere-container github">
                            <div class="sphere sphere-github"></div>
                            <div class="logo">
                                <svg viewBox="0 0 98 96" width="40" height="40" xmlns="http://www.w3.org/2000/svg" fill="white">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 5.052 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                                </svg>
                            </div>
                        </div>
                    </a>
                    <a class="ball-link" href="https://discord.gg/UzC9353mfp" target="_blank" rel="noopener noreferrer" aria-label="Join Discord Server" title="Join Discord Server">
                        <div class="sphere-container discord">
                            <div class="sphere sphere-discord"></div>
                            <div class="logo">
                                <svg viewBox="0 0 127.14 96.36" width="40" height="40" xmlns="http://www.w3.org/2000/svg" fill="white">
                                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                                </svg>
                            </div>
                        </div>
                    </a>
                    <a class="ball-link" href="https://aemotionstudio.org/" target="_blank" rel="noopener noreferrer" aria-label="Visit Website" title="Visit Website">
                        <div class="sphere-container website">
                            <div class="sphere sphere-website"></div>
                            <div class="logo">
                                <svg viewBox="0 0 512 512" width="40" height="40" xmlns="http://www.w3.org/2000/svg" fill="white">
                                    <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM256 336c44.13 0 80-35.88 80-80c0-44.13-35.88-80-80-80c-44.13 0-80 35.88-80 80C176 291.9 211.9 328 256 328zM256 208c26.47 0 48 21.53 48 48s-21.53 48-48 48s-48-21.53-48-48S229.5 208 256 208zM256 128c70.75 0 128 57.25 128 128s-57.25 128-128 128s-128-57.25-128-128S185.3 128 256 128z"/>
                                </svg>
                            </div>
                        </div>
                    </a>
                </div>
                <div id="about">
                    <div id="aboutContent">
                        <p>
                            Æmotion Studio is a cutting-edge art collective that pushes the boundaries of creativity and technology.
                        </p>
                        <p>
                            Our mission is to provide spaces where artists, engineers, AI enthusiasts, and art lovers can explore, create, and experience the future of digital art and digital performances together.
                        </p>
                        <p>
                            As both founder and lead artist, Æmotion is actively seeking partners, artists, engineers, and developers to join in expanding the studio's vision. Whether you're interested in collaboration, investment opportunities, or commissioning work, let's create something extraordinary together.
                        </p>
                    </div>
                    <p id="rainbowText">Click the links above for more!</p>
                </div>
            </div>
            <script nonce="${nonce}">
                document.addEventListener("DOMContentLoaded", () => {
                    console.log("Æmotion Studio splash page loaded with enhanced CSS spheres and dynamic about text.");
                    addRainbowEffect();

                    const overlay = document.getElementById("overlay");
                    if (overlay) {
                        overlay.addEventListener("animationend", () => {
                            overlay.remove();
                        });
                    }
                });

                function addRainbowEffect() {
                    const rainbowElem = document.getElementById("rainbowText");
                    const text = rainbowElem.textContent;
                    rainbowElem.innerHTML = "";
                    text.split("").forEach((char, index) => {
                        const span = document.createElement("span");
                        span.textContent = char === " " ? " " : char;
                        span.style.whiteSpace = "pre";
                        span.style.animation = \`rainbowWave 2s infinite\`;
                        span.style.animationDelay = \`\${index * 0.1}s\`;
                        rainbowElem.appendChild(span);
                    });
                }
                <\/script>
            </body>
        </html>
    `;
  iframe.onload = () => {
    try {
      const doc = iframe.contentDocument;
      if (doc) {
        const injectedStyles = doc.getElementById("injected-styles");
        const parentStyles = document.querySelector("style");
        if (injectedStyles && parentStyles) {
          injectedStyles.textContent = parentStyles.textContent;
        }
      }
    } catch (e) {
      console.error("Error injecting styles into pattern designer window:", e);
    }
  };
  iframe.srcdoc = htmlContent;
  modal.appendChild(iframe);
  titleBar.onmousedown = (e) => {
    isDragging = true;
    const rect = modal.getBoundingClientRect();
    modal.style.transform = "none";
    modal.style.left = rect.left + "px";
    modal.style.top = rect.top + "px";
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;
  };
  setTimeout(() => {
    closeButton.focus();
  }, 10);
  return modal;
};
export {
  LINK_DEFAULTS as L,
  NODE_DEFAULTS as N,
  PHI as P,
  createTimingManager as a,
  createPatternDesignerWindow as b,
  createLinkState as c,
  createNodeState as d,
  hexToRgb as h,
  withAlpha as w
};
//# sourceMappingURL=designer-icUNrL3Y.js.map
