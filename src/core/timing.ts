/**
 * Animation timing utilities for the ComfyUI Enhanced Links and Nodes extension.
 * Provides timing management, animation controllers, and frame timing.
 *
 * @module core/timing
 */

import { ANIMATION } from './config';

// =============================================================================
// Types
// =============================================================================

/** Timing manager state for tracking frame deltas */
export interface TimingState {
    /** Smoothed delta time between frames */
    smoothDelta: number;
    /** Total frame count */
    frameCount: number;
    /** Timestamp of last frame */
    lastTime: number;
}

/** Animation controller for phase-based animations */
export interface AnimationControllerState {
    /** Target phase for smooth transitions */
    targetPhase: number;
    /** Smoothing factor (0-1) */
    smoothFactor: number;
    /** Last phase update timestamp */
    lastPhaseUpdate: number;
    /** Animation direction (1 = forward, -1 = reverse) */
    direction: number;
    /** Phase transition speed (radians per second) */
    transitionSpeed: number;
}

/** Particle controller state for independent particle timing */
export interface ParticleControllerState {
    /** Current particle phase */
    phase: number;
    /** Last update timestamp */
    lastUpdate: number;
    /** Animation direction */
    direction: number;
    /** Transition speed */
    transitionSpeed: number;
}

// =============================================================================
// Timing Manager
// =============================================================================

/**
 * Creates a timing manager for tracking frame deltas.
 * Uses exponential smoothing to prevent jerky animations.
 *
 * @returns TimingState object with update method
 */
export function createTimingManager(): TimingState & {
    update(currentTime: number): number;
    reset(): void;
} {
    const state: TimingState = {
        smoothDelta: 0,
        frameCount: 0,
        lastTime: performance.now(),
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
        update(currentTime: number): number {
            const rawDelta = Math.min(
                (currentTime - state.lastTime) / 1000,
                ANIMATION.MAX_DELTA
            );
            state.lastTime = currentTime;
            state.frameCount++;
            state.smoothDelta =
                state.smoothDelta * ANIMATION.SMOOTH_FACTOR +
                rawDelta * (1 - ANIMATION.SMOOTH_FACTOR);
            return state.smoothDelta;
        },

        /**
         * Reset timing state
         */
        reset(): void {
            state.smoothDelta = 0;
            state.frameCount = 0;
            state.lastTime = performance.now();
        },
    };
}

// =============================================================================
// Animation Controller
// =============================================================================

/**
 * Creates an animation controller for phase-based animations.
 * Handles smooth transitions and direction changes.
 *
 * @param transitionSpeed - Speed of phase transitions (default from config)
 * @returns Animation controller object
 */
export function createAnimationController(
    transitionSpeed = ANIMATION.TRANSITION_SPEED
): AnimationControllerState & {
    update(
        currentTime: number,
        delta: number,
        phase: number,
        getDirection: () => number,
        getSpeed: () => number
    ): number;
    reset(): void;
} {
    const state: AnimationControllerState = {
        targetPhase: 0,
        smoothFactor: ANIMATION.SMOOTH_FACTOR,
        lastPhaseUpdate: 0,
        direction: 1,
        transitionSpeed,
    };

    return {
        ...state,
        get targetPhase() {
            return state.targetPhase;
        },
        get direction() {
            return state.direction;
        },

        /**
         * Update animation phase with smooth transitions
         *
         * @param currentTime - Current timestamp
         * @param delta - Delta time in seconds
         * @param phase - Current phase value
         * @param getDirection - Function to get current direction
         * @param getSpeed - Function to get current speed multiplier
         * @returns Updated phase value
         */
        update(
            currentTime: number,
            delta: number,
            phase: number,
            getDirection: () => number,
            getSpeed: () => number
        ): number {
            const direction = getDirection();
            const speed = Math.max(0.01, getSpeed());

            // Handle direction changes
            if (state.direction !== direction) {
                state.direction = direction;
                state.targetPhase = phase + Math.PI * 2 * state.direction;
            }

            // Update phase at ~60fps
            if (currentTime - state.lastPhaseUpdate >= ANIMATION.RAF_THROTTLE) {
                const phaseStep = state.transitionSpeed * delta * speed;

                // Smooth transition to target phase
                if (Math.abs(state.targetPhase - phase) > 0.01) {
                    phase += Math.sign(state.targetPhase - phase) * phaseStep;
                } else {
                    // Continuous phase progression
                    phase += phaseStep * state.direction;
                    state.targetPhase = phase;
                }

                state.lastPhaseUpdate = currentTime;
            }

            return phase;
        },

        reset(): void {
            state.targetPhase = 0;
            state.lastPhaseUpdate = 0;
            state.direction = 1;
        },
    };
}

// =============================================================================
// Particle Controller
// =============================================================================

/**
 * Creates a particle controller for independent particle timing.
 * Similar to animation controller but optimized for particle effects.
 *
 * @param transitionSpeed - Speed of particle phase transitions
 * @returns Particle controller object
 */
export function createParticleController(
    transitionSpeed = ANIMATION.FAST_TRANSITION_SPEED
): ParticleControllerState & {
    update(
        currentTime: number,
        delta: number,
        getDirection: () => number,
        getSpeed: () => number
    ): number;
    reset(): void;
} {
    const state: ParticleControllerState = {
        phase: 0,
        lastUpdate: 0,
        direction: 1,
        transitionSpeed,
    };

    return {
        ...state,
        get phase() {
            return state.phase;
        },
        get direction() {
            return state.direction;
        },

        /**
         * Update particle phase
         *
         * @param currentTime - Current timestamp
         * @param delta - Delta time in seconds
         * @param getDirection - Function to get current direction
         * @param getSpeed - Function to get current speed multiplier
         * @returns Updated particle phase
         */
        update(
            currentTime: number,
            delta: number,
            getDirection: () => number,
            getSpeed: () => number
        ): number {
            const direction = getDirection();
            const speed = Math.max(0.01, getSpeed());

            if (state.direction !== direction) {
                state.direction = direction;
            }

            if (currentTime - state.lastUpdate >= ANIMATION.RAF_THROTTLE) {
                state.phase += state.transitionSpeed * delta * speed * state.direction;
                state.lastUpdate = currentTime;
            }

            return state.phase;
        },

        reset(): void {
            state.phase = 0;
            state.lastUpdate = 0;
            state.direction = 1;
        },
    };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Creates a requestAnimationFrame loop with proper cleanup.
 *
 * @param callback - Function to call each frame with delta time
 * @returns Cleanup function to stop the loop
 */
export function createAnimationLoop(
    callback: (delta: number, time: number) => void
): () => void {
    let animationFrameId: number | null = null;
    let lastTime = performance.now();
    let running = true;

    const loop = (currentTime: number) => {
        if (!running) return;

        const delta = Math.min((currentTime - lastTime) / 1000, ANIMATION.MAX_DELTA);
        lastTime = currentTime;

        callback(delta, currentTime);

        animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
        running = false;
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
    };
}

/**
 * Throttles a function to run at most once per animation frame.
 *
 * @param fn - Function to throttle
 * @returns Throttled function
 */
export function throttleRAF<T extends (...args: unknown[]) => void>(
    fn: T
): (...args: Parameters<T>) => void {
    let queued = false;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
        lastArgs = args;
        if (!queued) {
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                if (lastArgs) {
                    fn(...lastArgs);
                }
            });
        }
    };
}
