/**
 * Link Transition Manager — smooth spring physics for static mode transitions.
 *
 * When switching between animation styles in static mode, this provides
 * smooth interpolation of the static phase using spring dynamics.
 *
 * Ported from original link_animations.js LinkTransitionManager (lines 1748–1820).
 *
 * @module renderers/link-transition-manager
 */

export interface TransitionState {
    currentPhase: number;
    targetPhase: number;
    velocity: number;
    isTransitioning: boolean;
}

const SPRING_STRENGTH = 0.15;
const DAMPING = 0.8;
const THRESHOLD = 0.01;

export class LinkTransitionManager {
    private state: TransitionState;

    constructor(initialPhase: number = Math.PI / 4) {
        this.state = {
            currentPhase: initialPhase,
            targetPhase: initialPhase,
            velocity: 0,
            isTransitioning: false,
        };
    }

    /** Set a new target phase (triggers spring animation) */
    setTarget(target: number): void {
        this.state.targetPhase = target;
        this.state.isTransitioning = true;
    }

    /** Jump immediately to a phase without transition */
    setImmediate(phase: number): void {
        this.state.currentPhase = phase;
        this.state.targetPhase = phase;
        this.state.velocity = 0;
        this.state.isTransitioning = false;
    }

    /** Update the spring simulation. Returns the current interpolated phase. */
    update(): number {
        if (!this.state.isTransitioning) return this.state.currentPhase;

        const displacement = this.state.targetPhase - this.state.currentPhase;
        const springForce = displacement * SPRING_STRENGTH;
        this.state.velocity = (this.state.velocity + springForce) * DAMPING;
        this.state.currentPhase += this.state.velocity;

        if (Math.abs(displacement) < THRESHOLD && Math.abs(this.state.velocity) < THRESHOLD) {
            this.state.currentPhase = this.state.targetPhase;
            this.state.velocity = 0;
            this.state.isTransitioning = false;
        }

        return this.state.currentPhase;
    }

    /** Whether a transition is currently in progress */
    get transitioning(): boolean {
        return this.state.isTransitioning;
    }

    /** Current phase value */
    get phase(): number {
        return this.state.currentPhase;
    }
}
