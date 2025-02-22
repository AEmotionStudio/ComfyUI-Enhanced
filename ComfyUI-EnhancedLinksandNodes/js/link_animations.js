import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
    name: "enhanced.link.animations",
    async setup() {
        // 🔮 Sacred Mathematical Constants
        const PHI = 1.618033988749895;
        const SACRED = {
            TRINITY: 3,      // Base pattern foundation
            HARMONY: 7,      // Flow and crystalline structures
            COMPLETION: 12,  // Complex pattern completion
            FIBONACCI: [1, 1, 2, 3, 5, 8, 13, 21], // Growth patterns
            QUANTUM: 5,      // Quantum effects base
            INFINITY: 8      // Infinite pattern cycles
        };

        // Default settings configuration
        const DEFAULT_SETTINGS = {
            "🔗 Enhanced Links.Animate": 9,                    // Classic Flow
            "🔗 Enhanced Links.Animation.Speed": 1,            // Normal speed
            "🔗 Enhanced Links.Color.Mode": "default",         // Default colors
            "🔗 Enhanced Links.Color.Accent": "#9d00ff",      // Purple
            "🔗 Enhanced Links.Color.Secondary": "#fb00ff",    // Pink
            "🔗 Enhanced Links.Color.Primary": "#ffb300",      // Orange
            "🔗 Enhanced Links.Color.Scheme": "default",       // Original colors
            "🔗 Enhanced Links.Direction": 1,                  // Forward
            "🔗 Enhanced Links.Glow.Intensity": 10,           // Medium glow
            "🔗 Enhanced Links.Link.Style": "spline",          // Spline style
            "🔗 Enhanced Links.Marker.Enabled": true,         // Markers enabled
            "🔗 Enhanced Links.Marker.Effects": "none",        // No effects
            "🔗 Enhanced Links.Marker.Glow": 10,              // Medium glow
            "🔗 Enhanced Links.Marker.Color": "#00fff7",      // Cyan
            "🔗 Enhanced Links.Marker.Color.Mode": "default",  // Default colors
            "🔗 Enhanced Links.Marker.Size": 3,               // Large size
            "🔗 Enhanced Links.Marker.Shape": "arrow",        // Arrow shape
            "🔗 Enhanced Links.Particle.Density": 0.5,          // Minimal
            "🔗 Enhanced Links.Quality": 1,                    // Basic (Fast)
            "🔗 Enhanced Links.Link.Shadow.Enabled": true,    // Link shadows enabled
            "🔗 Enhanced Links.Marker.Shadow.Enabled": true,  // Marker shadows enabled
            "🔗 Enhanced Links.Thickness": 3,                 // Medium thickness
            "🔗 Enhanced Links.UI & Æmotion Studio About": 0,  // Closed panel
            "🔗 Enhanced Links.Static.Mode": false,            // Animated mode
            "🔗 Enhanced Links.Pause.During.Render": true,     // Pause during render
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

        // ⚡ State Management System
        const State = {
            isRunning: false,
            phase: 0,
            lastFrame: performance.now(),
            animationFrame: null,
            particlePool: new Map(),
            activeParticles: new Set(),
            totalTime: 0,
            speedMultiplier: 1,
            linkPositions: new Map(),
            lastNodePositions: new Map(),
            staticPhase: Math.PI / 4,  // Static phase for static mode
            lastAnimStyle: null,       // Track last animation style
            lastLinkStyle: null,       // Track last link style
            forceUpdate: false,        // Force update flag
            forceRedraw: false,        // Force immediate redraw flag
            lastRenderState: null,     // Store last render state when paused
            lastSettings: null         // Track settings combination
        };

        // 🎨 Marker Shape Definitions
        const MarkerShapes = {
            none: function(ctx, x, y, size) {
                // Do nothing - no marker to draw
            },
            
            diamond: function(ctx, x, y, size) {
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size, y);
                ctx.lineTo(x, y + size);
                ctx.lineTo(x - size, y);
                ctx.closePath();
            },
            
            circle: function(ctx, x, y, size) {
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.closePath();
            },
            
            arrow: function(ctx, x, y, size, angle = 0) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                
                ctx.beginPath();
                // Arrow head
                ctx.moveTo(size, 0);
                ctx.lineTo(-size, size);
                ctx.lineTo(-size * 0.5, 0);
                ctx.lineTo(-size, -size);
                ctx.closePath();
                
                ctx.restore();
            },
            
            square: function(ctx, x, y, size) {
                ctx.beginPath();
                ctx.rect(x - size, y - size, size * 2, size * 2);
                ctx.closePath();
            },
            
            triangle: function(ctx, x, y, size) {
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size, y + size);
                ctx.lineTo(x - size, y + size);
                ctx.closePath();
            },
            
            star: function(ctx, x, y, size) {
                const spikes = 5;
                const outerRadius = size;
                const innerRadius = size * 0.4;
                
                ctx.beginPath();
                for(let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const pointX = x + Math.cos(angle) * radius;
                    const pointY = y + Math.sin(angle) * radius;
                    
                    i === 0 ? ctx.moveTo(pointX, pointY) : ctx.lineTo(pointX, pointY);
                }
                ctx.closePath();
            },

            heart: function(ctx, x, y, size) {
                ctx.beginPath();
                ctx.save();
                ctx.translate(x, y);
                
                // Scale to match other marker sizes
                const scale = size * 0.7;
                ctx.scale(scale, scale);
                
                // Draw heart shape
                ctx.moveTo(0, 0.4);
                ctx.bezierCurveTo(0, 0.3, -0.5, -0.4, -1, -0.4);
                ctx.bezierCurveTo(-1.5, -0.4, -1.5, 0.2, -1.5, 0.2);
                ctx.bezierCurveTo(-1.5, 0.6, -0.5, 1.4, 0, 2);
                ctx.bezierCurveTo(0.5, 1.4, 1.5, 0.6, 1.5, 0.2);
                ctx.bezierCurveTo(1.5, 0.2, 1.5, -0.4, 1, -0.4);
                ctx.bezierCurveTo(0.5, -0.4, 0, 0.3, 0, 0.4);
                
                ctx.restore();
                ctx.closePath();
            },

            cross: function(ctx, x, y, size) {
                ctx.beginPath();
                const width = size * 0.3;
                // Vertical line
                ctx.moveTo(x, y - size);
                ctx.lineTo(x, y + size);
                // Horizontal line
                ctx.moveTo(x - size, y);
                ctx.lineTo(x + size, y);
                ctx.closePath();
                
                // Add thickness
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.lineCap = 'butt';  // Reset lineCap
            },

            hexagon: function(ctx, x, y, size) {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const pointX = x + Math.cos(angle) * size;
                    const pointY = y + Math.sin(angle) * size;
                    i === 0 ? ctx.moveTo(pointX, pointY) : ctx.lineTo(pointX, pointY);
                }
                ctx.closePath();
            },

            flower: function(ctx, x, y, size) {
                const petals = 6;
                const innerRadius = size * 0.3;
                const outerRadius = size;
                
                ctx.beginPath();
                // Draw petals
                for (let i = 0; i < petals; i++) {
                    const angle = (i * Math.PI * 2) / petals;
                    const nextAngle = ((i + 1) * Math.PI * 2) / petals;
                    const midAngle = (angle + nextAngle) / 2;
                    
                    const startX = x + Math.cos(angle) * innerRadius;
                    const startY = y + Math.sin(angle) * innerRadius;
                    const controlX = x + Math.cos(midAngle) * outerRadius * 1.5;
                    const controlY = y + Math.sin(midAngle) * outerRadius * 1.5;
                    const endX = x + Math.cos(nextAngle) * innerRadius;
                    const endY = y + Math.sin(nextAngle) * innerRadius;
                    
                    i === 0 ? ctx.moveTo(startX, startY) : ctx.lineTo(startX, startY);
                    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                }
                ctx.closePath();
                
                // Draw center
                ctx.moveTo(x + innerRadius, y);
                ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
            },

            spiral: function(ctx, x, y, size) {
                ctx.beginPath();
                const turns = 3;
                const points = 40;
                
                for (let i = 0; i <= points; i++) {
                    const t = i / points;
                    const radius = size * t;
                    const angle = t * turns * Math.PI * 2;
                    const pointX = x + Math.cos(angle) * radius;
                    const pointY = y + Math.sin(angle) * radius;
                    
                    i === 0 ? ctx.moveTo(pointX, pointY) : ctx.lineTo(pointX, pointY);
                }
            }
        };

        // 🎭 Animation State Controller
        const AnimationState = {
            targetPhase: 0,
            direction: 1,
            transitionSpeed: PHI,
            smoothFactor: 0.95,
            
            update(delta) {
                const flowDirection = app.ui.settings.getSettingValue("🔗 Enhanced Links.Direction", 1);
                
                if (this.direction !== flowDirection) {
                    this.direction = flowDirection;
                    this.targetPhase = State.phase + Math.PI * 2 * this.direction;
                }
                
                const phaseStep = this.transitionSpeed * delta * PHI;
                
                if (Math.abs(this.targetPhase - State.phase) > 0.01) {
                    State.phase += Math.sign(this.targetPhase - State.phase) * phaseStep;
                } else {
                    State.phase = (State.phase + phaseStep * -this.direction) % (Math.PI * 2);
                    this.targetPhase = State.phase;
                }
                
                return State.phase;
            }
        };

        // ⚙️ Performance-Optimized Timing System
        const TimingManager = {
            smoothDelta: 0,
            frameCount: 0,
            
            update() {
                const now = performance.now();
                const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
                const rawDelta = Math.min((now - State.lastFrame) / 1000, 1/30) * animSpeed;
                State.lastFrame = now;
                
                this.frameCount++;
                this.smoothDelta = this.smoothDelta * AnimationState.smoothFactor + 
                                 rawDelta * (1 - AnimationState.smoothFactor);
                return this.smoothDelta;
            }
        };

        // 🎨 Enhanced Visual Settings
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Alert",
            name: "⚠️ This window is draggable. Drag for a better view of links.",
            type: "button",
            tooltip: "This is just a placeholder to display this tip message.",
            callback: () => {}  // Empty callback as this is just a placeholder
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Animate",
            name: "✨ Link Animation Style",
            type: "combo",
            options: [
                {value: 0, text: "⭘️ Off"},
                {value: 9, text: "🔄 Classic Flow"},  // Add new style
                {value: 1, text: "✨ Sacred Flow"},
                {value: 2, text: "💎 Crystal Stream"},
                {value: 3, text: "🔬 Quantum Field"},
                {value: 4, text: "🌌 Cosmic Weave"},
                {value: 5, text: "⚡ Energy Pulse"},
                {value: 6, text: "🧬 DNA Helix"},
                {value: 7, text: "🌋 Lava Flow"},
                {value: 8, text: "🌠 Stellar Plasma"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Animate"],
            callback: () => {
                // Force immediate update when style changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    // Set both canvas flags
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    
                    // Force synchronous redraw
                    app.graph.canvas.draw(true, true);
                    
                    // Trigger multiple UI events
                    const canvas = app.graph.canvas._canvas;
                    canvas.dispatchEvent(new MouseEvent('mousemove'));
                    canvas.dispatchEvent(new MouseEvent('mousedown'));
                    canvas.dispatchEvent(new MouseEvent('mouseup'));
                    
                    // Request next frame
                    requestAnimationFrame(() => {
                        app.graph.canvas.draw(true, true);
                    });
                }
            }
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Static.Mode",
            name: "🎨 Static Mode",
            type: "combo",
            options: [
                {value: false, text: "✨ Animated"},
                {value: true, text: "🖼️ Static"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Static.Mode"],
            tooltip: "Keep the visual style but disable animations.",
            callback: () => {
                // Force update when toggling static mode
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    // Set both canvas flags
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    
                    // Force synchronous redraw
                    app.graph.canvas.draw(true, true);
                    
                    // Trigger multiple UI events
                    const canvas = app.graph.canvas._canvas;
                    canvas.dispatchEvent(new MouseEvent('mousemove'));
                    canvas.dispatchEvent(new MouseEvent('mousedown'));
                    canvas.dispatchEvent(new MouseEvent('mouseup'));
                    
                    // Request next frame
                    requestAnimationFrame(() => {
                        app.graph.canvas.draw(true, true);
                    });
                }
            }
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Pause.During.Render",
            name: "⏸️ Pause During Render",
            type: "combo",
            options: [
                {value: true, text: "✅ Enabled"},
                {value: false, text: "❌ Disabled"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Pause.During.Render"],
            tooltip: "Pause animations during rendering to improve performance."
        });

        // 🔗 Link Style Renderers
        const LinkRenderers = {
            spline: {
                getLength: function(start, end) {
                    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                    const samples = 40;
                    let length = 0;
                    let prevPoint = this.getPoint(start, end, 0);
                    
                    for (let i = 1; i <= samples; i++) {
                        const t = i / samples;
                        const point = this.getPoint(start, end, t);
                        length += Math.sqrt(
                            Math.pow(point[0] - prevPoint[0], 2) + 
                            Math.pow(point[1] - prevPoint[1], 2)
                        );
                        prevPoint = point;
                    }
                    
                    return length;
                },
                
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    const samples = 40;
                    let accumulatedLength = 0;
                    let prevPoint = this.getPoint(start, end, 0);
                    
                    for (let i = 1; i <= samples; i++) {
                        const t = i / samples;
                        const point = this.getPoint(start, end, t);
                        const segmentLength = Math.sqrt(
                            Math.pow(point[0] - prevPoint[0], 2) + 
                            Math.pow(point[1] - prevPoint[1], 2)
                        );
                        
                        accumulatedLength += segmentLength;
                        
                        if (accumulatedLength >= targetDist) {
                            const prevT = (i - 1) / samples;
                            const excess = accumulatedLength - targetDist;
                            return prevT + ((t - prevT) * (1 - excess / segmentLength));
                        }
                        
                        prevPoint = point;
                    }
                    
                    return 1;
                },
                
                getPoint: function(start, end, t) {
                    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                    const bendDistance = Math.min(dist * 0.5, 100);
                    
                    const p0 = { x: start[0], y: start[1] };
                    const p1 = { x: start[0] + bendDistance, y: start[1] };
                    const p2 = { x: end[0] - bendDistance, y: end[1] };
                    const p3 = { x: end[0], y: end[1] };
                    
                    const cx = 3 * (p1.x - p0.x);
                    const bx = 3 * (p2.x - p1.x) - cx;
                    const ax = p3.x - p0.x - cx - bx;
                    
                    const cy = 3 * (p1.y - p0.y);
                    const by = 3 * (p2.y - p1.y) - cy;
                    const ay = p3.y - p0.y - cy - by;
                    
                    const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
                    const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;
                    
                    return [x, y];
                },
                
                draw: function(ctx, start, end, color, thickness, isStatic = false) {
                    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                    const bendDistance = Math.min(dist * 0.5, 100);
                    
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.bezierCurveTo(
                        start[0] + bendDistance, start[1],
                        end[0] - bendDistance, end[1],
                        end[0], end[1]
                    );
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },
            
            straight: {
                getLength: function(start, end) {
                    return Math.sqrt(
                        Math.pow(end[0] - start[0], 2) + 
                        Math.pow(end[1] - start[1], 2)
                    );
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },
            
            linear: {
                getLength: function(start, end) {
                    const midX = (start[0] + end[0]) / 2;
                    const horizontalLength1 = Math.abs(midX - start[0]);
                    const verticalLength = Math.abs(end[1] - start[1]);
                    const horizontalLength2 = Math.abs(end[0] - midX);
                    
                    return horizontalLength1 + verticalLength + horizontalLength2;
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    const midX = (start[0] + end[0]) / 2;
                    const horizontalLength1 = Math.abs(midX - start[0]);
                    const verticalLength = Math.abs(end[1] - start[1]);
                    const horizontalLength2 = Math.abs(end[0] - midX);
                    
                    const segment1Proportion = horizontalLength1 / totalLength;
                    const segment2Proportion = verticalLength / totalLength;
                    
                    const normalizedDist = targetDist / totalLength;
                    
                    if (normalizedDist <= segment1Proportion) {
                        return (normalizedDist / segment1Proportion) * 0.33;
                    } else if (normalizedDist <= segment1Proportion + segment2Proportion) {
                        const segmentProgress = (normalizedDist - segment1Proportion) / segment2Proportion;
                        return 0.33 + (segmentProgress * 0.34);
                    } else {
                        const segmentProgress = (normalizedDist - (segment1Proportion + segment2Proportion)) / 
                                             (horizontalLength2 / totalLength);
                        return 0.67 + (segmentProgress * 0.33);
                    }
                },
                getPoint: function(start, end, t) {
                    const midX = (start[0] + end[0]) / 2;
                    
                    if (t <= 0.33) {
                        const segmentT = t / 0.33;
                        return [
                            start[0] + (midX - start[0]) * segmentT,
                            start[1]
                        ];
                    } else if (t <= 0.67) {
                        const segmentT = (t - 0.33) / 0.34;
                        return [
                            midX,
                            start[1] + (end[1] - start[1]) * segmentT
                        ];
                    } else {
                        const segmentT = (t - 0.67) / 0.33;
                        return [
                            midX + (end[0] - midX) * segmentT,
                            end[1]
                        ];
                    }
                },
                draw: function(ctx, start, end, color, thickness) {
                    const midX = (start[0] + end[0]) / 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(midX, start[1]);
                    ctx.lineTo(midX, end[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },
            
            hidden: {
                getLength: function(start, end) {
                    return Math.sqrt(
                        Math.pow(end[0] - start[0], 2) + 
                        Math.pow(end[1] - start[1], 2)
                    );
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    // Don't render anything for hidden style
                }
            },

            dotted: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    const length = this.getLength(start, end);
                    const dotSpacing = thickness * 3;
                    const numDots = Math.floor(length / dotSpacing);
                    
                    for (let i = 0; i <= numDots; i++) {
                        const t = i / numDots;
                        const pos = this.getPoint(start, end, t);
                        
                        ctx.beginPath();
                        ctx.arc(pos[0], pos[1], thickness * 0.4, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();
                    }
                }
            },

            dashed: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    ctx.beginPath();
                    ctx.setLineDash([thickness * 4, thickness * 2]);
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                    ctx.setLineDash([]); // Reset dash pattern
                }
            },

            double: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
                    const offset = thickness * 0.8;
                    
                    // Draw first line
                    ctx.beginPath();
                    ctx.moveTo(start[0] + Math.cos(angle + Math.PI/2) * offset, 
                              start[1] + Math.sin(angle + Math.PI/2) * offset);
                    ctx.lineTo(end[0] + Math.cos(angle + Math.PI/2) * offset, 
                              end[1] + Math.sin(angle + Math.PI/2) * offset);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.4;
                    ctx.stroke();
                    
                    // Draw second line
                    ctx.beginPath();
                    ctx.moveTo(start[0] + Math.cos(angle - Math.PI/2) * offset, 
                              start[1] + Math.sin(angle - Math.PI/2) * offset);
                    ctx.lineTo(end[0] + Math.cos(angle - Math.PI/2) * offset, 
                              end[1] + Math.sin(angle - Math.PI/2) * offset);
                    ctx.stroke();
                }
            },

            stepped: {
                getLength: function(start, end) {
                    const dx = Math.abs(end[0] - start[0]);
                    const dy = Math.abs(end[1] - start[1]);
                    return dx + dy;
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    const midX = start[0] + (end[0] - start[0]) * (t < 0.5 ? t * 2 : 1);
                    const midY = start[1] + (end[1] - start[1]) * (t >= 0.5 ? (t - 0.5) * 2 : 0);
                    return [midX, midY];
                },
                draw: function(ctx, start, end, color, thickness) {
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(start[0] + (end[0] - start[0]), start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },

            zigzag: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    const basePoint = [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
                    const amplitude = 10;
                    const frequency = 10;
                    
                    return [
                        basePoint[0] + Math.cos(angle + Math.PI/2) * Math.sin(t * Math.PI * frequency) * amplitude,
                        basePoint[1] + Math.sin(angle + Math.PI/2) * Math.sin(t * Math.PI * frequency) * amplitude
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    ctx.beginPath();
                    const steps = 50;
                    for (let i = 0; i <= steps; i++) {
                        const t = i / steps;
                        const point = this.getPoint(start, end, t);
                        i === 0 ? ctx.moveTo(point[0], point[1]) : ctx.lineTo(point[0], point[1]);
                    }
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                }
            },

            rope: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    const basePoint = [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
                    const amplitude = 3;
                    const frequency = 20;
                    
                    return [
                        basePoint[0] + Math.cos(angle + Math.PI/2) * Math.sin(t * Math.PI * frequency) * amplitude,
                        basePoint[1] + Math.sin(angle + Math.PI/2) * Math.sin(t * Math.PI * frequency) * amplitude
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    // Draw main rope
                    ctx.beginPath();
                    const steps = 100;
                    for (let i = 0; i <= steps; i++) {
                        const t = i / steps;
                        const point = this.getPoint(start, end, t);
                        i === 0 ? ctx.moveTo(point[0], point[1]) : ctx.lineTo(point[0], point[1]);
                    }
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 1.2;
                    ctx.lineCap = 'round';
                    ctx.stroke();

                    // Draw highlight
                    ctx.beginPath();
                    for (let i = 0; i <= steps; i++) {
                        const t = i / steps;
                        const point = this.getPoint(start, end, t);
                        i === 0 ? ctx.moveTo(point[0], point[1]) : ctx.lineTo(point[0], point[1]);
                    }
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = thickness * 0.4;
                    ctx.stroke();
                }
            },

            glowpath: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    // Draw base line
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();

                    // Draw outer glow
                    const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');

                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = thickness * 2;
                    ctx.globalAlpha = 0.5;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            },

            chain: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    const length = this.getLength(start, end);
                    const linkSize = thickness * 2;
                    const numLinks = Math.floor(length / (linkSize * 2));
                    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

                    for (let i = 0; i < numLinks; i++) {
                        const t = i / numLinks;
                        const pos = this.getPoint(start, end, t);

                        // Draw chain link
                        ctx.beginPath();
                        ctx.ellipse(pos[0], pos[1], linkSize, linkSize * 0.6, angle, 0, Math.PI * 2);
                        ctx.strokeStyle = color;
                        ctx.lineWidth = thickness * 0.4;
                        ctx.stroke();
                    }
                }
            },

            pulse: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    const length = this.getLength(start, end);
                    const dashLength = thickness * 4;
                    const numDashes = Math.floor(length / (dashLength * 2));
                    
                    ctx.beginPath();
                    ctx.setLineDash([dashLength, dashLength]);
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness * 0.8;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Add pulse effect
                    const pulseWidth = thickness * 3;
                    const pulseSpacing = length / numDashes;
                    
                    for (let i = 0; i < numDashes; i++) {
                        const t = i / numDashes;
                        const pos = this.getPoint(start, end, t);
                        
                        const gradient = ctx.createRadialGradient(
                            pos[0], pos[1], 0,
                            pos[0], pos[1], pulseWidth
                        );
                        gradient.addColorStop(0, color);
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        
                        ctx.beginPath();
                        ctx.arc(pos[0], pos[1], pulseWidth, 0, Math.PI * 2);
                        ctx.fillStyle = gradient;
                        ctx.globalAlpha = 0.3;
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1;
                }
            },

            holographic: {
                getLength: function(start, end) {
                    return Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
                },
                getNormalizedT: function(start, end, targetDist, totalLength) {
                    return targetDist / totalLength;
                },
                getPoint: function(start, end, t) {
                    return [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t
                    ];
                },
                draw: function(ctx, start, end, color, thickness) {
                    // Draw main line with holographic effect
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1]);
                    ctx.lineTo(end[0], end[1]);
                    
                    // Create gradient for holographic effect
                    const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
                    gradient.addColorStop(1, color);
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = thickness * 1.2;
                    ctx.stroke();

                    // Add scanline effect
                    const length = this.getLength(start, end);
                    const scanlineSpacing = thickness * 2;
                    const numScanlines = Math.floor(length / scanlineSpacing);
                    
                    for (let i = 0; i <= numScanlines; i++) {
                        const t = i / numScanlines;
                        const pos = this.getPoint(start, end, t);
                        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
                        
                        ctx.beginPath();
                        ctx.moveTo(
                            pos[0] + Math.cos(angle + Math.PI/2) * thickness,
                            pos[1] + Math.sin(angle + Math.PI/2) * thickness
                        );
                        ctx.lineTo(
                            pos[0] + Math.cos(angle - Math.PI/2) * thickness,
                            pos[1] + Math.sin(angle - Math.PI/2) * thickness
                        );
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        };

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Link.Style",
            name: "🔗 Link Style",
            type: "combo",
            options: [
                {value: "spline", text: "Spline"},
                {value: "linear", text: "Straight"},
                {value: "straight", text: "Linear"},
                {value: "hidden", text: "Hidden"},
                {value: "dotted", text: "Dotted"},
                {value: "dashed", text: "Dashed"},
                {value: "double", text: "Double"},
                {value: "stepped", text: "Stepped"},
                {value: "zigzag", text: "Zigzag"},
                {value: "rope", text: "Rope"},
                {value: "glowpath", text: "Glowpath"},
                {value: "chain", text: "Chain"},
                {value: "pulse", text: "Pulse"},
                {value: "holographic", text: "Holographic"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Link.Style"],
            callback: () => {
                // Force immediate update when link style changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    // Set both canvas flags
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    
                    // Force synchronous redraw
                    app.graph.canvas.draw(true, true);
                    
                    // Trigger multiple UI events
                    const canvas = app.graph.canvas._canvas;
                    canvas.dispatchEvent(new MouseEvent('mousemove'));
                    canvas.dispatchEvent(new MouseEvent('mousedown'));
                    canvas.dispatchEvent(new MouseEvent('mouseup'));
                    
                    // Request next frame
                    requestAnimationFrame(() => {
                        app.graph.canvas.draw(true, true);
                    });
                }
            }
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Direction",
            name: "🔄 Flow Direction",
            type: "combo",
            options: [
                {value: 1, text: "Forward ➡️"},
                {value: -1, text: "Reverse ⬅️"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Direction"]
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Quality",
            name: "🎨 Visual Quality",
            type: "combo",
            options: [
                {value: 1, text: "Basic (Fast)"},
                {value: 2, text: "Balanced"},
                {value: 3, text: "Divine (High CPU)"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Quality"],
            callback: () => {
                // Force immediate update when quality changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    // Set both canvas flags
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    
                    // Force synchronous redraw
                    app.graph.canvas.draw(true, true);
                    
                    // Trigger multiple UI events
                    const canvas = app.graph.canvas._canvas;
                    canvas.dispatchEvent(new MouseEvent('mousemove'));
                    canvas.dispatchEvent(new MouseEvent('mousedown'));
                    canvas.dispatchEvent(new MouseEvent('mouseup'));
                    
                    // Request next frame
                    requestAnimationFrame(() => {
                        app.graph.canvas.draw(true, true);
                    });
                }
            }
        });

        // 🛠 Additional Visual Enhancement Settings
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Thickness",
            name: "💫 Link Thickness",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Thickness"],  // Changed from default to defaultValue
            min: 1,
            max: 10,
            step: 0.5,
            callback: () => {
                // Force immediate update when thickness changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    // Set both canvas flags
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    
                    // Force synchronous redraw
                    app.graph.canvas.draw(true, true);
                    
                    // Trigger multiple UI events
                    const canvas = app.graph.canvas._canvas;
                    canvas.dispatchEvent(new MouseEvent('mousemove'));
                    canvas.dispatchEvent(new MouseEvent('mousedown'));
                    canvas.dispatchEvent(new MouseEvent('mouseup'));
                    
                    // Request next frame
                    requestAnimationFrame(() => {
                        app.graph.canvas.draw(true, true);
                    });
                }
            }
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Glow.Intensity",
            name: "✨ Link Glow Intensity",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Glow.Intensity"],  // Changed from default to defaultValue
            min: 0,
            max: 30,
            step: 1,
            callback: () => {
                // Force immediate update when link glow intensity changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    // Set both canvas flags
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    
                    // Force synchronous redraw
                    app.graph.canvas.draw(true, true);
                    
                    // Trigger multiple UI events
                    const canvas = app.graph.canvas._canvas;
                    canvas.dispatchEvent(new MouseEvent('mousemove'));
                    canvas.dispatchEvent(new MouseEvent('mousedown'));
                    canvas.dispatchEvent(new MouseEvent('mouseup'));
                    
                    // Request next frame
                    requestAnimationFrame(() => {
                        app.graph.canvas.draw(true, true);
                    });
                }
            }
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Color.Scheme",
            name: "🎨 Color Enhancement",
            type: "combo",
            options: [
                {value: "default", text: "Original Colors"},
                {value: "saturated", text: "Increased Saturation"},
                {value: "vivid", text: "Vivid Enhancement"},
                {value: "contrast", text: "High Contrast"},
                {value: "bright", text: "Brightness Boost"},
                {value: "muted", text: "Subtle Tones"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Color.Scheme"]
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Particle.Density",
            name: "🔮 Particle Density",
            type: "combo",
            options: [
                {value: 0.5, text: "Minimal"},
                {value: 1, text: "Balanced"},
                {value: 2, text: "Dense"},
                {value: 3, text: "Ultra"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Particle.Density"],
            callback: () => {
                // Force immediate update when particle density changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    // Set both canvas flags
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    
                    // Force synchronous redraw
                    app.graph.canvas.draw(true, true);
                    
                    // Trigger multiple UI events
                    const canvas = app.graph.canvas._canvas;
                    canvas.dispatchEvent(new MouseEvent('mousemove'));
                    canvas.dispatchEvent(new MouseEvent('mousedown'));
                    canvas.dispatchEvent(new MouseEvent('mouseup'));
                    
                    // Request next frame
                    requestAnimationFrame(() => {
                        app.graph.canvas.draw(true, true);
                    });
                }
            }
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Animation.Speed",
            name: "⚡ Animation Speed",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Animation.Speed"],
            min: 0.1,
            max: 100,
            step: 0.1,
            tooltip: "Values higher than 5 will cause the animation to become unstable.",
            callback: () => {
                // Force immediate update when speed changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            }
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Color.Primary",
            name: "🎨 Primary Link Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Color.Primary"]
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Color.Secondary",
            name: "🎨 Secondary Link Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Color.Secondary"]
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Color.Accent",
            name: "🎨 Accent/Particle Color",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Color.Accent"]
        });

        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Color.Mode",
            name: "🎨 Color Mode",
            type: "combo",
            options: [
                {value: "default", text: "Default Colors"},
                {value: "custom", text: "Custom Colors"},
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Color.Mode"]
        });

        // Add marker enable/disable setting
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Enabled",
            name: "🔷 Enable Markers (Classic Flow Only)",
            type: "combo",
            options: [
                {value: true, text: "✅ Enabled"},
                {value: false, text: "❌ Disabled"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Enabled"],
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

        // Add marker shape setting
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Shape",
            name: "🔷 Marker Shape (Classic Flow Only)",
            type: "combo",
            options: [
                {value: "none", text: "❌ None"},
                {value: "diamond", text: "💠 Diamond"},
                {value: "circle", text: "⭕ Circle"},
                {value: "arrow", text: "➡️ Arrow"},
                {value: "square", text: "⬛ Square"},
                {value: "triangle", text: "🔺 Triangle"},
                {value: "star", text: "⭐ Star"},
                {value: "heart", text: "💗 Heart"},
                {value: "cross", text: "✝️ Cross"},
                {value: "hexagon", text: "⬡ Hexagon"},
                {value: "flower", text: "🌸 Flower"},
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Shape"],
            callback: () => {
                // Force immediate update when shape changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            }
        });

        // Add marker size setting
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Size",
            name: "📏 Marker Size (Classic Flow Only)",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Size"],  // Changed from default to defaultValue
            min: 0.5,
            max: 5,
            step: 0.1,
            callback: () => {
                // Force immediate update when size changes
                State.forceUpdate = true;
                State.forceRedraw = true;
                if (app.graph && app.graph.canvas) {
                    app.graph.canvas.dirty_canvas = true;
                    app.graph.canvas.dirty_bgcanvas = true;
                    app.graph.canvas.draw(true, true);
                }
            }
        });

        // Add marker color mode setting
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Color.Mode",
            name: "🎨 Marker Color Mode (Classic Flow Only)",
            type: "combo",
            options: [
                {value: "inherit", text: "🔗 Inherit from Link"},
                {value: "custom", text: "🎨 Custom Color"},
                {value: "default", text: "⭐ Default Colors"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Color.Mode"],
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

        // Add marker custom color setting
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Color",
            name: "🎨 Marker Color (Classic Flow Only)",
            type: "color",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Color"]
        });

        // Add marker glow intensity setting
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Glow",
            name: "✨ Marker Glow (Classic Flow Only)",
            type: "slider",
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Glow"],  // Changed from default to defaultValue
            min: 0,
            max: 30,
            step: 1,
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

        // Add marker effects setting
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Effects",
            name: "✨ Marker Effects (Classic Flow Only)",
            type: "combo",
            options: [
                {value: "none", text: "❌ None"},
                {value: "pulse", text: "💓 Pulse"},
                {value: "fade", text: "🌟 Fade"},
                {value: "rainbow", text: "🌈 Rainbow"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Effects"],
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

        // Add drop shadow settings for links
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Link.Shadow.Enabled",
            name: "🌑 Enable Link Shadows (Classic Flow Only)",
            type: "combo",
            options: [
                {value: false, text: "❌ Disabled"},
                {value: true, text: "✅ Enabled"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Link.Shadow.Enabled"],
            tooltip: "Adds drop shadows to link lines.",
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

        // Add drop shadow settings for markers
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.Marker.Shadow.Enabled",
            name: "🌑 Enable Marker Shadows (Classic Flow Only)",
            type: "combo",
            options: [
                {value: false, text: "❌ Disabled"},
                {value: true, text: "✅ Enabled"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.Marker.Shadow.Enabled"],
            tooltip: "Adds drop shadows to markers.",
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

        // UI & Æmotion Studio About
        app.ui.settings.addSetting({
            id: "🔗 Enhanced Links.UI & Æmotion Studio About",
            name: "🔽 Info Panel",
            type: "combo",
            options: [
                {value: 0, text: "Closed Panel"},
                {value: 1, text: "Open Panel"}
            ],
            defaultValue: DEFAULT_SETTINGS["🔗 Enhanced Links.UI & Æmotion Studio About"],
            onChange: (value) => {
                if (value === 1) {
                    document.body.appendChild(createPatternDesignerWindow());
                    setTimeout(() => app.ui.settings.setSettingValue("🔗 Enhanced Links.UI & Æmotion Studio About", 0), 100);
                }
            }
        });

        // 🛠️ Optimized Rendering Utilities
        const RenderUtils = {
            createFlowField(t, phase) {
                return {
                    x: Math.sin(t * Math.PI * SACRED.TRINITY + phase) * 10,
                    y: Math.cos(t * Math.PI * SACRED.TRINITY + phase) * 10
                };
            },

            createCrystal(ctx, x, y, size, rotation, color) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.beginPath();
                
                for (let i = 0; i < SACRED.HARMONY; i++) {
                    const angle = (i / SACRED.HARMONY) * Math.PI * 2;
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
                for (let i = 0; i <= SACRED.TRINITY; i++) {
                    const angle = (i / SACRED.TRINITY) * Math.PI * 2;
                    const px = Math.cos(angle) * size;
                    const py = Math.sin(angle) * size;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.strokeStyle = color;
                ctx.stroke();
                
                // Second tetrahedron
                ctx.rotate(Math.PI / SACRED.TRINITY);
                ctx.beginPath();
                for (let i = 0; i <= SACRED.TRINITY; i++) {
                    const angle = (i / SACRED.TRINITY) * Math.PI * 2;
                    const px = Math.cos(angle) * size;
                    const py = Math.sin(angle) * size;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.restore();
            },

            calculateCurvePoints(start, end, quality, style = "smooth") {
                const points = [];
                const steps = quality * 3;
                
                const dx = end[0] - start[0];
                const dy = end[1] - start[1];
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                switch(style) {
                    case "none":
                        // No curve - just a straight line from start to end
                        points.push([start[0], start[1]]);
                        points.push([end[0], end[1]]);
                        break;
                        
                    case "direct":
                        // Direct style - perfectly straight line with interpolated points
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const x = start[0] + dx * t;
                            const y = start[1] + dy * t;
                            points.push([x, y]);
                        }
                        break;
                        
                    case "wave":
                        // Wave style - much more pronounced sine wave pattern
                        const waveAmplitude = dist * 0.35; // Increased from 0.2 to 0.35
                        const waveFrequency = 4; // Increased from 3 to 4 waves
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const x = start[0] + dx * t;
                            const y = start[1] + dy * t + 
                                     Math.sin(t * Math.PI * waveFrequency) * waveAmplitude;
                            points.push([x, y]);
                        }
                        break;
                        
                    case "spiral":
                        // Spiral style - more dramatic spiral effect
                        const maxRadius = dist * 0.4; // Increased from 0.25 to 0.4
                        const spiralTurns = 8; // Increased from 6 to 8 turns
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const radius = (1 - t) * maxRadius;
                            const angle = t * Math.PI * spiralTurns;
                            const x = start[0] + dx * t + Math.cos(angle) * radius;
                            const y = start[1] + dy * t + Math.sin(angle) * radius;
                            points.push([x, y]);
                        }
                        break;
                        
                    case "smooth":
                    default:
                        // Smooth style - more dramatic curves
                        const controlPointDist = dist * 1.2; // Increased from 0.8 to 1.2
                        const perpX = -dy * 0.5; // Increased from 0.3 to 0.5
                        const perpY = dx * 0.5;  // Increased from 0.3 to 0.5
                        
                        const cp1x = start[0] + dx * 0.25 + perpX;
                        const cp1y = start[1] + dy * 0.25 + perpY;
                        const cp2x = start[0] + dx * 0.75 - perpX;
                        const cp2y = start[1] + dy * 0.75 - perpY;
                        
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const mt = 1 - t;
                            const x = mt * mt * mt * start[0] + 
                                     3 * mt * mt * t * cp1x +
                                     3 * mt * t * t * cp2x +
                                     t * t * t * end[0];
                            const y = mt * mt * mt * start[1] + 
                                     3 * mt * mt * t * cp1y +
                                     3 * mt * t * t * cp2y +
                                     t * t * t * end[1];
                            points.push([x, y]);
                        }
                }
                
                return points;
            },

            enableAntiAliasing(ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.miterLimit = 2;
            }
        };

        // 🎨 Color Management Utility
        const ColorManager = {
            validateHexColor(color) {
                // Check if it's a valid hex color
                if (!color || typeof color !== 'string') return null;
                // Add # if missing
                if (color[0] !== '#') color = '#' + color;
                // Validate hex format
                if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return null;
                return color;
            },

            enhanceColor(color, scheme) {
                if (!color || scheme === "default") return color;
                
                // Validate hex color
                const validColor = this.validateHexColor(color);
                if (!validColor) return color;
                
                // Convert hex to HSL for easier manipulation
                const hex2Hsl = (hex) => {
                    try {
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
                    } catch (error) {
                        console.error("Error converting hex to HSL:", error);
                        return [0, 0, 50]; // Default to gray if conversion fails
                    }
                };

                // Convert HSL back to hex
                const hsl2Hex = (h, s, l) => {
                    try {
                        l /= 100;
                        const a = s * Math.min(l, 1 - l) / 100;
                        const f = n => {
                            const k = (n + h / 30) % 12;
                            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                            return Math.round(255 * color).toString(16).padStart(2, '0');
                        };
                        return `#${f(0)}${f(8)}${f(4)}`;
                    } catch (error) {
                        console.error("Error converting HSL to hex:", error);
                        return validColor; // Return original color if conversion fails
                    }
                };

                // Get HSL values
                const [h, s, l] = hex2Hsl(validColor);

                // Apply enhancements based on scheme
                try {
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
                } catch (error) {
                    console.error("Error applying color enhancement:", error);
                    return validColor;
                }
            },

            getCustomColors() {
                const colorMode = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Mode", "default");
                const colorScheme = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Scheme", "default");
                
                if (colorMode === "off") {
                    return null;
                }
                
                if (colorMode === "custom") {
                    const primary = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Primary", "#ffffff");
                    const secondary = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Secondary", "#ff6600");
                    const accent = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Accent", "#ff8800");

                    // Validate and enhance colors
                    const validatedPrimary = this.validateHexColor(primary) || "#ffffff";
                    const validatedSecondary = this.validateHexColor(secondary) || "#ff6600";
                    const validatedAccent = this.validateHexColor(accent) || "#ff8800";

                    return {
                        primary: this.enhanceColor(validatedPrimary, colorScheme),
                        secondary: this.enhanceColor(validatedSecondary, colorScheme),
                        accent: this.enhanceColor(validatedAccent, colorScheme)
                    };
                }
                
                return null;
            },
            
            getLinkColor(defaultColor) {
                const colors = this.getCustomColors();
                const colorScheme = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Scheme", "default");
                return colors ? colors.primary : this.enhanceColor(defaultColor, colorScheme);
            },
            
            getSecondaryColor(defaultColor) {
                const colors = this.getCustomColors();
                const colorScheme = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Scheme", "default");
                return colors ? colors.secondary : this.enhanceColor(defaultColor, colorScheme);
            },
            
            getAccentColor(defaultColor) {
                const colors = this.getCustomColors();
                const colorScheme = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Scheme", "default");
                return colors ? colors.accent : this.enhanceColor(defaultColor, colorScheme);
            }
        };

        // 🎮 Monitor execution status
        api.addEventListener("status", ({detail}) => {
            State.isRunning = detail?.exec_info?.queue_remaining > 0;
            app.graph.setDirtyCanvas(true, true);
        });

        // 🎨 Link Transition Manager for Static Mode
        const LinkTransitionManager = {
            transitionSpeed: 0.15,
            elasticity: 0.3,
            damping: 0.8,
            velocities: new Map(),
            
            getVelocity(linkId) {
                if (!this.velocities.has(linkId)) {
                    this.velocities.set(linkId, { x: 0, y: 0 });
                }
                return this.velocities.get(linkId);
            },
            
            updateLinkPosition(linkId, start, end, currentPos) {
                if (!State.linkPositions.has(linkId)) {
                    State.linkPositions.set(linkId, {
                        current: { x: start[0], y: start[1] },
                        target: { x: start[0], y: start[1] }
                    });
                }
                
                const pos = State.linkPositions.get(linkId);
                const vel = this.getVelocity(linkId);
                
                // Calculate spring forces
                const dx = end[0] - start[0];
                const dy = end[1] - start[1];
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Add some natural curve/sag to the links
                const sag = Math.min(dist * 0.1, 20);
                const midX = start[0] + dx * 0.5;
                const midY = start[1] + dy * 0.5 + sag;
                
                // Calculate forces
                const targetX = midX;
                const targetY = midY;
                
                const forceX = (targetX - pos.current.x) * this.elasticity;
                const forceY = (targetY - pos.current.y) * this.elasticity;
                
                // Update velocity with spring physics
                vel.x = (vel.x + forceX) * this.damping;
                vel.y = (vel.y + forceY) * this.damping;
                
                // Update position
                pos.current.x += vel.x;
                pos.current.y += vel.y;
                
                // Store target position
                pos.target.x = targetX;
                pos.target.y = targetY;
                
                return pos.current;
            },
            
            reset(linkId) {
                this.velocities.delete(linkId);
                State.linkPositions.delete(linkId);
            }
        };

        // 🎨 Static Mode Renderers
        const StaticRenderers = {
            // Sacred Flow Static Style
            1: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const accentColor = ColorManager.getAccentColor(defaultColor);
                        
                        // Draw base link
                        if (linkStyle !== 'hidden') {
                            ctx.strokeStyle = primaryColor;
                            ctx.lineWidth = thickness * 1.5;
                            ctx.shadowColor = primaryColor;
                            ctx.shadowBlur = glowIntensity;
                            LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, true);
                        }
                        
                        // Add flow points with consistent properties for hidden links
                        const points = Math.floor(SACRED.TRINITY * quality);
                        for (let i = 0; i <= points; i++) {
                            const t = i / points;
                            const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                            const flow = RenderUtils.createFlowField(t, phase);
                            
                            const x = pos[0] + flow.x * Math.sin(t * Math.PI + phase) * 0.3;
                            const y = pos[1] + flow.y * Math.sin(t * Math.PI + phase) * 0.3;
                            
                            ctx.beginPath();
                            ctx.arc(x, y, thickness * 0.8, 0, Math.PI * 2);
                            ctx.fillStyle = accentColor;
                            // Adjust glow for hidden links
                            ctx.shadowColor = linkStyle === 'hidden' ? accentColor : primaryColor;
                            ctx.shadowBlur = linkStyle === 'hidden' ? glowIntensity * 0.7 : glowIntensity;
                            ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
                            ctx.fill();
                        }
                        ctx.globalAlpha = 1;
                    });
                }
            },
            // Crystal Stream Static Style
            2: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                        
                        // Draw base link
                        if (linkStyle !== 'hidden') {
                            LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, true);
                        }
                        
                        // Add static crystals
                        const crystals = Math.floor(SACRED.HARMONY * quality);
                        for (let i = 0; i < crystals; i++) {
                            const t = i / crystals;
                            const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                            const size = thickness * 3 * (1 + Math.sin(phase + t * Math.PI * 2) * 0.2);
                            
                            ctx.shadowColor = secondaryColor;
                            ctx.shadowBlur = glowIntensity;
                            RenderUtils.createCrystal(ctx, pos[0], pos[1], size, t * Math.PI * 2 + phase * 0.2, primaryColor);
                        }
                    });
                }
            },
            // Quantum Field Static Style
            3: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                        const accentColor = ColorManager.getAccentColor(defaultColor);
                        
                        // Draw base link
                        if (linkStyle !== 'hidden') {
                            ctx.strokeStyle = primaryColor;
                            ctx.lineWidth = thickness;
                            ctx.globalAlpha = 0.3;
                            LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, true);
                            ctx.globalAlpha = 1;
                        }
                        
                        // Draw quantum field lines
                        const fieldLines = SACRED.QUANTUM;
                        const points = Math.floor(SACRED.COMPLETION * quality);
                        
                        for (let f = 0; f < fieldLines; f++) {
                            ctx.beginPath();
                            const fieldPhase = phase + (f * Math.PI * 2) / fieldLines;
                            
                            for (let i = 0; i <= points; i++) {
                                const t = i / points;
                                const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                                const uncertainty = 8 * Math.sin(t * Math.PI * 2 + fieldPhase);
                                
                                const x = pos[0] + uncertainty * Math.cos(fieldPhase);
                                const y = pos[1] + uncertainty * Math.sin(fieldPhase);
                                
                                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                            }
                            
                            ctx.strokeStyle = f % 2 === 0 ? primaryColor : secondaryColor;
                            ctx.lineWidth = thickness * 0.5;
                            ctx.shadowColor = f % 2 === 0 ? primaryColor : secondaryColor;
                            ctx.shadowBlur = glowIntensity;
                            ctx.globalAlpha = 0.3;
                            ctx.stroke();
                        }
                        ctx.globalAlpha = 1;
                    });
                }
            },
            // Cosmic Weave Static Style
            4: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    const direction = AnimationState.direction;
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                        const accentColor = ColorManager.getAccentColor(defaultColor);
                        
                        // Draw the base link using the selected style but completely transparent
                        if (linkStyle !== 'hidden') {
                            ctx.strokeStyle = primaryColor;
                            ctx.lineWidth = thickness;
                            ctx.globalAlpha = 0;
                            LinkRenderers[linkStyle].draw(ctx, end, start, primaryColor, thickness, true);
                            ctx.globalAlpha = 1;
                        }
                        
                        const strands = SACRED.TRINITY;
                        const points = Math.floor(SACRED.COMPLETION * quality);
                        
                        for (let s = 0; s < strands; s++) {
                            ctx.beginPath();
                            const strandPhase = phase + (s * Math.PI * 2) / strands;
                            
                            for (let i = 0; i <= points; i++) {
                                // Reverse the t value when in reverse direction
                                const t = direction > 0 ? i / points : 1 - (i / points);
                                const pos = LinkRenderers[linkStyle].getPoint(end, start, t, true);
                                const weave = Math.sin(t * Math.PI * 6 + strandPhase * direction) * 10;
                                
                                const x = pos[0] + weave * Math.cos(strandPhase);
                                const y = pos[1] + weave * Math.sin(strandPhase);
                                
                                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                            }
                            
                            // Cycle through all three colors
                            let strandColor;
                            switch(s % 3) {
                                case 0:
                                    strandColor = primaryColor;
                                    break;
                                case 1:
                                    strandColor = secondaryColor;
                                    break;
                                case 2:
                                    strandColor = accentColor;
                                    break;
                            }
                            
                            ctx.strokeStyle = strandColor;
                            ctx.lineWidth = thickness * 0.7;
                            ctx.shadowColor = strandColor;
                            ctx.shadowBlur = glowIntensity;
                            ctx.globalAlpha = 0.5;
                            ctx.stroke();
                        }
                        ctx.globalAlpha = 1;
                    });
                }
            },
            // Energy Pulse Static Style
            5: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                        
                        // Draw base link
                        if (linkStyle !== 'hidden') {
                            ctx.strokeStyle = primaryColor;
                            ctx.lineWidth = thickness;
                            ctx.globalAlpha = 0.3;
                            LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, true);
                            ctx.globalAlpha = 1;
                        }
                        
                        // Draw static energy pulses
                        const pulseCount = Math.floor(SACRED.TRINITY * quality);
                        for (let i = 0; i < pulseCount; i++) {
                            const t = i / pulseCount;
                            const pulseSize = thickness * 2 * (1 + Math.sin(phase + t * Math.PI * 2) * 0.3);
                            const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                            
                            ctx.beginPath();
                            ctx.arc(pos[0], pos[1], pulseSize, 0, Math.PI * 2);
                            ctx.fillStyle = secondaryColor;
                            ctx.shadowColor = secondaryColor;
                            ctx.shadowBlur = glowIntensity * 2;
                            ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
                            ctx.fill();
                        }
                        ctx.globalAlpha = 1;
                    });
                }
            },
            // DNA Helix Static Style
            6: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                        const accentColor = ColorManager.getAccentColor(defaultColor);
                        
                        const points = Math.floor(SACRED.COMPLETION * quality * 2);
                        const helixRadius = 10;
                        const rotations = 4;

                        // Draw both strands
                        for (let strand = 0; strand < 2; strand++) {
                            ctx.beginPath();
                            for (let i = 0; i <= points; i++) {
                                const t = i / points;
                                const baseAngle = t * Math.PI * rotations * 2 + phase;
                                const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                                
                                const helixX = Math.cos(baseAngle) * helixRadius * (strand === 0 ? 1 : -1);
                                const helixY = Math.sin(baseAngle) * helixRadius * (strand === 0 ? 1 : -1);
                                
                                const x = pos[0] + helixX;
                                const y = pos[1] + helixY;
                                
                                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                            }
                            
                            ctx.strokeStyle = strand === 0 ? primaryColor : secondaryColor;
                            ctx.lineWidth = thickness * 1.2;
                            ctx.shadowColor = strand === 0 ? primaryColor : secondaryColor;
                            ctx.shadowBlur = glowIntensity;
                            ctx.stroke();
                        }
                        
                        // Draw connecting bonds
                        const bonds = rotations * 4;
                        ctx.strokeStyle = accentColor;
                        ctx.shadowColor = accentColor;
                        ctx.shadowBlur = glowIntensity * 0.5;
                        ctx.lineWidth = thickness * 0.8;
                        ctx.globalAlpha = 0.8;
                        
                        for (let b = 0; b <= bonds; b++) {
                            const t = b / bonds;
                            const baseAngle = t * Math.PI * rotations * 2 + phase;
                            const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                            
                            const x1 = pos[0] + Math.cos(baseAngle) * helixRadius;
                            const y1 = pos[1] + Math.sin(baseAngle) * helixRadius;
                            const x2 = pos[0] - Math.cos(baseAngle) * helixRadius;
                            const y2 = pos[1] - Math.sin(baseAngle) * helixRadius;
                            
                            ctx.beginPath();
                            ctx.moveTo(x1, y1);
                            ctx.lineTo(x2, y2);
                            ctx.stroke();
                        }
                        ctx.globalAlpha = 1;
                    });
                }
            },
            // Lava Flow Static Style
            7: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                        const accentColor = ColorManager.getAccentColor(defaultColor);
                        
                        const tubeWidth = thickness * 7;
                        const flowWidth = thickness * 5;
                        const turbulenceScale = 15;
                        const points = Math.floor(SACRED.TRINITY * quality * 12);
                        
                        // Draw outer tube
                        ctx.beginPath();
                        for (let i = 0; i <= points; i++) {
                            const t = i / points;
                            const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                            const noise = Math.sin(t * Math.PI * 3 + phase) * turbulenceScale;
                            
                            const x = pos[0];
                            const y = pos[1] + noise * Math.sin(phase * 0.8 + t * Math.PI * 2);
                            
                            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                        }
                        
                        ctx.strokeStyle = secondaryColor;
                        ctx.globalAlpha = 0;
                        ctx.lineWidth = tubeWidth;
                        ctx.lineCap = 'round';
                        ctx.stroke();
                        
                        // Draw lava flow
                        ctx.beginPath();
                        for (let i = 0; i <= points; i++) {
                            const t = i / points;
                            const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                            const noise = Math.sin(t * Math.PI * 3 + phase * 1.2) * (turbulenceScale * 0.7);
                            
                            const x = pos[0];
                            const y = pos[1] + noise * Math.sin(phase * 0.6 + t * Math.PI * 2);
                            
                            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                        }
                        
                        const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
                        gradient.addColorStop(0, primaryColor);
                        gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondaryColor);
                        gradient.addColorStop(1, accentColor);
                        
                        ctx.globalAlpha = 1;
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = flowWidth;
                        ctx.lineCap = 'round';
                        ctx.shadowColor = secondaryColor;
                        ctx.shadowBlur = glowIntensity * 1.5;
                        ctx.stroke();
                    });
                }
            },
            // Stellar Plasma Static Style
            8: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        const primaryColor = ColorManager.getLinkColor(defaultColor);
                        const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                        const accentColor = ColorManager.getAccentColor(defaultColor);
                        
                        // Draw base link with reduced opacity
                        if (linkStyle !== 'hidden') {
                            ctx.strokeStyle = primaryColor;
                            ctx.lineWidth = thickness;
                            ctx.globalAlpha = 0.3;
                            LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, true);
                            ctx.globalAlpha = 1;
                        }
                        
                        // Calculate optimal segment count based on link length
                        const length = LinkRenderers[linkStyle].getLength(start, end);
                        const maxSegments = Math.min(Math.floor(length / 30), 20); // Cap maximum segments
                        const segments = Math.max(5, Math.floor(maxSegments * quality * 0.5)); // Ensure minimum segments
                        
                        // Pre-calculate wave parameters
                        const waveAmplitude = 8;
                        const phaseOffset = phase * 0.5;
                        
                        // Draw plasma core with optimized rendering
                        for(let i = 0; i <= segments; i++) {
                            const t = i / segments;
                            const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                            
                            // Simplified wave calculation
                            const wave = Math.sin(t * Math.PI * 2 + phaseOffset) * waveAmplitude;
                            const size = thickness * (0.8 + Math.sin(phase + t * Math.PI) * 0.2);
                            
                            // Draw main plasma core
                            ctx.beginPath();
                            ctx.arc(pos[0], pos[1] + wave, size, 0, Math.PI * 2);
                            ctx.fillStyle = t < 0.5 ? primaryColor : secondaryColor;
                            ctx.shadowColor = t < 0.5 ? primaryColor : secondaryColor;
                            ctx.shadowBlur = glowIntensity;
                            ctx.globalAlpha = 0.6;
                            ctx.fill();
                            
                            // Add sparse particle effects
                            if (i % 3 === 0 && quality > 1) {  // Only add particles for higher quality settings
                                const particleSize = size * 0.4;
                                ctx.beginPath();
                                ctx.arc(pos[0], pos[1] + wave * 1.2, particleSize, 0, Math.PI * 2);
                                ctx.fillStyle = accentColor;
                                ctx.shadowColor = accentColor;
                                ctx.shadowBlur = glowIntensity * 0.5;
                                ctx.globalAlpha = 0.4;
                                ctx.fill();
                            }
                        }
                        ctx.globalAlpha = 1;
                    });
                }
            },
            // Classic Flow Static Style
            9: {
                render: function(ctx, items, phase) {
                    const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
                    const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
                    const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                    const markerEnabled = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Enabled", true);
                    const markerShape = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Shape", "diamond");
                    const markerSize = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Size", 1.5);
                    const markerColorMode = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Color.Mode", "inherit");
                    const markerColor = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Color", "#ffffff");
                    const markerGlow = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Glow", 10);
                    const markerEffect = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Effects", "none");
                    const colorScheme = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Scheme", "default");
                    const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
                    const linkShadowEnabled = app.ui.settings.getSettingValue("🔗 Enhanced Links.Link.Shadow.Enabled", false);
                    const markerShadowEnabled = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Shadow.Enabled", false);
                    const shadowBlur = app.ui.settings.getSettingValue("🔗 Enhanced Links.Shadow.Blur", 5);
                    const shadowOffset = app.ui.settings.getSettingValue("🔗 Enhanced Links.Shadow.Offset", 3);
                    
                    items.forEach(({start, end, color, defaultColor, linkStyle}) => {
                        // Apply color enhancement to primary color
                        const primaryColor = ColorManager.enhanceColor(
                            ColorManager.getLinkColor(defaultColor),
                            colorScheme
                        );
                        
                        // Draw the base link using the selected style
                        if (linkStyle !== 'hidden') {
                            // Get the appropriate color based on color mode and apply enhancement
                            const linkColor = ColorManager.getCustomColors() ? 
                                ColorManager.getLinkColor(defaultColor) : defaultColor;
                            
                            const enhancedColor = ColorManager.enhanceColor(linkColor, colorScheme);
                            ctx.lineWidth = thickness;
                            
                            // Draw shadow first if enabled
                            if (linkShadowEnabled) {
                                ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                                ctx.shadowBlur = shadowBlur * 4;
                                ctx.shadowOffsetX = shadowOffset * 3;
                                ctx.shadowOffsetY = shadowOffset * 3;
                                ctx.lineWidth = thickness * 1.2;
                                LinkRenderers[linkStyle].draw(ctx, start, end, 'rgba(0, 0, 0, 0.95)', thickness * 1.2, true);
                            }
                            
                            // Draw the actual link with glow
                            ctx.shadowColor = enhancedColor;
                            ctx.shadowBlur = glowIntensity;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                            ctx.strokeStyle = enhancedColor;
                            ctx.lineWidth = thickness;
                            
                            // Draw the actual link
                            LinkRenderers[linkStyle].draw(ctx, start, end, enhancedColor, thickness, true);
                        }

                        // Draw markers if enabled
                        if (markerEnabled && markerShape !== 'none') {
                            // Set marker color based on mode and apply enhancement
                            let effectiveMarkerColor;
                            if (markerColorMode === "custom") {
                                effectiveMarkerColor = ColorManager.enhanceColor(
                                    ColorManager.validateHexColor(markerColor) || primaryColor,
                                    colorScheme
                                );
                            } else if (markerColorMode === "default") {
                                effectiveMarkerColor = ColorManager.enhanceColor(defaultColor, colorScheme);
                            } else {
                                effectiveMarkerColor = primaryColor; // Already enhanced above
                            }

                            // Draw traveling midpoint marks
                            const numMarks = Math.floor(SACRED.TRINITY * quality * markerSize * particleDensity * 0.5);
                            const markSize = 3 * markerSize;
                            
                            // Apply marker effects
                            for (let i = 0; i < numMarks; i++) {
                                const baseT = i / numMarks;
                                const t = baseT;
                                
                                const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                                
                                // Calculate angle for directional markers like arrows
                                let angle = 0;
                                if (markerShape === 'arrow') {
                                    const nextT = Math.min(t + 0.01, 1);
                                    const nextPos = LinkRenderers[linkStyle].getPoint(start, end, nextT, true);
                                    angle = Math.atan2(nextPos[1] - pos[1], nextPos[0] - pos[0]);
                                }
                                
                                // Apply effects to marker color and opacity
                                let effectColor = effectiveMarkerColor;
                                let opacity = 1;
                                
                                // Apply marker effects regardless of shadow mode
                                switch(markerEffect) {
                                    case "pulse":
                                        opacity = 0.5 + Math.sin(phase + t * Math.PI * 2) * 0.5;
                                        break;
                                    case "fade":
                                        opacity = 1 - t;
                                        break;
                                    case "rainbow":
                                        const hue = ((t * 360) + (phase * 50)) % 360;
                                        effectColor = ColorManager.enhanceColor(
                                            `hsl(${hue}, 100%, 50%)`,
                                            colorScheme
                                        );
                                        break;
                                }
                                
                                // Draw the marker with effects
                                if (MarkerShapes[markerShape]) {
                                    // Draw shadow first if enabled
                                    if (markerShadowEnabled) {
                                        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
                                        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                                        ctx.shadowBlur = shadowBlur * 4;
                                        ctx.shadowOffsetX = shadowOffset * 3;
                                        ctx.shadowOffsetY = shadowOffset * 3;
                                        ctx.globalAlpha = opacity;
                                        MarkerShapes[markerShape](ctx, pos[0], pos[1], markSize * 1.2, angle);
                                        if (markerShape !== 'cross') {
                                            ctx.fill();
                                        }
                                    }

                                    // Draw the actual marker with glow
                                    ctx.shadowColor = markerEffect === "rainbow" ? primaryColor : effectColor;
                                    ctx.shadowBlur = markerGlow;
                                    ctx.shadowOffsetX = 0;
                                    ctx.shadowOffsetY = 0;
                                    
                                    // Set both fill and stroke styles for cross shape
                                    if (markerShape === 'cross') {
                                        ctx.strokeStyle = effectColor;
                                    }
                                    ctx.fillStyle = effectColor;
                                    
                                    ctx.globalAlpha = opacity;
                                    MarkerShapes[markerShape](ctx, pos[0], pos[1], markSize, angle);
                                    if (markerShape !== 'cross') {
                                        ctx.fill();
                                    }
                                }
                            }
                        }
                        ctx.globalAlpha = 1;
                    });
                }
            }
        };

        // 🎨 Enhanced link rendering system
        const origDrawConnections = LGraphCanvas.prototype.drawConnections;
        
        LGraphCanvas.prototype.drawConnections = function(ctx) {
            try {
                ctx.save();
                RenderUtils.enableAntiAliasing(ctx);  // Add this line
                const animStyle = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animate", 4);
                const linkStyle = app.ui.settings.getSettingValue("🔗 Enhanced Links.Link.Style", "spline");
                const shouldPauseDuringRender = app.ui.settings.getSettingValue("🔗 Enhanced Links.Pause.During.Render", true);
                const isStaticMode = app.ui.settings.getSettingValue("🔗 Enhanced Links.Static.Mode", false);
                const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
                const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
                
                if (animStyle === 0) {
                    origDrawConnections.call(this, ctx);
                    return;
                }

                // Force static mode when paused during render
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;

                // Check if any relevant settings have changed
                const currentSettings = `${animStyle}-${linkStyle}-${quality}-${particleDensity}`;
                if (State.lastSettings !== currentSettings || State.forceRedraw) {
                    State.forceUpdate = true;
                    State.lastSettings = currentSettings;
                    State.lastAnimStyle = animStyle;
                    State.lastLinkStyle = linkStyle;
                    State.forceRedraw = false;
                }

                const delta = TimingManager.update();
                
                // Update phase based on mode and force update flag
                let phase;
                if (effectiveStaticMode) {
                    if (State.forceUpdate || State.lastAnimStyle !== animStyle) {
                        // Reset static phase and force update when style changes
                        State.staticPhase = (State.staticPhase + Math.PI * 2) % (Math.PI * 4); // Rotate phase with modulo
                        State.forceUpdate = false;
                        State.lastAnimStyle = animStyle;
                        
                        // Force immediate canvas update
                        if (app.graph && app.graph.canvas) {
                            app.graph.canvas.dirty_canvas = true;
                            app.graph.canvas.dirty_bgcanvas = true;
                            requestAnimationFrame(() => {
                                app.graph.canvas.draw(true, true);
                            });
                        }
                    }
                    phase = State.staticPhase;
                } else {
                    phase = AnimationState.update(delta);
                    State.totalTime += delta;
                }

                State.activeParticles.clear();
                
                // Batch similar rendering operations
                const renderQueue = new Map();
                
                for (const linkId in this.graph.links) {
                    const linkData = this.graph.links[linkId];
                    if (!linkData) continue;

                    const originNode = this.graph._nodes_by_id[linkData.origin_id];
                    const targetNode = this.graph._nodes_by_id[linkData.target_id];
                    
                    if (!originNode || !targetNode || originNode.flags.collapsed || targetNode.flags.collapsed) continue;

                    const startPos = new Float32Array(2);
                    const endPos = new Float32Array(2);

                    originNode.getConnectionPos(false, linkData.origin_slot, startPos);
                    targetNode.getConnectionPos(true, linkData.target_slot, endPos);

                    const defaultColor = linkData.type ? 
                        LGraphCanvas.link_type_colors[linkData.type] : 
                        this.default_connection_color;

                    if (!renderQueue.has(animStyle)) {
                        renderQueue.set(animStyle, []);
                    }
                    renderQueue.get(animStyle).push({
                        start: startPos,
                        end: endPos,
                        color: defaultColor,
                        defaultColor: defaultColor,
                        linkId: linkId,
                        linkStyle: linkStyle,
                        isStatic: effectiveStaticMode
                    });
                }

                // Process render queue with updated phase
                if (effectiveStaticMode && StaticRenderers[animStyle]) {
                    StaticRenderers[animStyle].render(ctx, renderQueue.get(animStyle), phase);
                } else {
                    renderQueue.forEach((items, style) => {
                        this.renderAnimationStyle(ctx, items, style, phase, effectiveStaticMode);
                    });
                }

                ctx.restore();
                
                // Always request next frame to handle style changes
                app.graph.setDirtyCanvas(true, true);
                
            } catch (error) {
                console.error("Error in drawConnections:", error);
                origDrawConnections.call(this, ctx);
            }
        };

        // Add helper method to handle animation style rendering
        LGraphCanvas.prototype.renderAnimationStyle = function(ctx, items, style, phase, isStatic) {
            switch(parseInt(style)) {
                case 9:  // Add Classic Flow case
                    this.renderClassicFlow(ctx, items, phase);
                    break;
                case 1:
                    this.renderSacredFlow(ctx, items, phase);
                    break;
                case 2:
                    this.renderCrystalStream(ctx, items, phase);
                    break;
                case 3:
                    this.renderQuantumField(ctx, items, phase);
                    break;
                case 4:
                    this.renderCosmicWeave(ctx, items, phase);
                    break;
                case 5:
                    this.renderEnergyPulse(ctx, items, phase);
                    break;
                case 6:
                    this.renderDNAHelix(ctx, items, phase);
                    break;
                case 7:
                    this.renderLavaFlow(ctx, items, phase);
                    break;
                case 8:
                    this.renderStellarPlasma(ctx, items, phase);
                    break;
            }
        };

        // ✨ Sacred Flow Pattern
        LGraphCanvas.prototype.renderSacredFlow = function(ctx, items, phase) {
            const direction = AnimationState.direction;
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const colorScheme = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Scheme", "default");
            const totalTime = State.totalTime || 0;
            // Add speed reduction factor to slow down the animation
            const speedReductionFactor = 0.25; // This will make the base speed 4x slower
            const continuousPhase = totalTime * animSpeed * speedReductionFactor;
            
            // Pre-calculate global glow settings
            ctx.shadowBlur = glowIntensity;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                // Get the base color from either custom colors or default
                const baseColor = ColorManager.getCustomColors() ? 
                    ColorManager.getLinkColor(defaultColor) : defaultColor;
                
                // Apply consistent color enhancement
                const primaryColor = ColorManager.enhanceColor(baseColor, colorScheme);
                const accentColor = ColorManager.enhanceColor(
                    ColorManager.getAccentColor(defaultColor),
                    colorScheme
                );
                
                // Draw the main flow path with consistent settings
                ctx.beginPath();
                const points = Math.floor(SACRED.TRINITY * quality * particleDensity);
                
                for (let i = 0; i <= points; i++) {
                    const baseT = i / points;
                    const t = direction > 0 ? baseT : (1 - baseT); // Return to original direction
                    const flow = RenderUtils.createFlowField(t, continuousPhase);
                    
                    // Get base position along the path using the selected link style
                    const pos = LinkRenderers[linkStyle].getPoint(start, end, t, isStatic ? 0.3 : 0.5);
                    
                    // Apply flow field displacement with consistent amplitude
                    const x = pos[0] + flow.x * Math.sin(t * Math.PI + continuousPhase) * 0.5;
                    const y = pos[1] + flow.y * Math.sin(t * Math.PI + continuousPhase) * 0.5;
                    
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                
                // Apply consistent stroke settings
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = thickness;
                ctx.shadowColor = primaryColor;
                ctx.shadowBlur = glowIntensity;
                ctx.globalAlpha = 1;
                ctx.stroke();
                
                // Draw particles with consistent settings
                const particleCount = Math.floor(SACRED.TRINITY * quality * particleDensity);
                const particleSize = thickness * 0.75;
                
                for (let i = 0; i < particleCount; i++) {
                    const baseT = i / particleCount;
                    const t = direction > 0 ? 
                        ((baseT + continuousPhase * 0.5) % 1) : // Return to original particle flow
                        (1 - ((baseT + continuousPhase * 0.5) % 1));
                    
                    const boundedT = Math.max(0, Math.min(1, t));
                    const flow = RenderUtils.createFlowField(boundedT, continuousPhase);
                    
                    // Get base position for particle
                    const pos = LinkRenderers[linkStyle].getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
                    
                    // Apply consistent particle displacement
                    const x = pos[0] + flow.x * Math.sin(boundedT * Math.PI + continuousPhase) * 0.5;
                    const y = pos[1] + flow.y * Math.sin(boundedT * Math.PI + continuousPhase) * 0.5;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, particleSize, 0, Math.PI * 2);
                    ctx.fillStyle = accentColor;
                    ctx.shadowColor = accentColor;
                    ctx.shadowBlur = glowIntensity;
                    ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
                    ctx.fill();
                }
                
                // Reset context settings
                ctx.globalAlpha = 1;
            });
            
            // Restore context settings
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';
            ctx.shadowBlur = 0;
        };

        // 💎 Crystal Stream Pattern
        LGraphCanvas.prototype.renderCrystalStream = function(ctx, items, phase) {
            const direction = AnimationState.direction;
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const totalTime = State.totalTime || 0;
            const continuousPhase = totalTime * animSpeed;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                const primaryColor = ColorManager.getLinkColor(defaultColor);
                const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                
                // Draw the base link using the selected style
                if (linkStyle !== 'hidden') {
                    ctx.strokeStyle = primaryColor;
                    ctx.lineWidth = thickness;
                    ctx.globalAlpha = 0.3;
                    LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, isStatic);
                    ctx.globalAlpha = 1;
                }
                
                const crystals = Math.floor(SACRED.HARMONY * quality * particleDensity);
                for (let i = 0; i < crystals; i++) {
                    const baseT = i / crystals;
                    const t = direction > 0 ? 
                        ((baseT + continuousPhase) % 1) : 
                        (1 - ((baseT + continuousPhase) % 1));
                    
                    const boundedT = Math.max(0, Math.min(1, t));
                    const pos = LinkRenderers[linkStyle].getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
                    
                    const size = 5 * thickness * (1 + Math.sin(continuousPhase + boundedT * Math.PI));
                    
                    ctx.shadowColor = secondaryColor;
                    ctx.shadowBlur = glowIntensity;
                    RenderUtils.createCrystal(ctx, pos[0], pos[1], size, boundedT * Math.PI * 2 + continuousPhase, primaryColor);
                }
            });
        };

        // 🔬 Quantum Field Pattern
        LGraphCanvas.prototype.renderQuantumField = function(ctx, items, phase) {
            const direction = AnimationState.direction;
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const totalTime = State.totalTime || 0;
            const continuousPhase = totalTime * animSpeed;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                const primaryColor = ColorManager.getLinkColor(defaultColor);
                const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                const accentColor = ColorManager.getAccentColor(defaultColor);
                
                // Draw the base link using the selected style
                if (linkStyle !== 'hidden') {
                    ctx.strokeStyle = primaryColor;
                    ctx.lineWidth = thickness;
                    ctx.globalAlpha = 0.3;
                    LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, isStatic);
                    ctx.globalAlpha = 1;
                }
                
                const fieldLines = SACRED.QUANTUM;
                const points = Math.floor(SACRED.COMPLETION * quality * particleDensity);
                
                // Draw quantum field lines
                for (let f = 0; f < fieldLines; f++) {
                    ctx.beginPath();
                    const fieldPhase = phase + (f * Math.PI * 2) / fieldLines;
                    
                    for (let i = 0; i <= points; i++) {
                        const t = i / points;
                        const pos = LinkRenderers[linkStyle].getPoint(start, end, t, isStatic ? 0.3 : 0.5);
                        const uncertainty = 8 * Math.sin(t * Math.PI * 2 + fieldPhase);
                        
                        const x = pos[0] + uncertainty * Math.cos(fieldPhase);
                        const y = pos[1] + uncertainty * Math.sin(fieldPhase);
                        
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    
                    ctx.strokeStyle = f % 2 === 0 ? primaryColor : secondaryColor;
                    ctx.lineWidth = thickness * 0.5;
                    ctx.shadowColor = f % 2 === 0 ? primaryColor : secondaryColor;
                    ctx.shadowBlur = glowIntensity;
                    ctx.globalAlpha = 0.3;
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            });
        };

        // 🌠 Stellar Plasma Pattern
        LGraphCanvas.prototype.renderStellarPlasma = function(ctx, items, phase) {
            const direction = AnimationState.direction;
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const totalTime = State.totalTime || 0;
            const continuousPhase = -totalTime * animSpeed;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                const primaryColor = ColorManager.getLinkColor(defaultColor);
                const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                const accentColor = ColorManager.getAccentColor(defaultColor);
                
                // Determine actual start and end points based on direction
                const actualStart = direction > 0 ? end : start;
                const actualEnd = direction > 0 ? start : end;
                
                const length = LinkRenderers[linkStyle].getLength(start, end);
                const segments = Math.floor(length / 20) * quality * particleDensity;

                ctx.save();
                
                // Main plasma stream with directional wave motion
                for(let i = 0; i <= segments; i++) {
                    const baseT = i / segments;
                    const t = baseT; // Keep t linear since we're flipping the points instead
                    
                    // Get position based on flipped points
                    const pos = LinkRenderers[linkStyle].getPoint(
                        actualStart,
                        actualEnd,
                        t,
                        isStatic ? 0.3 : 0.5
                    );
                    
                    // Wave motion that follows the direction
                    const wavePhase = t * Math.PI * 4 - continuousPhase * direction;
                    const wave = Math.sin(wavePhase) * 15;
                    
                    // Size pulsation synchronized with direction
                    const sizePhase = t * Math.PI * 2 - continuousPhase * direction;
                    const size = thickness * (0.5 + Math.sin(sizePhase) * 0.5);
                    
                    // Plasma core with directional glow
                    ctx.beginPath();
                    ctx.arc(pos[0], pos[1] + wave, size, 0, Math.PI * 2);
                    ctx.fillStyle = t < 0.5 ? primaryColor : secondaryColor;
                    ctx.shadowColor = t < 0.5 ? primaryColor : secondaryColor;
                    ctx.shadowBlur = glowIntensity;
                    ctx.globalAlpha = 0.7 - Math.abs(t - 0.5) * 0.3;
                    ctx.fill();
                    
                    // Plasma particles with directional flow
                    if (i % 3 === 0) {  // Reduce particle density for performance
                        const particleT = ((baseT + continuousPhase * 0.5) % 1);
                        const boundedParticleT = Math.max(0, Math.min(1, particleT));
                        
                        const particlePos = LinkRenderers[linkStyle].getPoint(
                            actualStart,
                            actualEnd,
                            boundedParticleT,
                            isStatic ? 0.3 : 0.5
                        );
                        
                        // Particle wave motion synchronized with main plasma
                        const particleWavePhase = boundedParticleT * Math.PI * 4 - continuousPhase * direction;
                        const particleWave = Math.sin(particleWavePhase) * 15;
                        
                        ctx.beginPath();
                        ctx.arc(particlePos[0], particlePos[1] + particleWave, size * 0.5, 0, Math.PI * 2);
                        ctx.fillStyle = accentColor;
                        ctx.shadowColor = accentColor;
                        ctx.shadowBlur = glowIntensity * 0.5;
                        ctx.globalAlpha = 0.6 - Math.abs(boundedParticleT - 0.5) * 0.4;
                        ctx.fill();
                    }
                }
                
                ctx.restore();
                ctx.globalAlpha = 1;
            });
        };

        // 🌌 Cosmic Weave Pattern
        LGraphCanvas.prototype.renderCosmicWeave = function(ctx, items, phase) {
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const totalTime = State.totalTime || 0;
            const continuousPhase = totalTime * animSpeed;
            const direction = AnimationState.direction;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                const primaryColor = ColorManager.getLinkColor(defaultColor);
                const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                const accentColor = ColorManager.getAccentColor(defaultColor);
                
                // Draw the base link using the selected style but completely transparent
                if (linkStyle !== 'hidden') {
                    ctx.strokeStyle = primaryColor;
                    ctx.lineWidth = thickness;
                    ctx.globalAlpha = 0;
                    LinkRenderers[linkStyle].draw(ctx, end, start, primaryColor, thickness, isStatic);
                    ctx.globalAlpha = 1;
                }
                
                const strands = SACRED.TRINITY;
                const points = Math.floor(SACRED.COMPLETION * quality);
                
                for (let s = 0; s < strands; s++) {
                    ctx.beginPath();
                    const strandPhase = continuousPhase + (s * Math.PI * 2) / strands;
                    
                    for (let i = 0; i <= points; i++) {
                        // Reverse the t value when in reverse direction
                        const t = direction > 0 ? i / points : 1 - (i / points);
                        const pos = LinkRenderers[linkStyle].getPoint(end, start, t, isStatic ? 0.3 : 0.5);
                        const weave = Math.sin(t * Math.PI * 6 + strandPhase * direction) * 10;
                        
                        const x = pos[0] + weave * Math.cos(strandPhase);
                        const y = pos[1] + weave * Math.sin(strandPhase);
                        
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    
                    // Cycle through all three colors
                    let strandColor;
                    switch(s % 3) {
                        case 0:
                            strandColor = primaryColor;
                            break;
                        case 1:
                            strandColor = secondaryColor;
                            break;
                        case 2:
                            strandColor = accentColor;
                            break;
                    }
                    
                    ctx.strokeStyle = strandColor;
                    ctx.lineWidth = thickness * 0.7;
                    ctx.shadowColor = strandColor;
                    ctx.shadowBlur = glowIntensity;
                    ctx.globalAlpha = 0.5;
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            });
        };

        // ⚡ Energy Pulse Pattern
        LGraphCanvas.prototype.renderEnergyPulse = function(ctx, items, phase) {
            const direction = AnimationState.direction;
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const totalTime = State.totalTime || 0;
            // Add speed reduction factor for energy pulse
            const speedReductionFactor = 0.25; // This will make the base speed 4x slower
            const continuousPhase = totalTime * animSpeed * speedReductionFactor;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                const primaryColor = ColorManager.getLinkColor(defaultColor);
                const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                
                // Draw base connection using the selected style
                if (linkStyle !== 'hidden') {
                    ctx.strokeStyle = primaryColor;
                    ctx.lineWidth = thickness;
                    ctx.globalAlpha = 0.3;
                    LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, isStatic);
                    ctx.globalAlpha = 1;
                }
                
                // Draw energy pulses
                const pulseCount = Math.floor(SACRED.TRINITY * quality);
                for (let i = 0; i < pulseCount; i++) {
                    const baseT = i / pulseCount;
                    const t = direction > 0 ? 
                        ((baseT + continuousPhase) % 1) : 
                        (1 - ((baseT + continuousPhase) % 1));
                    
                    const boundedT = Math.max(0, Math.min(1, t));
                    const pulseSize = thickness * 2 * (1 - boundedT);
                    
                    const pos = LinkRenderers[linkStyle].getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
                    
                    ctx.beginPath();
                    ctx.arc(pos[0], pos[1], pulseSize, 0, Math.PI * 2);
                    ctx.fillStyle = secondaryColor;
                    ctx.shadowColor = secondaryColor;
                    ctx.shadowBlur = glowIntensity * 2;
                    ctx.globalAlpha = 0.5 * (1 - boundedT);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            });
        };

       // 🧬 DNA Helix Pattern
       LGraphCanvas.prototype.renderDNAHelix = function(ctx, items, phase) {
            const direction = -AnimationState.direction; // Negate direction to reverse flow
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const totalTime = State.totalTime || 0;
            const continuousPhase = totalTime * animSpeed;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                const points = Math.floor(SACRED.COMPLETION * quality * 2);
                const helixRadius = 10;
                const rotations = 4;
                
                // Get custom colors
                const primaryColor = ColorManager.getLinkColor(defaultColor);
                const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                const accentColor = ColorManager.getAccentColor(defaultColor);
                
                // Calculate helix path points for both strands
                const strand1Points = [];
                const strand2Points = [];
                
                // Determine actual start and end points based on direction
                const actualStart = direction > 0 ? start : end;
                const actualEnd = direction > 0 ? end : start;
                
                for (let i = 0; i <= points; i++) {
                    const t = i / points;
                    const baseAngle = t * Math.PI * rotations * 2 + continuousPhase;
                    
                    // Get the base position along the path using actual start/end points
                    const pos = LinkRenderers[linkStyle].getPoint(
                        actualStart,
                        actualEnd,
                        t,
                        isStatic ? 0.3 : 0.5
                    );
                    
                    const helixX = Math.cos(baseAngle) * helixRadius;
                    const helixY = Math.sin(baseAngle) * helixRadius;
                    
                    strand1Points.push({
                        x: pos[0] + helixX,
                        y: pos[1] + helixY
                    });
                    
                    strand2Points.push({
                        x: pos[0] - helixX,
                        y: pos[1] - helixY
                    });
                }
                
                // Draw the strands
                [strand1Points, strand2Points].forEach((strandPoints, index) => {
                    ctx.beginPath();
                    strandPoints.forEach((point, i) => {
                        i === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
                    });
                    
                    ctx.strokeStyle = index === 0 ? primaryColor : secondaryColor;
                    ctx.lineWidth = thickness;
                    ctx.shadowColor = index === 0 ? primaryColor : secondaryColor;
                    ctx.shadowBlur = glowIntensity;
                    ctx.stroke();
                });
                
                // Draw connecting bonds
                const bonds = rotations * 4;
                
                ctx.strokeStyle = accentColor;
                ctx.shadowColor = accentColor;
                ctx.shadowBlur = glowIntensity * 0.5;
                ctx.globalAlpha = 0.6;
                
                for (let b = 0; b < bonds; b++) {
                    const t = b / bonds;
                    const baseAngle = t * Math.PI * rotations * 2 + continuousPhase;
                    
                    // Get the base position for bonds using actual start/end points
                    const pos = LinkRenderers[linkStyle].getPoint(
                        actualStart,
                        actualEnd,
                        t,
                        isStatic ? 0.3 : 0.5
                    );
                    
                    const x1 = pos[0] + Math.cos(baseAngle) * helixRadius;
                    const y1 = pos[1] + Math.sin(baseAngle) * helixRadius;
                    const x2 = pos[0] - Math.cos(baseAngle) * helixRadius;
                    const y2 = pos[1] - Math.sin(baseAngle) * helixRadius;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            });
        };

        // 🌋 Lava Flow Pattern
        LGraphCanvas.prototype.renderLavaFlow = function(ctx, items, phase) {
            const direction = AnimationState.direction;
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const totalTime = State.totalTime || 0;
            const continuousPhase = totalTime * animSpeed;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                const primaryColor = ColorManager.getLinkColor(defaultColor);
                const secondaryColor = ColorManager.getSecondaryColor(defaultColor);
                const accentColor = ColorManager.getAccentColor(defaultColor);
                
                // Draw the base link using the selected style
                if (linkStyle !== 'hidden') {
                    ctx.strokeStyle = primaryColor;
                    ctx.lineWidth = thickness;
                    ctx.globalAlpha = 0;
                    LinkRenderers[linkStyle].draw(ctx, start, end, primaryColor, thickness, isStatic);
                    ctx.globalAlpha = 1;
                }
                
                const tubeWidth = thickness * 7;
                const flowWidth = thickness * 5;
                const turbulenceScale = 20;
                const points = Math.floor(SACRED.TRINITY * quality * 12);
                
                // Draw outer tube (container)
                ctx.beginPath();
                for (let i = 0; i <= points; i++) {
                    const t = i / points;
                    const pos = LinkRenderers[linkStyle].getPoint(start, end, t, isStatic ? 0.3 : 0.5);
                    const noise = Math.sin(t * Math.PI * 3 + continuousPhase) * turbulenceScale;
                    
                    const x = pos[0];
                    const y = pos[1] + noise * Math.sin(continuousPhase * 0.8 + t * Math.PI * 2);
                    
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                
                ctx.strokeStyle = secondaryColor;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = tubeWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Draw lava flow
                ctx.beginPath();
                for (let i = 0; i <= points; i++) {
                    const t = i / points;
                    const pos = LinkRenderers[linkStyle].getPoint(start, end, t, isStatic ? 0.3 : 0.5);
                    const noise = Math.sin(t * Math.PI * 3 + continuousPhase * 1.2) * (turbulenceScale * 0.7);
                    
                    const x = pos[0];
                    const y = pos[1] + noise * Math.sin(continuousPhase * 0.6 + t * Math.PI * 2);
                    
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                
                // Create gradient for lava effect
                const gradient = ctx.createLinearGradient(
                    direction > 0 ? start[0] : end[0], 
                    direction > 0 ? start[1] : end[1], 
                    direction > 0 ? end[0] : start[0], 
                    direction > 0 ? end[1] : start[1]
                );
                gradient.addColorStop(0, primaryColor);
                gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondaryColor);
                gradient.addColorStop(1, accentColor);
                
                ctx.globalAlpha = 1;
                ctx.strokeStyle = gradient;
                ctx.lineWidth = flowWidth;
                ctx.lineCap = 'round';
                ctx.shadowColor = secondaryColor;
                ctx.shadowBlur = glowIntensity * 1.5;
                ctx.stroke();
                
                // Update particle animation
                const particleCount = Math.floor(SACRED.TRINITY * quality * particleDensity * 3);
                for (let i = 0; i < particleCount; i++) {
                    const baseT = i / particleCount;
                    const t = direction > 0 ? 
                        ((baseT + (continuousPhase * 0.5)) % 1) : 
                        (1 - ((baseT + (continuousPhase * 0.5)) % 1));
                    
                    const boundedT = Math.max(0, Math.min(1, t));
                    const pos = LinkRenderers[linkStyle].getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
                    const noise = Math.sin(boundedT * Math.PI * 3 + continuousPhase) * (turbulenceScale * 0.3);
                    
                    const x = pos[0] + Math.sin(boundedT * Math.PI * 2) * (tubeWidth * 0.15);
                    const y = pos[1] + noise * Math.sin(continuousPhase + boundedT * Math.PI * 2) + 
                             Math.cos(boundedT * Math.PI * 3) * (tubeWidth * 0.15);
                    
                    const particleSize = thickness * (0.5 + Math.sin(continuousPhase + i) * 0.2);
                    
                    ctx.beginPath();
                    ctx.arc(x, y, particleSize, 0, Math.PI * 2);
                    ctx.fillStyle = accentColor;
                    ctx.globalAlpha = 0.6 + Math.sin(continuousPhase + i) * 0.4;
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            });
        };

        // 🎨 Optimized Animation Loop
        function animate() {
            const isStaticMode = app.ui.settings.getSettingValue("🔗 Enhanced Links.Static.Mode", false);
            const animStyle = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animate", 3);
            const shouldPauseDuringRender = app.ui.settings.getSettingValue("🔗 Enhanced Links.Pause.During.Render", true);
            
            // Check if we should pause during rendering
            if (shouldPauseDuringRender && State.isRunning) {
                if (!State.lastRenderState) {
                    State.lastRenderState = {
                        phase: State.phase,
                        totalTime: State.totalTime
                    };
                }
                requestAnimationFrame(animate);
                return;
            } else if (State.lastRenderState) {
                // Restore state after render completes
                State.phase = State.lastRenderState.phase;
                State.totalTime = State.lastRenderState.totalTime;
                State.lastRenderState = null;
            }
            
            // Always update in static mode or when animations are enabled
            if ((isStaticMode && animStyle > 0) || (animStyle > 0 && !isStaticMode)) {
                State.totalTime += TimingManager.smoothDelta * State.speedMultiplier;
                app.graph.setDirtyCanvas(true, true);
            }
            
            // Request next frame
            State.animationFrame = requestAnimationFrame(animate);
        }

        // 🎨 Classic Flow Pattern
        LGraphCanvas.prototype.renderClassicFlow = function(ctx, items, phase) {
            const direction = AnimationState.direction;
            const quality = app.ui.settings.getSettingValue("🔗 Enhanced Links.Quality", 2);
            const thickness = app.ui.settings.getSettingValue("🔗 Enhanced Links.Thickness", 2);
            const glowIntensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Glow.Intensity", 10);
            const particleDensity = app.ui.settings.getSettingValue("🔗 Enhanced Links.Particle.Density", 1);
            const animSpeed = app.ui.settings.getSettingValue("🔗 Enhanced Links.Animation.Speed", 1);
            const markerEnabled = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Enabled", true);
            const markerShape = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Shape", "diamond");
            const markerSize = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Size", 1.5);
            const markerColorMode = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Color.Mode", "inherit");
            const markerColor = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Color", "#ffffff");
            const markerGlow = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Glow", 10);
            const markerEffect = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Effects", "none");
            const colorScheme = app.ui.settings.getSettingValue("🔗 Enhanced Links.Color.Scheme", "default");
            const shadowEnabled = app.ui.settings.getSettingValue("🔗 Enhanced Links.Shadow.Enabled", false);
            const shadowBlur = app.ui.settings.getSettingValue("🔗 Enhanced Links.Shadow.Blur", 5);
            const shadowOffset = app.ui.settings.getSettingValue("🔗 Enhanced Links.Shadow.Offset", 3);
            const totalTime = State.totalTime || 0;
            const continuousPhase = totalTime * animSpeed;
            
            items.forEach(({start, end, color, defaultColor, linkStyle, isStatic}) => {
                // Apply color enhancement to primary color
                const primaryColor = ColorManager.enhanceColor(
                    ColorManager.getLinkColor(defaultColor),
                    colorScheme
                );
                
                // Draw the base link using the selected style
                if (linkStyle !== 'hidden') {
                    // Get the appropriate color based on color mode and apply enhancement
                    const linkColor = ColorManager.getCustomColors() ? 
                        ColorManager.getLinkColor(defaultColor) : defaultColor;
                    
                    const enhancedColor = ColorManager.enhanceColor(linkColor, colorScheme);
                    ctx.lineWidth = thickness;
                    
                    // Get shadow settings
                    const linkShadowEnabled = app.ui.settings.getSettingValue("🔗 Enhanced Links.Link.Shadow.Enabled", false);
                    
                    // Draw shadow first if enabled
                    if (linkShadowEnabled) {
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                        ctx.shadowBlur = shadowBlur * 4;
                        ctx.shadowOffsetX = shadowOffset * 3;
                        ctx.shadowOffsetY = shadowOffset * 3;
                        ctx.lineWidth = thickness * 1.2;
                        LinkRenderers[linkStyle].draw(ctx, start, end, 'rgba(0, 0, 0, 0.95)', thickness * 1.2, true);
                    }
                    
                    // Draw the actual link with glow
                    ctx.shadowColor = enhancedColor;
                    ctx.shadowBlur = glowIntensity;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.strokeStyle = enhancedColor;
                    ctx.lineWidth = thickness;
                    
                    // Draw the actual link
                    LinkRenderers[linkStyle].draw(ctx, start, end, enhancedColor, thickness, true);
                }

                // Draw markers if enabled
                if (markerEnabled && markerShape !== 'none') {
                    // Set marker color based on mode and apply enhancement
                    let effectiveMarkerColor;
                    if (markerColorMode === "custom") {
                        effectiveMarkerColor = ColorManager.enhanceColor(
                            ColorManager.validateHexColor(markerColor) || primaryColor,
                            colorScheme
                        );
                    } else if (markerColorMode === "default") {
                        effectiveMarkerColor = ColorManager.enhanceColor(defaultColor, colorScheme);
                    } else {
                        effectiveMarkerColor = primaryColor; // Already enhanced above
                    }

                    // Draw traveling midpoint marks
                    const numMarks = Math.floor(SACRED.TRINITY * quality * markerSize * particleDensity * 0.5);
                    const markSize = 3 * markerSize;
                    
                    // Apply marker effects
                    for (let i = 0; i < numMarks; i++) {
                        const baseT = i / numMarks;
                        const t = direction > 0 ? 
                            ((baseT + continuousPhase * 0.1) % 1) : 
                            (1 - ((baseT + continuousPhase * 0.1) % 1));
                        
                        const pos = LinkRenderers[linkStyle].getPoint(start, end, t, true);
                        
                        // Calculate angle for directional markers like arrows
                        let angle = 0;
                        if (markerShape === 'arrow') {
                            const nextT = Math.min(t + 0.01, 1);
                            const nextPos = LinkRenderers[linkStyle].getPoint(start, end, nextT, true);
                            angle = Math.atan2(nextPos[1] - pos[1], nextPos[0] - pos[0]);
                        }
                        
                        // Apply effects to marker color and opacity
                        let effectColor = effectiveMarkerColor;
                        let opacity = 1;
                        
                        // Apply marker effects regardless of shadow mode
                        switch(markerEffect) {
                            case "pulse":
                                opacity = 0.5 + Math.sin(phase + t * Math.PI * 2) * 0.5;
                                break;
                            case "fade":
                                opacity = 1 - t;
                                break;
                            case "rainbow":
                                const hue = ((t * 360) + (phase * 50)) % 360;
                                effectColor = ColorManager.enhanceColor(
                                    `hsl(${hue}, 100%, 50%)`,
                                    colorScheme
                                );
                                break;
                        }
                        
                        // Draw the marker with effects
                        if (MarkerShapes[markerShape]) {
                            // Get marker shadow setting
                            const markerShadowEnabled = app.ui.settings.getSettingValue("🔗 Enhanced Links.Marker.Shadow.Enabled", false);
                            
                            // Draw shadow first if enabled
                            if (markerShadowEnabled) {
                                ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                                ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                                ctx.shadowBlur = shadowBlur * 4;
                                ctx.shadowOffsetX = shadowOffset * 3;
                                ctx.shadowOffsetY = shadowOffset * 3;
                                ctx.globalAlpha = opacity;
                                MarkerShapes[markerShape](ctx, pos[0], pos[1], markSize * 1.2, angle);
                                if (markerShape !== 'cross') {
                                    ctx.fill();
                                }
                            }

                            // Draw the actual marker with glow
                            ctx.shadowColor = markerEffect === "rainbow" ? primaryColor : effectColor;
                            ctx.shadowBlur = markerGlow;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                            
                            // Set both fill and stroke styles for cross shape
                            if (markerShape === 'cross') {
                                ctx.strokeStyle = effectColor;
                            }
                            ctx.fillStyle = effectColor;
                            
                            ctx.globalAlpha = opacity;
                            MarkerShapes[markerShape](ctx, pos[0], pos[1], markSize, angle);
                            if (markerShape !== 'cross') {
                                ctx.fill();
                            }
                        }
                    }
                }
                ctx.globalAlpha = 1;
            });
        };


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
                                            <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM256 336c44.13 0 80-35.88 80-80c0-44.13-35.88-80-80-80c-44.13 0-80 35.88-80 80C176 300.1 211.9 336 256 336zM256 208c26.47 0 48 21.53 48 48s-21.53 48-48 48s-48-21.53-48-48S229.5 208 256 208zM256 128c70.75 0 128 57.25 128 128s-57.25 128-128 128s-128-57.25-128-128S185.3 128 256 128z"/>
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

        // 🚀 Initialize Animation System
        animate();

        // 🧹 Cleanup on Extension Unload
        return () => {
            if (State.animationFrame) {
                cancelAnimationFrame(State.animationFrame);
                State.animationFrame = null;
            }
            
            // Clear any stored states
            State.linkPositions.clear();
            State.particlePool.clear();
            State.activeParticles.clear();
            State.lastRenderState = null;
            State.lastSettings = null;
            
            // Reset animation state
            State.isRunning = false;
            State.phase = 0;
            State.totalTime = 0;
            State.speedMultiplier = 1;
            
            // Force canvas update
            if (app.graph && app.graph.canvas) {
                app.graph.canvas.dirty_canvas = true;
                app.graph.canvas.dirty_bgcanvas = true;
                app.graph.canvas.draw(true, true);
            }
        };
    }
});