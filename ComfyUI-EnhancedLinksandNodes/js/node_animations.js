import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

// Configuration constants with expanded sacred geometry
export const CONFIG = {
    PHI: 1.618033988749895,
    SACRED: {
        TRINITY: 3,
        HARMONY: 7,
        COMPLETION: 12,
        FIBONACCI: [1, 1, 2, 3, 5, 8, 13, 21],
        QUANTUM: 5,
        INFINITY: 8
    },
    ANIMATION: {
        RAF_THROTTLE: 1000 / 60,
        PARTICLE_POOL_SIZE: 1000
    }
};

// Utility function for handling color alpha values
const withAlpha = (color, alpha) => {
    const validAlpha = Math.max(0, Math.min(1, alpha));
    const defaultColor = "#00ffff"; // Default to cyan instead of white
    if (!color) return `rgba(0,255,255,${validAlpha})`; // Default to cyan
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        return `rgba(${r},${g},${b},${validAlpha})`;
    }
    if (color.startsWith('hsl')) {
        return color.replace(/hsl\((.*)\)/, `hsla($1,${validAlpha})`);
    }
    return color;
};

app.registerExtension({
    name: "enhanced.node.animations",
    async setup() {
        // Enhanced State Management
        const State = {
            isRunning: false,
            phase: 0,
            particlePhase: 0,
            lastFrame: performance.now(),
            lastRAFTime: 0,
            animationFrame: null,
            nodeEffects: new Map(),
            isAnimating: false,
            frameSkipCount: 0,
            maxFrameSkips: 3,
            totalTime: 0,
            speedMultiplier: 1,
            staticPhase: Math.PI / 4,
            lastAnimStyle: null,
            forceUpdate: false,
            forceRedraw: false,
            lastRenderState: null,
            particlePool: new Map(),
            activeParticles: new Set(),
            playCompletionAnimation: false,
            completionPhase: 0,
            completingNodes: new Set(), // Add this to track which nodes are completing
            disabledCompletionNodes: new Set(), // Add this to track nodes with disabled completion animations
            primaryCompletionNode: null, // Add this to track the primary completion animation node
        };

        // Enhanced Animation Controller
        const AnimationController = {
            targetPhase: 0,
            smoothFactor: 0.95,
            lastPhaseUpdate: 0,
            direction: 1,
            transitionSpeed: (2 * Math.PI) / (10 * 1.5), // Slightly faster than before (was 2)
            
            update(currentTime, delta) {
                const direction = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Direction", 1);
                const animSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Speed", 1));
                
                if (this.direction !== direction) {
                    this.direction = direction;
                    this.targetPhase = State.phase + Math.PI * 2 * this.direction;
                }
                
                if (currentTime - this.lastPhaseUpdate >= 16) {
                    const phaseStep = this.transitionSpeed * delta * animSpeed;
                    
                    if (Math.abs(this.targetPhase - State.phase) > 0.01) {
                        State.phase += Math.sign(this.targetPhase - State.phase) * phaseStep;
                    } else {
                        // Continuous phase progression without modulo reset
                        State.phase += phaseStep * this.direction;
                        this.targetPhase = State.phase;
                    }
                    
                    this.lastPhaseUpdate = currentTime;
                }
                return State.phase;
            }
        };

        // Add new Particle Controller for independent particle timing
        const ParticleController = {
            phase: 0,
            lastUpdate: 0,
            direction: 1,
            transitionSpeed: (2 * Math.PI) / (10 * 1.5),
            
            update(currentTime, delta) {
                const direction = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Direction", 1);
                const particleSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Speed", 1));
                
                if (this.direction !== direction) {
                    this.direction = direction;
                }
                
                if (currentTime - this.lastUpdate >= 16) {
                    const phaseStep = this.transitionSpeed * delta * particleSpeed;
                    this.phase += phaseStep * this.direction;
                    this.lastUpdate = currentTime;
                }
                
                return this.phase;
            }
        };

        // Enhanced Performance-Optimized Timer
        const TimingManager = {
            smoothDelta: 0,
            frameCount: 0,
            lastTime: performance.now(),
            
            update(currentTime) {
                const rawDelta = Math.min((currentTime - this.lastTime) / 1000, 1/30);
                this.lastTime = currentTime;
                
                this.frameCount++;
                this.smoothDelta = this.smoothDelta * 0.9 + rawDelta * 0.1;
                return this.smoothDelta;
            }
        };

        // Default settings configuration
        const DEFAULT_SETTINGS = {
            "📦 Enhanced Nodes.Animate": 2,                    // Neon Nexus
            "📦 Enhanced Nodes.Animation.Speed": 1,            // Normal speed
            "📦 Enhanced Nodes.Color.Mode": "custom",         // Custom colors
            "📦 Enhanced Nodes.Color.Accent": "#9d00ff",      // Purple
            "📦 Enhanced Nodes.Color.Secondary": "#fb00ff",   // Pink
            "📦 Enhanced Nodes.Color.Primary": "#ffb300",     // Orange
            "📦 Enhanced Nodes.Color.Hover": "#00ff15",       // Green
            "📦 Enhanced Nodes.Color.Hover.Show": false,      // Hide Hover outline
            "📦 Enhanced Nodes.Color.Particle": "#ffb300",    // Orange for particles
            "📦 Enhanced Nodes.Color.Scheme": "default",      // Original colors
            "📦 Enhanced Nodes.Direction": 1,                 // Forward
            "📦 Enhanced Nodes.Glow": 1.0,                   // Full glow for node background
            "📦 Enhanced Nodes.Animation.Glow": 0.5,         // Medium glow for animations
            "📦 Enhanced Nodes.Particle.Glow": 1.0,          // Full particle glow
            "📦 Enhanced Nodes.Intensity": 1.0,              // Normal intensity
            "📦 Enhanced Nodes.Particle.Intensity": 1.0,     // Normal particle intensity
            "📦 Enhanced Nodes.Particle.Density": 0.5,       // Minimal
            "📦 Enhanced Nodes.Particle.Show": true,         // Show particles
            "📦 Enhanced Nodes.Particle.Color.Mode": "default", // Default particle color mode
            "📦 Enhanced Nodes.Particle.Speed": 1,           // Normal particle speed
            "📦 Enhanced Nodes.Pause.During.Render": true,   // Pause during render
            "📦 Enhanced Nodes.Quality": 1,                  // Basic (Fast)
            "📦 Enhanced Nodes.Static.Mode": false,          // Animated mode
            "📦 Enhanced Nodes.UI & Æmotion Studio About": 0, // Closed panel
            "📦 Enhanced Nodes.Animation.Size": 1,            // Animation scale
            "📦 Enhanced Nodes.Glow.Show": true,             // Show node glow
            "📦 Enhanced Nodes.Animations.Enabled": true,     // Enable animations
            "📦 Enhanced Nodes.Text.Letter.Spacing": 0,      // Normal letter spacing
            "📦 Enhanced Nodes.End Animation.Enabled": false, // Disable completion effect
            "📦 Enhanced Nodes.Text.Animation.Enabled": false, // Disable text animation
            "📦 Enhanced Nodes.Text.Glow": 1.0,              // Full text glow
        };

        // Function to safely apply default settings
        const applyDefaultSettings = () => {
            try {
                Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
                    const setting = app.ui.settings.items.find(s => s.id === key);
                    if (setting && app.ui.settings.getSettingValue(key) === undefined) {
                        app.ui.settings.setSettingValue(key, value);
                        
                        // Call the callback if it exists to ensure UI updates
                        if (setting.callback) {
                            setting.callback(value);
                        }
                    }
                });

                // Force a canvas update after applying all defaults
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            } catch (error) {
                console.warn("Error applying default settings:", error);
            }
        };

        // Enhanced Visual Settings
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Alert",
            name: "⚠️ This window is draggable. Drag for a better view of nodes.",
            type: "button",
            tooltip: "This is just a placeholder to display this tip message.",
            callback: () => {}  // Empty callback as this is just a placeholder
        });

        // Animation Style Settings Group
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Animate",
            name: "✨ Node Animation Style",
            type: "combo",
            options: [
                {value: 0, text: "⭘ Off"},
                {value: 1, text: "💫 Gentle Pulse"},
                {value: 2, text: "🌟 Neon Nexus"},
                {value: 3, text: "🌌 Cosmic Ripple"},
                {value: 4, text: "🌺 Flower of Life"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Animate"],
            tooltip: "Select animation style. You can also right click nodes to set individual animation styles.",
            callback: () => {
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            }
        });

        // Add animations enabled toggle
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Animations.Enabled",
            name: "✨ Enable Animations",
            type: "combo",
            options: [
                {value: true, text: "✅ Animations On"},
                {value: false, text: "🌠 Particles Only"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Animations.Enabled"],
            tooltip: "Toggle between full animations or particles-only mode for any animation style.",
            callback: () => {
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            }
        });

        // Add completion animation setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.End Animation.Enabled",
            name: "🎆 Completion Effect",
            type: "combo",
            options: [
                {value: false, text: "❌ Disabled"},
                {value: true, text: "✅ Enabled"}
            ],
            defaultValue: false,
            tooltip: "Play animation when rendering completes. Right click nodes to set a primary source."
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Static.Mode",
            name: "🎨 Animation Mode",
            type: "combo",
            options: [
                {value: false, text: "✨ Animated"},
                {value: true, text: "🖼️ Static"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Static.Mode"],
            tooltip: "Keep the visual style but disables animations."
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Direction",
            name: "🔄 Animation Direction",
            type: "combo",
            options: [
                {value: 1, text: "Clockwise ⟳"},
                {value: -1, text: "Counter-Clockwise ⟲"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Direction"]
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Animation.Speed",
            name: "⚡ Animation Speed",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Animation.Speed"],
            min: 0.1,
            max: 5,
            step: 0.1,
            tooltip: "Values higher than 5 may cause instability."
        });

        // Visual Quality Settings Group
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Quality",
            name: "🎨 Visual Quality",
            type: "combo",
            options: [
                {value: 1, text: "Basic (Fast)"},
                {value: 2, text: "Balanced"},
                {value: 3, text: "Divine (High CPU)"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Quality"]
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Particle.Density",
            name: "🔮 Particle Density",
            type: "combo",
            options: [
                {value: 0.5, text: "Minimal"},
                {value: 1, text: "Balanced"},
                {value: 2, text: "Dense"},
                {value: 3, text: "Ultra"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Particle.Density"]
        });

        // Effect Intensity Settings Group
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Intensity",
            name: "✨ Animation Intensity",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Intensity"],
            min: 0.1,
            max: 2.0,
            step: 0.1,
            tooltip: "Values higher than 5 may cause instability."
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Glow",
            name: "🌟 Node Background Glow",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Glow"],
            min: 0,
            max: 1,
            step: 0.1
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Animation.Glow",
            name: "✨ Animation Glow Intensity",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Animation.Glow"],
            min: 0,
            max: 1,
            step: 0.1,
            tooltip: "Values higher than 5 may cause instability."
        });

        // Add glow visibility toggle after glow intensity setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Glow.Show",
            name: "🌟 Show Node Glow",
            type: "combo",
            options: [
                {value: true, text: "✅ Enabled"},
                {value: false, text: "❌ Disabled"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Glow.Show"],
            callback: () => {
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            }
        });

        // Color Settings Group
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Mode",
            name: "🎨 Color Mode",
            type: "combo",
            options: [
                {value: "default", text: "Default Colors"},
                {value: "custom", text: "Custom Colors"},
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Mode"]
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Scheme",
            name: "🎨 Color Enhancement",
            type: "combo",
            options: [
                {value: "default", text: "❌ Off"},
                {value: "saturated", text: "Increased Saturation"},
                {value: "vivid", text: "Vivid Enhancement"},
                {value: "contrast", text: "High Contrast"},
                {value: "bright", text: "Brightness Boost"},
                {value: "muted", text: "Subtle Tones"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Scheme"]
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Primary",
            name: "🎨 Primary Node Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Primary"]
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Secondary",
            name: "🎨 Secondary Node Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Secondary"]
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Accent",
            name: "🎨 Accent Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Accent"]
        });

        // Add new color settings
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Hover",
            name: "🎨 Hover Outline Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Hover"]
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Particle",
            name: "🎨 Particle Effects Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Particle"]
        });

        // Add particle glow setting after the main glow setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Particle.Glow",
            name: "✨ Particle Glow Intensity",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Particle.Glow"],
            min: 0,
            max: 1,
            step: 0.1
        });

        // Add particle intensity setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Particle.Intensity",
            name: "✨ Particle Motion Intensity",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Particle.Intensity"],
            min: 0.1,
            max: 2.0,
            step: 0.1,
            tooltip: "Control how energetic the particle movements are."
        });

        // Add particle color mode setting after the particle color setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Particle.Color.Mode",
            name: "🎨 Particle Color Mode",
            type: "combo",
            options: [
                {value: "default", text: "Custom Color"},
                {value: "rainbow", text: "Rainbow Flow"},
                {value: "complementary", text: "Complementary Shift"},
                {value: "energy", text: "Energy Spectrum"},
                {value: "quantum", text: "Quantum States"},
                {value: "aurora", text: "Aurora Borealis"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Particle.Color.Mode"]
        });

        // Add particle size setting after particle glow setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Particle.Size",
            name: "✨ Particle Size",
            type: "slider",
            defaultValue: 1.0,
            min: 0.2,
            max: 3.0,
            step: 0.1,
            tooltip: "Adjust the size of particle effects."
        });

        // Add particle speed control
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Particle.Speed",
            name: "⚡ Particle Speed",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Particle.Speed"],
            min: 0.1,
            max: 5,
            step: 0.1,
            tooltip: "Control the speed of particle animations independently."
        });

        // UI & Æmotion Studio About
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.UI & Æmotion Studio About",
            name: "🔽 Info Panel",
            type: "combo",
            options: [
                {value: 0, text: "Closed Panel"},
                {value: 1, text: "Open Panel"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.UI & Æmotion Studio About"],
            onChange: (value) => {
                if (value === 1) {
                    document.body.appendChild(createPatternDesignerWindow());
                    setTimeout(() => app.ui.settings.setSettingValue("📦 Enhanced Nodes.UI & Æmotion Studio About", 0), 100);
                }
            }
        });

        // Add Hover outline toggle
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Color.Hover.Show",
            name: "🎨 Show Hover Outline",
            type: "boolean",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Color.Hover.Show"]
        });

        // Add particle visibility toggle
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Particle.Show",
            name: "🌟 Show Particles",
            type: "boolean",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Particle.Show"]
        });

        // Add pause during render setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Pause.During.Render",
            name: "⏸️ Pause During Render",
            type: "combo",
            options: [
                {value: true, text: "✅ Enabled"},
                {value: false, text: "❌ Disabled"}
            ],
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Pause.During.Render"],
            tooltip: "Pause animations during rendering to improve performance."
        });

        // Add Animation Size setting after Glow setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Animation.Size",
            name: "🔳 Animation Scale",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["📦 Enhanced Nodes.Animation.Size"],
            min: 0.5,
            max: 2,
            step: 0.1,
            tooltip: "Values higher than 5 may cause instability."
        });

        // Add Text Animation Settings
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Animation.Enabled",
            name: "✨ Text Animation",
            type: "combo",
            options: [
                {value: false, text: "❌ Disabled"},
                {value: true, text: "✅ Enabled"}
            ],
            defaultValue: false,
            tooltip: "Enable or disable animated text effects."
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Color",
            name: "🎨 Text Color",
            type: "color",
            defaultValue: "#00ffff",
            tooltip: "Choose the base color for animated text."
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Glow",
            name: "✨ Text Glow",
            type: "slider",
            defaultValue: 0.5,
            min: 0,
            max: 1,
            step: 0.1,
            tooltip: "Control the glow intensity of animated text."
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Size",
            name: "📏 Text Size",
            type: "slider",
            defaultValue: 14,
            min: 8,
            max: 24,
            step: 1,
            tooltip: "Adjust the size of animated text."
        });

        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Style",
            name: "🎭 Text Style",
            type: "combo",
            options: [
                {value: "neon", text: "💫 Neon Pulse"},
                {value: "cyberpunk", text: "🌐 Cyberpunk"},
                {value: "retro", text: "📺 Retro"},
                {value: "pulse", text: "💓 Simple Pulse"},
                {value: "minimal", text: "✨ Minimal"}
            ],
            defaultValue: "neon",
            tooltip: "Choose the animation style for text."
        });

        // Add Letter Spacing setting
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Letter.Spacing",
            name: "↔️ Letter Spacing",
            type: "slider",
            defaultValue: 0,
            min: -2,
            max: 10,
            step: 0.25,
            tooltip: "Adjust the spacing between letters in the text."
        });

        // Add Text Position Y Slider
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Position.Y",
            name: "↕️ Text Y Position",
            type: "slider",
            defaultValue: 0,
            min: -50,
            max: 50,
            step: 1,
            tooltip: "Adjust the vertical position of the text. Negative values move up, positive values move down."
        });

        // Add Text Position X Slider
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Position.X",
            name: "↔️ Text X Position",
            type: "slider",
            defaultValue: 0,
            min: -50,
            max: 50,
            step: 1,
            tooltip: "Adjust the horizontal position of the text. Negative values move left, positive values move right."
        });

        // Add Text Rotation Radius Slider
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Rotation.Radius",
            name: "🔄 Text Orbit Radius",
            type: "slider",
            defaultValue: 0,
            min: 0,
            max: 50,
            step: 1,
            tooltip: "Set the radius of text rotation (0 for no rotation). Negative values move counterclockwise, positive values move clockwise."
        });

        // Add Text Rotation Angle Slider
        app.ui.settings.addSetting({
            id: "📦 Enhanced Nodes.Text.Rotation.Angle",
            name: "↻ Text Rotation",
            type: "slider",
            defaultValue: 0,
            min: -180,
            max: 180,
            step: 5,
            tooltip: "Rotate the text itself (in degrees). Negative values move counterclockwise, positive values move clockwise."
        });

        // Enhanced Color Management System
        const ColorManager = {
            // Add animation-specific default colors
            ANIMATION_COLORS: Object.freeze({
                gentlePulse: Object.freeze({
                    primary: "#44aaff",    // Bright blue
                    secondary: "#88ccff",  // Light blue
                    accent: "#0088ff"      // Deep blue
                }),
                neonNexus: Object.freeze({
                    primary: "#00ff88",    // Neon green
                    secondary: "#00ffcc",  // Cyan
                    accent: "#00ff44"      // Bright green
                }),
                cosmicRipple: Object.freeze({
                    primary: "#ff00ff",    // Magenta
                    secondary: "#aa00ff",  // Purple
                    accent: "#ff40ff"      // Light magenta
                }),
                flowerOfLife: Object.freeze({
                    primary: "#ffcc00",    // Golden
                    secondary: "#ff8800",  // Orange
                    accent: "#ffaa00"      // Amber
                })
            }),

            validateHexColor(color) {
                if (!color || typeof color !== 'string') return null;
                if (color[0] !== '#') color = '#' + color;
                if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return null;
                return color;
            },

            enhanceColor(color, scheme) {
                // Ensure we have a valid color to work with
                const validColor = this.validateHexColor(color);
                if (!validColor) {
                    const animStyle = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animate", 1);
                    // Use animation colors as fallback instead of white
                    switch(animStyle) {
                        case 2: return this.ANIMATION_COLORS.neonNexus.primary;
                        case 3: return this.ANIMATION_COLORS.cosmicRipple.primary;
                        case 4: return this.ANIMATION_COLORS.flowerOfLife.primary;
                        default: return this.ANIMATION_COLORS.gentlePulse.primary;
                    }
                }

                // If scheme is default, just return the validated color
                if (scheme === "default") return validColor;
                
                const hex2Hsl = (hex) => {
                    let r = parseInt(hex.slice(1, 3), 16) / 255;
                    let g = parseInt(hex.slice(3, 5), 16) / 255;
                    let b = parseInt(hex.slice(5, 7), 16) / 255;
                    
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    let h, s, l = (max + min) / 2;

                    if (max === min) {
                        h = s = 0;
                    } else {
                        const d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                            case g: h = (b - r) / d + 2; break;
                            case b: h = (r - g) / d + 4; break;
                        }
                        h /= 6;
                    }
                    return [h * 360, s * 100, l * 100];
                };

                const hsl2Hex = (h, s, l) => {
                    l /= 100;
                    const a = s * Math.min(l, 1 - l) / 100;
                    const f = n => {
                        const k = (n + h / 30) % 12;
                        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                        return Math.round(255 * color).toString(16).padStart(2, '0');
                    };
                    return `#${f(0)}${f(8)}${f(4)}`;
                };

                const [h, s, l] = hex2Hsl(validColor);

                switch (scheme) {
                    case "saturated":
                        return hsl2Hex(h, Math.min(s * 1.3, 100), l);
                    case "vivid":
                        return hsl2Hex(h, Math.min(s * 1.4, 100), Math.min(l * 1.1, 100));
                    case "contrast":
                        return hsl2Hex(h, Math.min(s * 1.2, 100), l > 50 ? Math.min(l * 1.2, 100) : Math.max(l * 0.8, 0));
                    case "bright":
                        return hsl2Hex(h, s, Math.min(l * 1.25, 100));
                    case "muted":
                        return hsl2Hex(h, Math.max(s * 0.7, 0), Math.min(l * 1.1, 100));
                    default:
                        return validColor;
                }
            },

            getCustomColors() {
                const colorMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Mode", "default");
                const colorScheme = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Scheme", "default");
                const animStyle = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animate", 1);
                
                // Always get animation colors first
                let colors = (() => {
                    switch(animStyle) {
                        case 1: return this.ANIMATION_COLORS.gentlePulse;
                        case 2: return this.ANIMATION_COLORS.neonNexus;
                        case 3: return this.ANIMATION_COLORS.cosmicRipple;
                        case 4: return this.ANIMATION_COLORS.flowerOfLife;
                        default: return this.ANIMATION_COLORS.gentlePulse;
                    }
                })();

                // Override with custom colors if in custom mode
                if (colorMode === "custom") {
                    colors = {
                        primary: app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Primary", colors.primary),
                        secondary: app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Secondary", colors.secondary),
                        accent: app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Accent", colors.accent)
                    };
                    
                    // Validate each color and use fallback if invalid
                    colors.primary = this.validateHexColor(colors.primary) || colors.primary;
                    colors.secondary = this.validateHexColor(colors.secondary) || colors.secondary;
                    colors.accent = this.validateHexColor(colors.accent) || colors.accent;
                }
                
                // Apply color scheme enhancements if not in default scheme
                if (colorScheme !== "default") {
                    return {
                        primary: this.enhanceColor(colors.primary, colorScheme),
                        secondary: this.enhanceColor(colors.secondary, colorScheme),
                        accent: this.enhanceColor(colors.accent, colorScheme)
                    };
                }
                
                return colors;
            },
            
            getNodeColor(defaultColor) {
                const colors = this.getCustomColors();
                return colors.primary;
            },
            
            getSecondaryColor(defaultColor) {
                const colors = this.getCustomColors();
                return colors.secondary;
            },
            
            getAccentColor(defaultColor) {
                const colors = this.getCustomColors();
                return colors.accent;
            },

            getParticleColor(baseColor, index, phase, totalParticles) {
                try {
                    if (!baseColor || !Number.isFinite(index) || !Number.isFinite(phase) || !Number.isFinite(totalParticles)) {
                        const animStyle = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animate", 1);
                        // Use animation colors as fallback
                        switch(animStyle) {
                            case 2: return this.ANIMATION_COLORS.neonNexus.primary;
                            case 3: return this.ANIMATION_COLORS.cosmicRipple.primary;
                            case 4: return this.ANIMATION_COLORS.flowerOfLife.primary;
                            default: return this.ANIMATION_COLORS.gentlePulse.primary;
                        }
                    }

                    const colorMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Mode", "default");
                    const particleColorMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Color.Mode", "default");
                    const colorScheme = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Scheme", "default");
                    
                    // Get base particle color
                    let particleColor;
                    if (colorMode === "custom") {
                        particleColor = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Particle", "#ffff00");
                    } else {
                        particleColor = baseColor;
                    }

                    // Apply particle color mode effects
                    switch (particleColorMode) {
                        case "rainbow":
                            return `hsl(${(index * 30 + phase * 50) % 360}, 90%, 75%)`;
                        case "complementary":
                            const [h, s, l] = this.hex2Hsl(particleColor);
                            return `hsl(${(h + 180) % 360}, ${s}%, ${l}%)`;
                        case "energy":
                            return `hsl(${(phase * 100 + index * 20) % 360}, 90%, 75%)`;
                        case "quantum":
                            const quantumPhase = (phase * 2 + index * 0.1) % 1;
                            return `hsl(${280 + quantumPhase * 80}, 90%, ${60 + Math.sin(phase * 5) * 20}%)`;
                        case "aurora":
                            const auroraPhase = (phase * 3 + index * 0.2) % 1;
                            return `hsl(${120 + auroraPhase * 60}, ${80 + Math.sin(phase * 3) * 20}%, ${70 + Math.sin(phase * 4) * 20}%)`;
                        default:
                            // Use custom or base color with color scheme enhancement
                            return this.enhanceColor(particleColor, colorScheme);
                    }
                } catch (error) {
                    console.warn("Error getting particle color:", error);
                    return baseColor;
                }
            },

            // Helper function to convert hex to HSL
            hex2Hsl(hex) {
                const validColor = this.validateHexColor(hex);
                if (!validColor) return [0, 0, 50]; // Default to gray if invalid

                const r = parseInt(validColor.slice(1, 3), 16) / 255;
                const g = parseInt(validColor.slice(3, 5), 16) / 255;
                const b = parseInt(validColor.slice(5, 7), 16) / 255;
                
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                let h, s, l = (max + min) / 2;

                if (max === min) {
                    h = s = 0;
                } else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / d + 2; break;
                        case b: h = (r - g) / d + 4; break;
                    }
                    h /= 6;
                }
                return [h * 360, s * 100, l * 100];
            },

            getTextColor() {
                const colorMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Mode", "default");
                const colorScheme = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Scheme", "default");
                const customColor = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Color", "#00ffff");
                
                if (colorMode === "custom") {
                    return this.enhanceColor(customColor, colorScheme);
                }
                return this.enhanceColor(this.getAccentColor(), colorScheme);
            },
        };

        // Enhanced Rendering Utilities
        const RenderUtils = {
            createFlowField(t, phase) {
                return {
                    x: Math.sin(t * Math.PI * CONFIG.SACRED.TRINITY + phase) * 10,
                    y: Math.cos(t * Math.PI * CONFIG.SACRED.TRINITY + phase) * 10
                };
            },

            createCrystal(ctx, x, y, size, rotation, color) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.beginPath();
                
                for (let i = 0; i < CONFIG.SACRED.HARMONY; i++) {
                    const angle = (i / CONFIG.SACRED.HARMONY) * Math.PI * 2;
                    const px = Math.cos(angle) * size;
                    const py = Math.sin(angle) * size;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                
                ctx.closePath();
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.restore();
            },

            createMerkaba(ctx, x, y, size, phase, color) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(phase);
                
                // First tetrahedron
                ctx.beginPath();
                for (let i = 0; i <= CONFIG.SACRED.TRINITY; i++) {
                    const angle = (i / CONFIG.SACRED.TRINITY) * Math.PI * 2;
                    const px = Math.cos(angle) * size;
                    const py = Math.sin(angle) * size;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.strokeStyle = color;
                ctx.stroke();
                
                // Second tetrahedron
                ctx.rotate(Math.PI / CONFIG.SACRED.TRINITY);
                ctx.beginPath();
                for (let i = 0; i <= CONFIG.SACRED.TRINITY; i++) {
                    const angle = (i / CONFIG.SACRED.TRINITY) * Math.PI * 2;
                    const px = Math.cos(angle) * size;
                    const py = Math.sin(angle) * size;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.restore();
            }
        };

        // New Text Animation System
        const TextAnimator = {
            // Simple direct color parser
            parseColor(color) {
                if (!color) return null;
                
                // Convert shorthand hex to full hex
                if (color.match(/^#[0-9A-Fa-f]{3}$/)) {
                    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
                }
                
                // Validate full hex
                if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                    return color;
                }
                
                return null;
            },

            // Convert hex to RGB components
            hexToRGB(hex) {
                const validated = ColorManager.validateHexColor(hex) || "#00ffff";
                return [
                    parseInt(validated.slice(1, 3), 16),
                    parseInt(validated.slice(3, 5), 16),
                    parseInt(validated.slice(5, 7), 16)
                ];
            },

            // Create rgba string
            rgba(color, alpha = 1) {
                const validated = ColorManager.validateHexColor(color) || "#00ffff";
                const [r, g, b] = this.hexToRGB(validated);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            },

            drawAnimatedText(ctx, text, x, y, phase, options = {}) {
                // Get text color from ColorManager
                const baseColor = ColorManager.getTextColor();
                const style = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Style", "neon");
                const size = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Size", 14);
                const glow = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Glow", 0.5);
                const animationsEnabled = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animations.Enabled", true);
                const letterSpacing = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Letter.Spacing", 0);
                
                // Get position and rotation settings
                const offsetY = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Position.Y", 0);
                const offsetX = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Position.X", 0);
                const rotationRadius = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Rotation.Radius", 0);
                const rotationAngleDegrees = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Rotation.Angle", 0);
                
                // Calculate final position with rotation if radius > 0
                let finalX = x + offsetX;
                let finalY = y + offsetY;
                
                if (rotationRadius > 0) {
                    const orbitAngle = phase * 2;
                    finalX += Math.cos(orbitAngle) * rotationRadius;
                    finalY += Math.sin(orbitAngle) * rotationRadius;
                }
                
                // Convert color to RGB components using ColorManager's method
                const [r, g, b] = this.hexToRGB(baseColor);

                // Basic text setup
                ctx.save();
                ctx.font = `${size}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Apply text rotation if any
                if (rotationAngleDegrees !== 0) {
                    ctx.translate(finalX, finalY);
                    ctx.rotate(rotationAngleDegrees * Math.PI / 180);
                    ctx.translate(-finalX, -finalY);
                }

                // Simple helper for drawing text with letter spacing
                const drawText = (x, y, style) => {
                    ctx.fillStyle = style;
                    if (letterSpacing === 0) {
                        ctx.fillText(text, x, y);
                        return;
                    }
                    
                    // Use hair space (thinner than thin space) and scale down the repetition
                    const spaced = text.split('').join('\u200A'.repeat(Math.max(1, Math.floor(Math.abs(letterSpacing) * 2))));
                    ctx.fillText(spaced, x, y);
                };

                // If animations are disabled, render basic text
                if (!animationsEnabled) {
                    drawText(finalX, finalY, baseColor);
                    ctx.restore();
                    return;
                }

                try {
                    switch (style) {
                        case "neon":
                            // Enhanced Neon Pulse effect
                            const pulseIntensity = 0.7 + Math.sin(phase * 3) * 0.3;
                            const neonAlpha = 0.8 * glow * pulseIntensity;
                            
                            // Outer corona
                            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${neonAlpha * 0.5})`;
                            ctx.shadowBlur = 20 * glow;
                            drawText(finalX, finalY, `rgba(${r}, ${g}, ${b}, ${neonAlpha * 0.3})`);
                            
                            // Middle layer
                            ctx.shadowBlur = 10 * glow;
                            drawText(finalX, finalY, `rgba(${r}, ${g}, ${b}, ${neonAlpha * 0.6})`);
                            
                            // Core text
                            ctx.shadowBlur = 5 * glow;
                            drawText(finalX, finalY, `rgb(${r}, ${g}, ${b})`);
                            
                            // Highlight
                            ctx.shadowBlur = 3;
                            ctx.fillStyle = '#ffffff';
                            ctx.globalAlpha = 0.5 * pulseIntensity;
                            drawText(finalX, finalY, '#ffffff');
                            break;

                        case "cyberpunk":
                            // Cyberpunk glitch effect
                            const glitchOffset = Math.sin(phase * 10) * 2;
                            const glitchAlpha = 0.7 * glow;
                            
                            // Glitch layers
                            const glitchColors = [
                                {r: 255, g: 0, b: 128, o: 0.7},  // Hot pink
                                {r: 0, g: 255, b: 255, o: 0.7},  // Cyan
                                {r: 255, g: 255, b: 0, o: 0.5}   // Yellow
                            ];
                            
                            glitchColors.forEach((color, i) => {
                                const offset = glitchOffset * (i - 1);
                                ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},${glitchAlpha})`;
                                ctx.shadowBlur = 5 * glow;
                                drawText(finalX + offset, finalY, `rgba(${color.r},${color.g},${color.b},${color.o})`);
                            });
                            
                            // Main text
                            ctx.shadowColor = `rgba(${r},${g},${b},${glitchAlpha})`;
                            ctx.shadowBlur = 10 * glow;
                            drawText(finalX, finalY, baseColor);
                            break;

                        case "retro":
                            // Simple retro CRT effect
                            const scanOffset = Math.sin(phase * 5) * 0.5;
                            
                            // Slight color separation
                            drawText(finalX - 1, finalY + scanOffset, `rgba(255,0,0,0.5)`);
                            drawText(finalX + 1, finalY - scanOffset, `rgba(0,255,255,0.5)`);
                            
                            // Main text
                            ctx.shadowColor = baseColor;
                            ctx.shadowBlur = 3 * glow;
                            drawText(finalX, finalY, baseColor);
                            break;

                        case "pulse":
                            // Simple pulsing effect
                            const simplePulse = 0.5 + Math.sin(phase * 2) * 0.5;
                            ctx.globalAlpha = 0.8 + simplePulse * 0.2;
                            ctx.shadowColor = baseColor;
                            ctx.shadowBlur = 10 * glow * simplePulse;
                            drawText(finalX, finalY, baseColor);
                            break;
                            
                        case "minimal":
                            // Clean minimal effect
                            const fadeAlpha = 0.7 + Math.sin(phase * 2) * 0.3;
                            ctx.globalAlpha = fadeAlpha;
                            ctx.shadowColor = baseColor;
                            ctx.shadowBlur = 3 * glow;
                            drawText(finalX, finalY, baseColor);
                            
                            // Subtle underline
                            ctx.beginPath();
                            ctx.strokeStyle = baseColor;
                            ctx.lineWidth = 1;
                            ctx.globalAlpha = fadeAlpha * 0.5;
                            const textWidth = ctx.measureText(text).width * (1 + letterSpacing * 0.1);
                            ctx.moveTo(finalX - textWidth / 2, finalY + 10);
                            ctx.lineTo(finalX + textWidth / 2, finalY + 10);
                            ctx.stroke();
                            break;
                    }
                } catch (error) {
                    console.error("Error in text animation:", error);
                    ctx.fillStyle = baseColor;
                    drawText(finalX, finalY, baseColor);
                }

                ctx.restore();
            }
        };

        // Enhanced Animation Effects
        const AnimationEffects = {
            gentlePulse(ctx, node, phase, intensity) {
                const primaryColor = ColorManager.getNodeColor(node.color || "#ffffff");
                const secondaryColor = ColorManager.getSecondaryColor(node.color || "#88ccff");
                const accentColor = ColorManager.getAccentColor(node.color || "#44aaff");
                const HoverColor = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Hover", "#ff00ff");
                const showHover = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Color.Hover.Show", true);
                const direction = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Direction", 1);
                
                // Get quality and effect settings
                const quality = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Quality", 2);
                const glowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Glow", 0.5);
                const particleDensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Density", 1);
                const showParticles = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Show", true);
                const isStaticMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Static.Mode", false);
                const shouldPauseDuringRender = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Pause.During.Render", true);
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;
                const animSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Speed", 1));
                const particleSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Speed", 1));
                const particleIntensity = Math.min(2.0, Math.max(0.1, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Intensity", 1.0)));
                const scaledTime = effectiveStaticMode ? phase : phase * animSpeed;
                // Separate particle timing from animation timing
                const particleTime = effectiveStaticMode ? phase : ParticleController.update(performance.now(), TimingManager.smoothDelta);

                // Define glowRadius early so it's available for all effects
                const glowRadius = Math.max(node.size[0], node.size[1]) * (0.5 + quality * 0.1) * app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Size", 1);

                // Helper function to create a color with an alpha value.
                const withAlpha = (color, alpha) => {
                    try {
                        if (!color) {
                            return `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
                        }
                        // Remove hash if present and pad with f's if needed
                        const cleanColor = color.replace(/^#/, '').padEnd(6, 'f');
                        // Parse RGB values with fallback
                        const r = parseInt(cleanColor.slice(0, 2), 16) || 255;
                        const g = parseInt(cleanColor.slice(2, 4), 16) || 255;
                        const b = parseInt(cleanColor.slice(4, 6), 16) || 255;
                        // Ensure alpha is between 0 and 1
                        const validAlpha = Math.max(0, Math.min(1, alpha));
                        return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
                    } catch (error) {
                        console.warn("Error in withAlpha, using fallback color:", error);
                        return `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
                    }
                };

                ctx.save();
                ctx.translate(node.size[0] / 2, node.size[1] / 2);

                // Draw Hover outline if enabled and node is selected or hovered
                if (showHover && (node.selected || node.mouseOver)) {
                    ctx.save();
                    const outlineGlowSize = 15 * glowIntensity;
                    ctx.shadowColor = withAlpha(HoverColor, 0.5);
                    ctx.shadowBlur = node.selected ? outlineGlowSize * 1.5 : outlineGlowSize;
                    ctx.strokeStyle = withAlpha(HoverColor, 0.7);
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-node.size[0] / 2, -node.size[1] / 2, node.size[0], node.size[1]);
                    ctx.restore();
                }

                // Only draw non-particle effects if not in particles-only mode
                if (!node.particlesOnly) {
                    // Create soft glow base with quality-based size adjustments.
                    const breathePhase = effectiveStaticMode ?
                        phase :
                        phase * 0.375 * direction * animSpeed;
                    const breatheScale = Math.pow(Math.sin(breathePhase), 2);
                    const modifiedIntensity = intensity * 0.75;
                    const pulseScale = 0.4 + 0.4 * breatheScale * modifiedIntensity;
                    
                    // Improved inner glow gradient with an extra stop for a bright, white core.
                    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulseScale);
                    const innerAlpha = 0.2 * glowIntensity * (0.5 + breatheScale * 0.5);
                    innerGlow.addColorStop(0, withAlpha("#ffffff", Math.min(innerAlpha + 0.15, 1))); // bright white core
                    innerGlow.addColorStop(0.3, withAlpha(primaryColor, innerAlpha));
                    innerGlow.addColorStop(0.7, withAlpha(secondaryColor, innerAlpha * 0.6));
                    innerGlow.addColorStop(1, withAlpha(accentColor, 0));
                    
                    // Improved outer glow with additional gradient stops for a natural fade.
                    const outerGlow = ctx.createRadialGradient(
                        0, 0, glowRadius * 0.6 * pulseScale,
                        0, 0, glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale
                    );
                    const outerAlpha = 0.1 * glowIntensity * (0.5 + breatheScale * 0.5);
                    outerGlow.addColorStop(0, withAlpha(secondaryColor, outerAlpha));
                    outerGlow.addColorStop(0.6, withAlpha(accentColor, outerAlpha * 0.5));
                    outerGlow.addColorStop(1, withAlpha(accentColor, 0));
                    
                    // Draw inner and outer glow for the pulsating light source.
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
                        ctx.shadowColor = withAlpha(secondaryColor, 0.3);
                        ctx.shadowBlur = 10 * glowIntensity * (quality * 0.5);
                    }
                }
                
                // Firefly particles: more organic and dynamic with subtle position jitter and varying size.
                if (showParticles) {
                    const baseParticleCount = 8 + quality * 2;
                    const particleCount = Math.floor(baseParticleCount * particleDensity);
                    const particleGlowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Glow", 0.5);
                    const particleSizeSetting = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Size", 1.0);
                    
                    for (let i = 0; i < particleCount; i++) {
                        const particleOffset = i * (Math.PI * 2 / particleCount);
                        const individualSpeed = effectiveStaticMode ? 1 : (0.5 + Math.sin(i) * 0.25) * particleIntensity * particleSpeed;
                        const noiseOffset = (i % 12) * 0.523;
                        
                        // Use particleTime for all particle animations
                        const particlePhase = effectiveStaticMode ?
                            phase + particleOffset :
                            particleTime * individualSpeed + particleOffset;
                        
                        // Increase orbit radius and add vertical offset using particleTime
                        const orbitRadius = glowRadius * (0.8 +  // Base orbit radius
                            Math.sin(effectiveStaticMode ? phase + i : particleTime * 0.2 * particleSpeed + i) * 0.25 +  // Vertical variation
                            Math.cos(effectiveStaticMode ? phase + i * 0.7 : particleTime * 0.3 * particleSpeed + i * 0.7) * 0.25);  // Horizontal variation
                        
                        const randomFactor = quality > 1 ? 12 : 6;
                        const angle = particlePhase + (i * Math.PI * 2 / particleCount);
                        
                        // Enhanced organic movement using particleTime
                        const torusEffect = particleIntensity * 2.0;
                        const orbitOffset = Math.sin(particleTime * 0.3 * particleSpeed + i) * torusEffect;
                        
                        // More pronounced jitter using particleTime
                        const jitterX = effectiveStaticMode ? 0 : 
                            Math.sin(particleTime * 3 * particleSpeed + i) * 1.2 * particleIntensity +
                            Math.cos(particleTime * 2 * particleSpeed + i * 0.5) * 0.5 * particleIntensity;
                        const jitterY = effectiveStaticMode ? 0 : 
                            Math.cos(particleTime * 2.5 * particleSpeed + i) * 1.2 * particleIntensity +
                            Math.sin(particleTime * 1.5 * particleSpeed + i * 0.7) * 0.5 * particleIntensity;
                        
                        const verticalOffset = -orbitRadius * 0.3;
                        
                        const x = Math.cos(angle) * (orbitRadius + orbitOffset) + 
                                Math.sin(effectiveStaticMode ? phase + i : particleTime * 0.2 * particleSpeed + i) * randomFactor + jitterX;
                        const y = Math.sin(angle) * (orbitRadius + orbitOffset) + verticalOffset + 
                                Math.cos(effectiveStaticMode ? phase + i : particleTime * 0.15 * particleSpeed + i) * randomFactor + jitterY;
                        
                        const baseParticleSize = (4 + quality) * app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Size", 1) * particleSizeSetting;
                        const particleSize = effectiveStaticMode ? 
                            baseParticleSize : 
                            baseParticleSize * (0.7 + Math.sin(particleTime * 0.5 * particleSpeed + i) * 0.4 + Math.random() * 0.3);
                        
                        const particleColor = ColorManager.getParticleColor(
                            node.color || "#ffffff",
                            i,
                            particleTime * particleSpeed,
                            particleCount
                        );
                        
                        const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, particleSize * 2.0);
                        particleGlow.addColorStop(0, withAlpha(particleColor, 0.8 * particleGlowIntensity));
                        particleGlow.addColorStop(0.4, withAlpha(particleColor, 0.4 * particleGlowIntensity));
                        particleGlow.addColorStop(1, withAlpha(particleColor, 0));
                        
                        const blinkOffset = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % (2 * Math.PI));
                        const blinkSpeed = 1.2 + Math.sin(i * 0.7) * 0.6;
                        const blinkFactor = effectiveStaticMode ? 
                            0.8 : 
                            0.4 + 0.8 * Math.pow(Math.sin(particleTime * blinkSpeed * particleSpeed + blinkOffset), 2);
                        const particleAlpha = Math.min(blinkFactor, 1) * particleGlowIntensity;
                        
                        ctx.beginPath();
                        ctx.arc(x, y, particleSize * 2.0, 0, Math.PI * 2);
                        ctx.fillStyle = particleGlow;
                        ctx.globalAlpha = particleAlpha * 0.8;
                        ctx.fill();
                        
                        ctx.beginPath();
                        ctx.arc(x, y, particleSize * 0.6, 0, Math.PI * 2);
                        ctx.fillStyle = particleColor;
                        ctx.globalAlpha = Math.min(particleAlpha * 1.5, 1);
                        ctx.fill();
                    }
                }
                
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.restore();
            },

            neonNexus(ctx, node, phase, intensity) {
                const primaryColor = ColorManager.getNodeColor(node.color || "#ffffff");
                const secondaryColor = ColorManager.getSecondaryColor(node.color || "#88ccff");
                const accentColor = ColorManager.getAccentColor(node.color || "#44aaff");
                const direction = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Direction", 1);
                
                const isStaticMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Static.Mode", false);
                const shouldPauseDuringRender = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Pause.During.Render", true);
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;
                const showParticles = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Show", true);
                const particleGlowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Glow", 0.5);
                const particleSizeSetting = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Size", 1.0);
                const animSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Speed", 1));
                const particleSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Speed", 1));
                const scaledTime = effectiveStaticMode ? phase : phase;
                const particleTime = effectiveStaticMode ? phase : phase * particleSpeed;
                const animationSize = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Size", 1);
                const glowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Glow", 0.5);

                // Advanced neon parameters
                const rectWidth = node.size[0];
                const rectHeight = node.size[1];
                const radius = Math.min(rectWidth, rectHeight) * 0.08;
                const baseLineWidth = Math.max(rectWidth, rectHeight) * 0.0075 * animationSize;
                const scanSpeed = 0.1;
                const hologramDepth = 3;
                const gridSize = Math.min(rectWidth, rectHeight) * 0.4 * animationSize;

                // Set up advanced context properties
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.shadowColor = 'transparent';

                // Only draw non-particle effects if not in particles-only mode
                if (!node.particlesOnly) {
                    // 1. Holographic Base Layer with improved blending
                    const hologramPhase = phase * 0.8 * direction;
                    for(let i = 0; i < hologramDepth; i++) {
                        ctx.save();
                        ctx.globalAlpha = 0.2 - (i * 0.05);
                        ctx.strokeStyle = `hsl(${(i * 60) % 360}, 80%, 75%)`;
                        ctx.lineWidth = baseLineWidth * 0.4;
                        
                        ctx.beginPath();
                        roundedRect(ctx, 
                            -i * 2, -i * 2,
                            rectWidth + i * 4, rectHeight + i * 4,
                            radius + i * 1
                        );
                        ctx.stroke();
                        ctx.restore();
                    }

                    // 2. Main Neon Tube with Smoother Flicker
                    const neonFlicker = effectiveStaticMode ? 
                        1.0 : 
                        0.95 + 0.05 * Math.sin(phase * 0.3 * direction);
                    const layers = 4;
                    for (let i = 0; i < layers; i++) {
                        ctx.save();
                        ctx.lineWidth = baseLineWidth * (1 + i * 0.3);
                        
                        const layerColor = i === 0 ? primaryColor : 
                                         i === 1 ? secondaryColor :
                                         i === 2 ? accentColor :
                                         'rgba(255, 255, 255, 0.4)';
                        
                        ctx.strokeStyle = layerColor;
                        ctx.shadowColor = layerColor;
                        ctx.shadowBlur = (i + 1) * 12 * intensity * glowIntensity;
                        
                        const baseOpacity = 0.95 - i * 0.15;
                        ctx.globalAlpha = effectiveStaticMode ? 
                            baseOpacity :
                            baseOpacity * neonFlicker;
                        
                        roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
                        ctx.stroke();
                        
                        if (i === 0) {
                            ctx.globalAlpha = effectiveStaticMode ?
                                0.3 :
                                0.3 * neonFlicker;
                            ctx.lineWidth = baseLineWidth * 0.8;
                            ctx.shadowBlur = 20 * intensity * glowIntensity;
                            roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
                            ctx.stroke();
                        }
                        
                        ctx.restore();
                    }

                    // 3. Enhanced Scanning Light Effect with Text Highlight and Vertical Lines
                    if (!effectiveStaticMode) {
                        ctx.save();
                        const scanY = (rectHeight * (Math.sin(phase * 2) * 0.5 + 0.5));
                        const scanLineGradient = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
                        scanLineGradient.addColorStop(0, 'rgba(255,255,255,0)');
                        scanLineGradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
                        scanLineGradient.addColorStop(1, 'rgba(255,255,255,0)');
                        ctx.fillStyle = scanLineGradient;
                        ctx.fillRect(0, scanY - 10, rectWidth, 20);
                        ctx.restore();
                    }
                }

                // Neo-Futuristic Particle Matrix - Always draw with consistent parameters
                if (showParticles) {
                    // Retrieve the current particle size setting
                    const particleSizeSetting = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Size", 1.0);
                    const particleCount = 40 + Math.floor(30);
                    
                    for (let i = 0; i < particleCount; i++) {
                        ctx.save();
                        
                        // Calculate grid position with phase-offset rotation
                        const col = i % 5;
                        const row = Math.floor(i / 5);
                        const gridSpacing = gridSize / 4;
                        const x = (col - 2) * gridSpacing + Math.cos(phase + col) * 2;
                        const y = (row - 2) * gridSpacing + Math.sin(phase + row) * 2;
                        
                        // Use the particle size setting to determine the base size
                        // and ensure that the variation is scaled as well.
                        const baseSize = 2 * particleSizeSetting;        // Base particle radius
                        const sizeVariation = baseSize * 0.3;                // Amplitude of size oscillation
                        const particleSize =
                            baseSize + Math.sin(phase * 2 + i) * sizeVariation;  // Final size value
                        
                        const rotation = phase + (i * Math.PI / 8);
                        const alpha = (0.4 + Math.sin(phase * 3 + i) * 0.2) * particleGlowIntensity;
                        const particleColor = ColorManager.getParticleColor(
                            node.color || "#ffffff",
                            i,
                            particleTime,
                            particleCount
                        );
                        
                        ctx.translate(x, y);
                        ctx.rotate(rotation);
                        ctx.fillStyle = particleColor;
                        ctx.globalAlpha = alpha;
                        ctx.shadowColor = particleColor;
                        ctx.shadowBlur = 5 * particleGlowIntensity;
                        
                        // Draw the hexagonal particle, using the computed particleSize
                        ctx.beginPath();
                        for (let s = 0; s < 6; s++) {
                            const angle = (s * Math.PI / 3) + phase;
                            // Multiply the computed particleSize by an oscillation factor
                            const currentSize = particleSize * (0.8 + Math.sin(phase * 5 + s) * 0.2);
                            ctx.lineTo(
                                Math.cos(angle) * currentSize,
                                Math.sin(angle) * currentSize
                            );
                        }
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.restore();
                    }

                    // Only draw energy grid in full animation mode
                    if (!node.particlesOnly) {
                        // 5. Energy Grid Effect
                        ctx.save();
                        ctx.strokeStyle = primaryColor;
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = 0.2 * particleGlowIntensity;
                        ctx.setLineDash([5, 3]);
                        ctx.lineDashOffset = phase * 10;
                        
                        // Calculate vertical center offset
                        const verticalCenter = rectHeight / 5;
                        
                        // Calculate horizontal offset to align with left edge
                        const leftOffset = -gridSize * 0.5;  // Reduced from 3x to 1.2x for subtle left shift
                        
                        // Draw grid lines
                        for(let i = -1; i <= 1; i += 0.5) {
                            ctx.beginPath();
                            ctx.moveTo(leftOffset + (i * gridSize), verticalCenter - gridSize);
                            ctx.lineTo(leftOffset + (i * gridSize), verticalCenter + gridSize);
                            ctx.stroke();
                            
                            ctx.beginPath();
                            ctx.moveTo(leftOffset - gridSize, verticalCenter + (i * gridSize));
                            ctx.lineTo(leftOffset + gridSize, verticalCenter + (i * gridSize));
                            ctx.stroke();
                        }
                        ctx.restore();
                    }
                }

                // 6. Enhanced Interactive Energy Pulse - Only in full animation mode
                if((node.selected || node.mouseOver) && !node.particlesOnly) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    const pulse = 0.5 + 0.5 * Math.sin(phase * 3);
                    
                    // Enhanced core energy pulse
                    const pulseGradient = ctx.createRadialGradient(
                        rectWidth/2, rectHeight/2, 0,
                        rectWidth/2, rectHeight/2, Math.max(rectWidth, rectHeight) * 0.7
                    );
                    pulseGradient.addColorStop(0, `rgba(255,255,255,${0.15 * pulse})`);
                    pulseGradient.addColorStop(1, 'rgba(255,255,255,0)');
                    
                    ctx.fillStyle = pulseGradient;
                    roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
                    ctx.fill();
                    
                    // Enhanced edge highlight
                    ctx.strokeStyle = `rgba(255,255,255,${0.7 * pulse})`;
                    ctx.lineWidth = baseLineWidth * 2;
                    ctx.shadowColor = `rgba(255,255,255,${0.5 * pulse})`;
                    ctx.shadowBlur = 15 * intensity;
                    roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
                    ctx.stroke();
                    ctx.restore();
                }

                // Reset context
                ctx.globalAlpha = 1;
                ctx.setLineDash([]);
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = 'source-over';

                // Helper function for rounded rectangles
                function roundedRect(ctx, x, y, width, height, radius) {
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + width - radius, y);
                    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                    ctx.lineTo(x + width, y + height - radius);
                    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                    ctx.lineTo(x + radius, y + height);
                    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                }
            },

            cosmicRipple(ctx, node, phase, intensity) {
                const centerX = node.size[0] / 2;
                const centerY = node.size[1] / 2;
                const rings = 5;
                const primaryColor = ColorManager.getNodeColor(node.color || "#ffffff");
                const secondaryColor = ColorManager.getSecondaryColor(node.color || "#88ccff");
                const accentColor = ColorManager.getAccentColor(node.color || "#44aaff");
                const showParticles = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Show", true);
                const particleGlowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Glow", 0.5);
                const particleIntensity = Math.min(2.0, Math.max(0.1, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Intensity", 1.0)));
                const particleDensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Density", 1);
                const particleSizeSetting = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Size", 1.0);
                const particleSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Speed", 1));
                const direction = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Direction", 1);
                const glowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Glow", 0.5);

                // Add static mode and speed settings
                const isStaticMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Static.Mode", false);
                const shouldPauseDuringRender = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Pause.During.Render", true);
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;
                const animSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Speed", 1));
                const scaledTime = effectiveStaticMode ? phase : phase;
                const maxRadius = Math.max(1, Math.min(node.size[0], node.size[1]) * 0.7 * app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Size", 1));
                const rippleSpeed = 0.8;

                // Draw ripple effects
                if (!node.particlesOnly) {
                    for (let i = 0; i < rings; i++) {
                        const ripplePhase = (scaledTime * rippleSpeed - i * 0.2) % 1;
                        const radius = Math.max(5, maxRadius * ripplePhase);

                        if (radius > 5 && radius < maxRadius) {
                            ctx.beginPath();
                            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

                            const gradient = ctx.createLinearGradient(
                                centerX - radius, centerY,
                                centerX + radius, centerY
                            );
                            
                            const alpha = Math.max(0, 1 - ripplePhase);
                            gradient.addColorStop(0, withAlpha(secondaryColor, alpha * 0.8));
                            gradient.addColorStop(0.5, withAlpha(primaryColor, alpha));
                            gradient.addColorStop(1, withAlpha(accentColor, alpha * 0.8));

                            ctx.strokeStyle = gradient;
                            ctx.lineWidth = Math.max(1, 3 * intensity * (1 - ripplePhase));
                            ctx.shadowColor = withAlpha(secondaryColor, 0.5);
                            ctx.shadowBlur = Math.max(2, 15 * (1 - ripplePhase) * glowIntensity);
                            ctx.stroke();
                        }
                    }
                }

                // Particle corona effect
                if (showParticles) {
                    const baseParticleCount = Math.min(100, 30 + Math.floor(particleIntensity * 20));
                    const particleCount = Math.floor(baseParticleCount * particleDensity);
                    const coronaRadius = Math.max(1, Math.max(node.size[0], node.size[1]) * 0.7);

                    for (let i = 0; i < particleCount; i++) {
                        ctx.save();
                        // Use State.totalTime for continuous rotation
                        const angle = ((i / particleCount) * Math.PI * 2) + (State.totalTime * particleSpeed * direction);
                        const spread = Math.max(0.1, 0.8 + Math.sin(State.totalTime * 0.5 + i) * 0.2 * particleIntensity);
                        const x = (Math.cos(angle) * coronaRadius * spread) + centerX;
                        const y = (Math.sin(angle) * coronaRadius * spread) + centerY;
                        const baseSize = 2 * particleSizeSetting;
                        const size = Math.max(1, baseSize + Math.sin(State.totalTime * 1.5 + i) * 1.5 * particleIntensity);
                        const alpha = 0.7;
                        
                        const particleColor = ColorManager.getParticleColor(
                            node.color || "#ffffff",
                            i,
                            State.totalTime,
                            particleCount
                        );
                        
                        const trailSize = Math.max(1, size * 2);
                        const trailGradient = ctx.createRadialGradient(x, y, 0, x, y, trailSize);
                        trailGradient.addColorStop(0, withAlpha(particleColor, alpha * particleGlowIntensity));
                        trailGradient.addColorStop(1, withAlpha(particleColor, 0));
                        
                        ctx.fillStyle = trailGradient;
                        ctx.shadowColor = withAlpha(particleColor, particleGlowIntensity * 0.5);
                        ctx.shadowBlur = 10 * particleGlowIntensity;
                        ctx.beginPath();
                        ctx.arc(x, y, trailSize, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.fillStyle = withAlpha(particleColor, alpha);
                        ctx.shadowColor = withAlpha(particleColor, particleGlowIntensity);
                        ctx.shadowBlur = 15 * particleGlowIntensity;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.restore();
                    }
                }
                
                ctx.globalAlpha = 1;
            },
            
            flowerOfLife(ctx, node, phase, intensity) {
                const primaryColor = ColorManager.getNodeColor(node.color || "#ffffff");
                const secondaryColor = ColorManager.getSecondaryColor(node.color || "#88ccff");
                const accentColor = ColorManager.getAccentColor(node.color || "#44aaff");
                const centerX = node.size[0] / 2;
                const centerY = node.size[1] / 2;
                
                // Configuration from settings
                const quality = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Quality", 2);
                const particleDensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Density", 1);
                const showParticles = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Show", true);
                const particleGlow = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Glow", 0.5);
                const particleIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Intensity", 1.0);
                const isStaticMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Static.Mode", false);
                const shouldPauseDuringRender = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Pause.During.Render", true);
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;
                const animSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Speed", 1));
                const particleSpeed = Math.max(0.01, app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Speed", 1));
                const scaledTime = effectiveStaticMode ? phase : phase;
                const particleTime = effectiveStaticMode ? phase : phase * particleSpeed;
                const animationSize = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Size", 1);
                const glowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animation.Glow", 0.5);

                // Flower of Life parameters
                const baseRadius = Math.min(node.size[0], node.size[1]) * 0.056 * intensity * animationSize;
                const layers = Math.max(2, Math.floor(quality * 2));
                const rotationSpeed = 0.2;
                const pulseSpeed = 1.5;
                
                ctx.save();

                // Calculate pattern points for both pattern and particles
                const patternPoints = [];
                const rotation = scaledTime * rotationSpeed;
                const pulse = 0.8 + Math.sin(scaledTime * pulseSpeed) * 0.2;

                // Generate all circle center points
                patternPoints.push({ x: centerX, y: centerY }); // Center point
                for (let layer = 1; layer <= layers; layer++) {
                    const numCircles = layer * 6;
                    const layerRadius = baseRadius * 2;
                    
                    for (let i = 0; i < numCircles; i++) {
                        const angle = (i / numCircles) * Math.PI * 2 + rotation;
                        const x = centerX + Math.cos(angle) * layerRadius * layer;
                        const y = centerY + Math.sin(angle) * layerRadius * layer;
                        patternPoints.push({ x, y, layer, index: i });
                    }
                }
                
                // Only draw the Flower of Life pattern if not in particles-only mode
                if (!node.particlesOnly) {
                    // Draw the central circle
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, baseRadius * pulse, 0, Math.PI * 2);
                    ctx.strokeStyle = primaryColor;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = primaryColor;
                    ctx.shadowBlur = 15 * intensity * glowIntensity;
                    ctx.stroke();
                    
                    // Draw the Flower of Life pattern using the generated points
                    for (let i = 1; i < patternPoints.length; i++) {
                        const point = patternPoints[i];
                        const layer = point.layer;
                        const index = point.index;
                        
                        // Draw connecting lines
                        if (i > 1 && index > 0) {
                            const prevPoint = patternPoints[i - 1];
                            ctx.beginPath();
                            ctx.moveTo(prevPoint.x, prevPoint.y);
                            ctx.lineTo(point.x, point.y);
                            ctx.strokeStyle = secondaryColor;
                            ctx.globalAlpha = 0.3 * pulse;
                            ctx.stroke();
                        }
                        
                        // Draw the circle
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, baseRadius * pulse, 0, Math.PI * 2);
                        ctx.strokeStyle = index % 2 === 0 ? secondaryColor : accentColor;
                        ctx.globalAlpha = 1 - (layer / (layers + 1));
                        ctx.stroke();
                    }

                    // Draw sacred geometry overlay
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2 + rotation;
                        const x = centerX + Math.cos(angle) * baseRadius * layers * 2;
                        const y = centerY + Math.sin(angle) * baseRadius * layers * 2;
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = primaryColor;
                    ctx.globalAlpha = 0.3;
                    ctx.stroke();
                    
                    // Add central energy core
                    const coreGradient = ctx.createRadialGradient(
                        centerX, centerY, 0,
                        centerX, centerY, baseRadius * 2
                    );
                    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`);
                    coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * pulse})`);
                    coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.fillStyle = coreGradient;
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Draw particles regardless of particles-only mode
                if (showParticles) {
                    // Draw particles at each pattern point
                    patternPoints.forEach((point, i) => {
                        const particleCount = Math.floor(5 * particleDensity * particleIntensity);
                        const particleSizeSetting = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Size", 1.0);
                        for (let p = 0; p < particleCount; p++) {
                            const particleAngle = (p / particleCount) * Math.PI * 2 + particleTime * 2 * particleIntensity;
                            const particleX = point.x + Math.cos(particleAngle) * (baseRadius * 0.5 * particleIntensity);
                            const particleY = point.y + Math.sin(particleAngle) * (baseRadius * 0.5 * particleIntensity);
                            
                            const particleColor = ColorManager.getParticleColor(
                                node.color || "#ffffff",
                                i * particleCount + p,
                                particleTime,
                                patternPoints.length * particleCount
                            );
                            
                            // Draw particle with glow and apply size setting
                            ctx.beginPath();
                            ctx.arc(particleX, particleY, 2 * quality * particleSizeSetting, 0, Math.PI * 2);
                            ctx.fillStyle = particleColor;
                            ctx.shadowColor = particleColor;
                            ctx.shadowBlur = 10 * particleGlow;
                            ctx.globalAlpha = 0.7 * particleGlow;
                            ctx.fill();
                        }
                    });
                }
                
                ctx.restore();
            },

            // Add new completion animation effect
            renderCompleteFireworks(ctx, phase, intensity) {
                if (!ctx || !ctx.canvas) return;  // Early return if no valid context

                const canvas = ctx.canvas;
                const width = canvas.width;
                const height = canvas.height;

                // Define firework bursts with varying sizes and colors
                const fireworks = [
                    { x: width * 0.05, y: height * -0.2, delay: 0.0, color: '#FF3366', size: 3.2 },    // Large red burst
                    { x: width * 0.03, y: height * -0.15, delay: 0.1, color: '#33EEFF', size: 2.9 },     // Medium blue burst   
                    { x: width * 0.06, y: height * -0.15, delay: 0.2, color: '#FFEE33', size: 3.0 }     // Standard gold burst
                ];

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';

                // For each firework position
                fireworks.forEach(firework => {
                    // Adjust the phase based on the firework's delay
                    const adjustedPhase = Math.max(0, phase - firework.delay);
                    if (adjustedPhase <= 0) return; // Skip if not yet time for this firework

                    // Set the maximum explosion radius relative to the canvas size and firework size
                    const maxExplosionRadius = Math.min(width, height) * 0.2 * firework.size;
                    const particleCount = Math.floor(250 * intensity);

                    // Define complementary colors for this firework
                    const colors = [
                        firework.color,                              // Main color
                        ColorManager.getSecondaryColor(firework.color),  // Secondary color
                        ColorManager.getAccentColor(firework.color),     // Accent color
                        '#FFFFFF'                                    // White for brightness
                    ];

                    // Draw central burst glow
                    const coreRadius = maxExplosionRadius * (0.1 + 0.5 * adjustedPhase);
                    const coreGradient = ctx.createRadialGradient(
                        firework.x, firework.y, 0,
                        firework.x, firework.y, coreRadius
                    );
                    const fadeOut = Math.max(0, 1 - adjustedPhase * 1.2); // Faster fade
                    coreGradient.addColorStop(0, withAlpha('#FFFFFF', 0.95 * fadeOut));
                    coreGradient.addColorStop(0.5, withAlpha(firework.color, 0.8 * fadeOut));
                    coreGradient.addColorStop(1, withAlpha(firework.color, 0));

                    ctx.fillStyle = coreGradient;
                    ctx.beginPath();
                    ctx.arc(firework.x, firework.y, coreRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Physics parameters
                    const gravity = 0.2 * maxExplosionRadius; // Reduced gravity for slower fall
                    const t = adjustedPhase;

                    // Draw particles
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (i / particleCount) * Math.PI * 2;
                        const rand = 0.3 + Math.random() * 0.7;
                        const speed = maxExplosionRadius * rand;

                        // Add some randomness to the trajectory
                        const wobble = Math.sin(t * 10 + i) * 0.05;
                        const dx = Math.cos(angle + wobble) * speed * t;
                        const dy = Math.sin(angle + wobble) * speed * t + gravity * t * t;

                        const pX = firework.x + dx;
                        const pY = firework.y + dy;

                        // Vary particle size based on speed and phase
                        const particleSize = Math.max(1, 3 * (1 - t) * intensity * rand);
                        const alpha = Math.max(0, (1 - t * 1.2) * intensity); // Faster fade

                        // Select color with some randomness
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        const gradient = ctx.createRadialGradient(pX, pY, 0, pX, pY, particleSize * 3);
                        gradient.addColorStop(0, withAlpha(color, alpha));
                        gradient.addColorStop(0.4, withAlpha(color, alpha * 0.5));
                        gradient.addColorStop(1, withAlpha(color, 0));

                        // Draw main particle
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(pX, pY, particleSize * 1.2, 0, Math.PI * 2);
                        ctx.fill();

                        // Add trailing sparks with varying probability based on particle speed
                        if (Math.random() < rand * 0.7) {
                            const trailCount = Math.floor(rand * 3) + 1;
                            for (let j = 1; j <= trailCount; j++) {
                                const trailT = Math.max(0, t - 0.02 * j);
                                const trailX = firework.x + Math.cos(angle + wobble) * speed * trailT;
                                const trailY = firework.y + Math.sin(angle + wobble) * speed * trailT + gravity * trailT * trailT;
                                
                                ctx.fillStyle = withAlpha(color, alpha * (0.7 - j * 0.2));
                                ctx.beginPath();
                                ctx.arc(trailX, trailY, particleSize * (1 - j * 0.2), 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }

                    // Add sparkle effect during initial burst
                    if (adjustedPhase < 0.3) {
                        ctx.fillStyle = withAlpha('#FFFFFF', 0.95 * (1 - adjustedPhase * 3));
                        const sparkleCount = Math.floor(40 * (1 - adjustedPhase / 0.3));
                        for (let i = 0; i < sparkleCount; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const dist = maxExplosionRadius * 0.7 * adjustedPhase * Math.random();
                            const x = firework.x + Math.cos(angle) * dist;
                            const y = firework.y + Math.sin(angle) * dist;
                            const size = 1 + Math.random() * 4 * (1 - adjustedPhase);

                            ctx.beginPath();
                            ctx.arc(x, y, size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                });

                ctx.restore();
            }
        };

        // Enhanced node drawing system
        const origDrawNodeShape = LGraphCanvas.prototype.drawNodeShape;
        LGraphCanvas.prototype.drawNodeShape = function(node, ctx, size, fgcolor, bgcolor, selected, mouse_over) {
            try {
                const globalAnimStyle = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animate", 1);
                const nodeAnimStyle = node.animationStyle !== undefined ? node.animationStyle : globalAnimStyle;
                const isStaticMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Static.Mode", false);
                const shouldPauseDuringRender = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Pause.During.Render", true);
                const animationsEnabled = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animations.Enabled", true);
                const showParticles = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Particle.Show", true);
                
                // Check if this specific node has animations disabled or if animation style is off
                if (node.disableAnimations || nodeAnimStyle === 0) {
                    origDrawNodeShape.call(this, node, ctx, size, fgcolor, bgcolor, selected, mouse_over);
                    return;
                }

                // Force static mode when paused during render
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;

                // Save the entire context state before any transformations
                ctx.save();

                // Draw completion animation if this node is completing and we have a valid canvas context
                if(State.playCompletionAnimation && State.completingNodes.has(node.id) && ctx && ctx.canvas) {
                    ctx.save();
                    AnimationEffects.renderCompleteFireworks(ctx, State.completionPhase, 1);
                    ctx.restore();
                }

                const phase = effectiveStaticMode ? State.staticPhase : AnimationController.update(performance.now(), TimingManager.smoothDelta);
                const showGlow = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Glow.Show", true);
                const glowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Glow", 0.5) * 2;

                // Create enhanced node with proper size and color
                const enhancedNode = {
                    ...node,
                    size: [size[0], size[1]],
                    color: fgcolor,
                    particlesOnly: !animationsEnabled // Add flag to indicate particles-only mode
                };

                // Apply base glow effect for all animation styles if glow is enabled
                if (showGlow) {
                    const nodeGlowIntensity = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Glow", 0.5) * 2;
                    ctx.shadowColor = ColorManager.getNodeColor(fgcolor);
                    ctx.shadowBlur = 5 * nodeGlowIntensity;
                } else {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }

                // Always draw the original node shape first
                origDrawNodeShape.call(this, node, ctx, size, fgcolor, bgcolor, selected, mouse_over);

                // Set up the coordinate system for animations
                ctx.save();

                // Reset any existing shadows before applying animation effects
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                // Apply animation effects based on node-specific style
                switch(nodeAnimStyle) {
                    case 1:
                        AnimationEffects.gentlePulse(ctx, enhancedNode, phase, !enhancedNode.particlesOnly ? app.ui.settings.getSettingValue("📦 Enhanced Nodes.Intensity", 1.0) * 1.5 : 0);
                        break;
                    case 2:
                        AnimationEffects.neonNexus(ctx, enhancedNode, phase, !enhancedNode.particlesOnly ? app.ui.settings.getSettingValue("📦 Enhanced Nodes.Intensity", 1.0) * 1.5 : 0);
                        break;
                    case 3:
                        AnimationEffects.cosmicRipple(ctx, enhancedNode, phase, !enhancedNode.particlesOnly ? app.ui.settings.getSettingValue("📦 Enhanced Nodes.Intensity", 1.0) * 1.5 : 0);
                        break;
                    case 4:
                        AnimationEffects.flowerOfLife(ctx, enhancedNode, phase, !enhancedNode.particlesOnly ? app.ui.settings.getSettingValue("📦 Enhanced Nodes.Intensity", 1.0) * 1.5 : 0);
                        break;
                }

                // Apply enhanced glow effects for selected and hover states if not in particles-only mode
                if ((selected || mouse_over) && !enhancedNode.particlesOnly) {
                    ctx.save();
                    const glowSize = 15 * glowIntensity;
                    ctx.shadowColor = ColorManager.getAccentColor(fgcolor);
                    ctx.shadowBlur = selected ? glowSize * 1.5 : glowSize;
                    ctx.strokeStyle = ColorManager.getSecondaryColor(fgcolor);
                    ctx.lineWidth = 2;
                    ctx.strokeRect(0, 0, size[0], size[1]);
                    ctx.restore();
                }

                // Draw animated text if enabled (now separate from animation effects)
                if (app.ui.settings.getSettingValue("📦 Enhanced Nodes.Text.Animation.Enabled", false)) {
                    ctx.save();
                    const text = node.title || "Node";
                    TextAnimator.drawAnimatedText(ctx, text, size[0] / 2, 16, phase);
                    ctx.restore();
                }

                // Restore the animation context state
                ctx.restore();

                // Restore the original context state
                ctx.restore();

            } catch (error) {
                console.error("Error in drawNodeShape:", error);
                origDrawNodeShape.call(this, node, ctx, size, fgcolor, bgcolor, selected, mouse_over);
            }
        };

        // Add context menu option for toggling animations and selecting animation style
        const origGetNodeMenuOptions = LGraphCanvas.prototype.getNodeMenuOptions;
        LGraphCanvas.prototype.getNodeMenuOptions = function(node) {
            const options = origGetNodeMenuOptions.call(this, node);
            
            options.push(null); // Separator

            // Create submenu for animation styles
            const animationStyleSubmenu = {
                content: "Node Animation Style",
                submenu: {
                    options: [
                        {
                            content: "Use Global Setting",
                            callback: () => {
                                node.animationStyle = null;
                                this.draw(true, true);
                            },
                            checked: node.animationStyle === null
                        },
                        {
                            content: "⭘ Off",
                            callback: () => {
                                node.animationStyle = 0;
                                this.draw(true, true);
                            },
                            checked: node.animationStyle === 0
                        },
                        {
                            content: "💫 Gentle Pulse",
                            callback: () => {
                                node.animationStyle = 1;
                                this.draw(true, true);
                            },
                            checked: node.animationStyle === 1
                        },
                        {
                            content: "🌟 Neon Nexus",
                            callback: () => {
                                node.animationStyle = 2;
                                this.draw(true, true);
                            },
                            checked: node.animationStyle === 2
                        },
                        {
                            content: "🌌 Cosmic Ripple",
                            callback: () => {
                                node.animationStyle = 3;
                                this.draw(true, true);
                            },
                            checked: node.animationStyle === 3
                        },
                        {
                            content: "🌺 Flower of Life",
                            callback: () => {
                                node.animationStyle = 4;
                                this.draw(true, true);
                            },
                            checked: node.animationStyle === 4
                        }
                    ]
                }
            };

            options.push(animationStyleSubmenu);

            options.push(null); // Separator

            // Create submenu for completion animation options
            const completionSubmenu = {
                content: "Completion Animation",
                submenu: {
                    options: [
                        {
                            content: State.primaryCompletionNode === node.id ? "❌ Unset as Primary Source" : "✨ Set as Primary Source",
                            callback: () => {
                                if (State.primaryCompletionNode === node.id) {
                                    State.primaryCompletionNode = null;
                                } else {
                                    State.primaryCompletionNode = node.id;
                                }
                                this.draw(true, true);
                            },
                            checked: State.primaryCompletionNode === node.id
                        },
                        null, // Separator in submenu
                        {
                            content: State.disabledCompletionNodes.has(node.id) ? "🎆 Enable Animation" : "⭘ Disable Animation",
                            callback: () => {
                                if (State.disabledCompletionNodes.has(node.id)) {
                                    State.disabledCompletionNodes.delete(node.id);
                                } else {
                                    State.disabledCompletionNodes.add(node.id);
                                }
                                this.draw(true, true);
                            },
                            checked: !State.disabledCompletionNodes.has(node.id)
                        }
                    ]
                }
            };

            options.push(completionSubmenu);

            return options;
        };

        // Monitor execution status with enhanced state management
        api.addEventListener("status", ({detail}) => {
            const wasRunning = State.isRunning;
            State.isRunning = detail?.exec_info?.queue_remaining > 0;
            
            // Trigger completion animation when rendering finishes
            if(wasRunning && !State.isRunning && app.ui.settings.getSettingValue("📦 Enhanced Nodes.End Animation.Enabled", false)) {
                State.completingNodes.clear();
                
                if (State.primaryCompletionNode && app.graph) {
                    // If there's a primary node, only animate that one
                    const primaryNode = app.graph._nodes_by_id[State.primaryCompletionNode];
                    if (primaryNode) {
                        State.completingNodes.add(State.primaryCompletionNode);
                    }
                } else if(app.graph && app.graph._nodes) {
                    // Otherwise animate all non-disabled nodes
                    app.graph._nodes.forEach(node => {
                        if (!State.disabledCompletionNodes.has(node.id)) {
                            State.completingNodes.add(node.id);
                        }
                    });
                }
                
                State.playCompletionAnimation = true;
                State.completionPhase = 0;
                
                // Force a canvas update
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            }

            // Store state when starting render
            if (State.isRunning && app.ui.settings.getSettingValue("📦 Enhanced Nodes.Pause.During.Render", true)) {
                State.lastRenderState = {
                    phase: State.phase,
                    totalTime: State.totalTime
                };
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.draw(true, true);
                }
            }
            
            // Restore state when render completes
            if (!State.isRunning && State.lastRenderState) {
                State.phase = State.lastRenderState.phase;
                State.totalTime = State.lastRenderState.totalTime;
                State.lastRenderState = null;
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.draw(true, true);
                }
            }
        });

         // Create modal container
        const createPatternDesignerWindow = () => {
            const modal = document.createElement('div');
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

            const titleBar = document.createElement('div');
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

            const title = document.createElement('span');
            title.textContent = 'About Æmotion Studio';
            title.style.cssText = `
                color: #e0e0e0;
                font-weight: bold;
                font-family: 'Orbitron', sans-serif;
            `;
            titleBar.appendChild(title);

            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.style.cssText = `
                background: none;
                border: none;
                color: #e0e0e0;
                font-size: 20px;
                cursor: pointer;
            `;
            closeButton.onclick = () => modal.remove();
            titleBar.appendChild(closeButton);

            modal.appendChild(titleBar);

            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                flex: 1;
                border: none;
                border-radius: 4px;
                background-color: #1a1a1a;
            `;
            
            // Embed the complete HTML content
            const htmlContent = `
                <html lang="en">
                    <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Æmotion Studio</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Montserrat:wght@300;400;700&display=swap"
                        rel="stylesheet"
                    />
                        <style>
                        ${document.querySelector('style') ? document.querySelector('style').textContent : ''}
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
                            animation: textGlow 6s ease-in-out infinite;  /* Increased from 4s to 6s */
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
                            height: 45vh;  /* Increased from 35vh */
                            margin-top: 0;  /* Reduced from 10px */
                            perspective: 1000px;
                        }

                        /* When any sphere is hovered, pause all orbital animations */
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
                            transform-origin: 50% 160px;  /* Reduced from 180px */
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

                        /* Make hover detection more precise */
                        .sphere {
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            border-radius: 50%;
                            cursor: pointer;
                            pointer-events: auto;
                        }

                        /* Ensure logos don't interfere with hover */
                        .logo {
                            position: absolute;
                            top: 53%;  /* Moved from 50% to 52% to shift down slightly */
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

                        /* Keep hover animation running for all spheres */
                        .sphere-container {
                            animation: hoverEffect 3s ease-in-out infinite;
                            animation-play-state: running !important;
                        }

                        /* Remove individual sphere sizes since we're handling scale in the animation */
                        .sphere-container.youtube,
                        .sphere-container.github,
                        .sphere-container.discord,
                        .sphere-container.website {
                            width: 90px;
                            height: 90px;
                        }

                        /* Adjust logo sizes to match sphere scaling */
                        .logo svg {
                            width: 30px;
                            height: 30px;
                            transition: all 0.3s ease;
                        }

                        /* Add depth effect with shadows */
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

                        .sphere-container {
                            width: 90px;
                            height: 90px;
                            position: relative;
                            transform-style: preserve-3d;
                            animation: hoverEffect 3s ease-in-out infinite;
                        }

                        .sphere-container.youtube {
                            width: 80px;
                            height: 80px;
                        }

                        .sphere-container.github {
                            width: 90px;
                            height: 90px;
                        }

                        .sphere-container.discord {
                            width: 100px;
                            height: 100px;
                        }

                        .sphere-container.website {
                            width: 90px;
                            height: 90px;
                        }

                        .sphere-container.discord .logo svg {
                            width: 35px;  /* Slightly larger logo for discord */
                            height: 35px;
                        }

                        .sphere-container.youtube .logo svg {
                            width: 25px;  /* Slightly smaller logo for youtube */
                            height: 25px;
                        }

                        @keyframes hoverEffect {
                            0% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                            100% { transform: translateY(0); }
                        }

                        .sphere {
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            border-radius: 50%;
                            background: radial-gradient(circle at 30% 30%, 
                                rgba(255, 255, 255, 0.8) 0%, 
                                rgba(255, 255, 255, 0.2) 60%, 
                                rgba(255, 255, 255, 0) 100%);
                            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                            transform-style: preserve-3d;
                            backface-visibility: hidden;
                        }

                        .sphere::before {
                            content: '';
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            border-radius: 50%;
                            background: inherit;
                            filter: blur(5px);
                            transform: translateZ(-1px);
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

                        .logo svg {
                            width: 40px;  /* Reduced from 40px */
                            height: 40px;  /* Reduced from 40px */
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

                        #aboutContent p:last-child {
                            margin-bottom: 0;
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

                        /* Specific YouTube logo adjustments */
                        .sphere-container.youtube .logo svg {
                            width: 45px;
                            height: 35px;
                            filter: drop-shadow(0 0 2px rgba(255,255,255,0.6));
                        }

                        /* Adjust other logos for consistent centering */
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
                            <!-- YouTube Sphere -->
                            <a class="ball-link" href="https://www.youtube.com/@aemotionstudio/videos" target="_blank">
                                <div class="sphere-container youtube">
                                    <div class="sphere sphere-youtube"></div>
                                    <div class="logo">
                                        <svg viewBox="0 0 71.412065 50" width="45" height="35" xmlns="http://www.w3.org/2000/svg" fill="white">
                                            <path d="M69.912,7.82a8.977,8.977,0,0,0-6.293-6.293C58.019,0,35.706,0,35.706,0S13.393,0,7.793,1.527A8.977,8.977,0,0,0,1.5,7.82C0,13.42,0,25,0,25S0,36.58,1.5,42.18a8.977,8.977,0,0,0,6.293,6.293C13.393,50,35.706,50,35.706,50s22.313,0,27.913-1.527a8.977,8.977,0,0,0,6.293-6.293C71.412,36.58,71.412,25,71.412,25S71.412,13.42,69.912,7.82ZM28.564,35.714V14.286L47.471,25Z"/>
                                        </svg>
                                    </div>
                                </div>
                            </a>
                            <!-- GitHub Sphere -->
                            <a class="ball-link" href="https://github.com/AEmotionStudio/" target="_blank">
                                <div class="sphere-container github">
                                    <div class="sphere sphere-github"></div>
                                    <div class="logo">
                                        <svg viewBox="0 0 98 96" width="40" height="40" xmlns="http://www.w3.org/2000/svg" fill="white">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 5.052 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                                        </svg>
                                    </div>
                                </div>
                            </a>
                            <!-- Discord Sphere -->
                            <a class="ball-link" href="https://discord.gg/UzC9353mfp" target="_blank">
                                <div class="sphere-container discord">
                                    <div class="sphere sphere-discord"></div>
                                    <div class="logo">
                                        <svg viewBox="0 0 127.14 96.36" width="40" height="40" xmlns="http://www.w3.org/2000/svg" fill="white">
                                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                                        </svg>
                                    </div>
                                </div>
                            </a>
                            <!-- Website Sphere -->
                            <a class="ball-link" href="https://aemotionstudio.org/" target="_blank">
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
                    <script>
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
                                span.textContent = char === " " ? "\u00A0" : char;
                                span.style.whiteSpace = "pre";
                                span.style.animation = \`rainbowWave 2s infinite\`;
                                span.style.animationDelay = \`\${index * 0.1}s\`;
                                rainbowElem.appendChild(span);
                            });
                        }
                        </script>
                    </body>
                </html>
            `;
            
            iframe.srcdoc = htmlContent;
            modal.appendChild(iframe);

            // Make window draggable
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;

            titleBar.onmousedown = (e) => {
                isDragging = true;
                
                const rect = modal.getBoundingClientRect();
                modal.style.transform = 'none';
                modal.style.left = rect.left + 'px';
                modal.style.top = rect.top + 'px';
                
                initialX = e.clientX - rect.left;
                initialY = e.clientY - rect.top;
            };

            document.onmousemove = (e) => {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    modal.style.left = currentX + 'px';
                    modal.style.top = currentY + 'px';
                }
            };

            document.onmouseup = () => {
                isDragging = false;
            };

            return modal;
        };

        // Enhanced animation loop
        function animate(currentTime) {
            if (State.isAnimating) return;
            
            try {
                State.isAnimating = true;
                
                if (State.playCompletionAnimation) {
                    State.completionPhase += 0.014; // ~70fps
                    if (State.completionPhase >= 1) {
                        State.playCompletionAnimation = false;
                    }
                    
                    const canvas = app.graph.canvas.canvas;
                    const ctx = canvas.getContext('2d');
                    const ds = app.graph.canvas.ds;
                    
                    ctx.save();
                    // Apply current canvas transformations
                    ctx.setTransform(ds.scale, 0, 0, ds.scale, ds.offset[0], ds.offset[1]);
                    
                    AnimationEffects.renderCompleteFireworks(ctx, State.completionPhase, 1);
                    
                    ctx.restore();
                }

                const animStyle = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Animate", 1);
                const isStaticMode = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Static.Mode", false);
                const shouldPauseDuringRender = app.ui.settings.getSettingValue("📦 Enhanced Nodes.Pause.During.Render", true);
                
                // Use static phase when paused
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;
                
                // Always update animation state if not in static mode, regardless of animation enabled state
                if (animStyle > 0 && !effectiveStaticMode) {
                    const delta = TimingManager.update(currentTime);
                    
                    // Update animation and particle phases independently
                    State.phase = AnimationController.update(currentTime, delta);
                    State.particlePhase = ParticleController.update(currentTime, delta);
                    
                    State.totalTime += delta;
                    
                    // Throttle canvas updates for better performance
                    if (currentTime - State.lastRAFTime >= 32) {
                        app.graph.setDirtyCanvas(true, false);
                        State.lastRAFTime = currentTime;
                    }
                }
            } catch (error) {
                console.error("Error in animation loop:", error);
            } finally {
                State.isAnimating = false;
                State.animationFrame = requestAnimationFrame(animate);
            }
        }

        // Initialize Animation with enhanced cleanup
        State.animationFrame = requestAnimationFrame(animate);

        // Enhanced cleanup
        return () => {
            if (State.animationFrame) {
                cancelAnimationFrame(State.animationFrame);
                State.animationFrame = null;
            }
            State.isAnimating = false;
            State.nodeEffects.clear();
            State.particlePool.clear();
            State.activeParticles.clear();
            
            if (app.graph && app.graph.canvas) {
                const ctx = app.graph.canvas.getContext('2d');
                if (ctx) {
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
            }
        };
    }
});