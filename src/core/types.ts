/**
 * Shared type definitions for the ComfyUI Enhanced Links and Nodes extension
 * @module types
 */

// =============================================================================
// Color Types
// =============================================================================

/** Hex color string in the format #RRGGBB */
export type HexColor = `#${string}`;

/** RGBA color string */
export type RgbaColor = `rgba(${number}, ${number}, ${number}, ${number})`;

/** HSL color string */
export type HslColor = `hsl(${number}, ${number}%, ${number}%)`;

/** Any valid CSS color value */
export type Color = HexColor | RgbaColor | HslColor | string;

/** Color enhancement schemes */
export type ColorScheme =
    | 'default'
    | 'saturated'
    | 'vivid'
    | 'contrast'
    | 'bright'
    | 'muted';

/** Color mode for user preference */
export type ColorMode = 'default' | 'custom' | 'off';

/** Particle color modes */
export type ParticleColorMode =
    | 'default'
    | 'rainbow'
    | 'complementary'
    | 'energy'
    | 'quantum'
    | 'aurora';

// =============================================================================
// Link Types
// =============================================================================

/** Available link rendering styles */
export type LinkStyle =
    | 'spline'
    | 'straight'
    | 'linear'
    | 'hidden'
    | 'dotted'
    | 'dashed'
    | 'double'
    | 'stepped'
    | 'zigzag'
    | 'rope'
    | 'glowpath'
    | 'chain'
    | 'pulse'
    | 'holographic';

/** Marker shapes for link flow indicators */
export type MarkerShape =
    | 'none'
    | 'diamond'
    | 'circle'
    | 'arrow'
    | 'square'
    | 'triangle'
    | 'star'
    | 'heart'
    | 'cross'
    | 'hexagon'
    | 'flower'
    | 'spiral';

/** Marker effect animations */
export type MarkerEffect = 'none' | 'pulse' | 'fade' | 'rainbow';

/** Link animation style (0 = off, 1-9 = animation styles) */
export type LinkAnimationStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Parameters for node animation rendering */
export interface NodeAnimationParams {
    animation: {
        phase: number;
        intensity: number;
        direction: number;
        animSpeed: number;
        isStaticMode?: boolean;
        isPaused?: boolean;
    };
    quality: {
        quality: number;
        animationSize: number;
        glowIntensity: number;
    };
    colors: {
        primary: Color;
        secondary: Color;
        accent: Color;
        hoverColor: string;
        showHover: boolean;
    };
}

/** Node animation style identifiers */
export type NodeAnimationStyleName =
    | 'gentlePulse'
    | 'neonNexus'
    | 'cosmicRipple'
    | 'flowerOfLife';

// =============================================================================
// Node Types
// =============================================================================

/** Node animation style (0 = off, 1-4 = animation styles) */
export type NodeAnimationStyle = 0 | 1 | 2 | 3 | 4;

// =============================================================================
// Geometry Types
// =============================================================================

/** A 2D point as [x, y] tuple */
export type Point = [number, number];

/** A 2D vector with named properties */
export interface Vector2D {
    x: number;
    y: number;
}

// =============================================================================
// State Types
// =============================================================================

/** Base animation state shared by link and node animations */
export interface BaseAnimationState {
    isRunning: boolean;
    phase: number;
    lastFrame: number;
    animationFrame: number | null;
    totalTime: number;
    speedMultiplier: number;
    staticPhase: number;
    forceUpdate: boolean;
    forceRedraw: boolean;
    lastRenderState: unknown | null;
}

/** State specific to link animations */
export interface LinkState extends BaseAnimationState {
    particlePool: Map<number, unknown>;
    activeParticles: Set<unknown>;
    linkPositions: Map<number, unknown>;
    lastNodePositions: Map<number, unknown>;
    lastAnimStyle: LinkAnimationStyle | null;
    lastLinkStyle: LinkStyle | null;
    lastSettings: unknown | null;
}

/** State specific to node animations */
export interface NodeState extends BaseAnimationState {
    particlePhase: number;
    lastRAFTime: number;
    nodeEffects: Map<number, unknown>;
    isAnimating: boolean;
    frameSkipCount: number;
    maxFrameSkips: number;
    lastAnimStyle: NodeAnimationStyle | null;
    particlePool: Map<number, unknown>;
    activeParticles: Set<unknown>;
    playCompletionAnimation: boolean;
    completionPhase: number;
    completingNodes: Set<number>;
    disabledCompletionNodes: Set<number>;
    primaryCompletionNode: number | null;
}

// =============================================================================
// Renderer Types
// =============================================================================

/** Interface for link rendering strategies */
export interface LinkRenderer {
    /** Calculate the total length of the link path */
    getLength(start: Point, end: Point): number;

    /** Get normalized t value for a given distance along the path */
    getNormalizedT(
        start: Point,
        end: Point,
        targetDist: number,
        totalLength: number
    ): number;

    /** Get the position at parameter t (0-1) along the path */
    getPoint(start: Point, end: Point, t: number, isStatic?: boolean): Point;

    /** Draw the link on the canvas */
    draw(
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        color: Color,
        thickness: number,
        isStatic?: boolean
    ): void;
}

/** Function signature for marker shape renderers */
export type MarkerShapeRenderer = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    angle?: number
) => void;

// =============================================================================
// ComfyUI Types (External API)
// =============================================================================

/** ComfyUI node object */
export interface ComfyNode {
    id: number;
    title: string;
    size: [number, number];
    color?: string;
    selected?: boolean;
    mouseOver?: boolean;
    animationStyle?: NodeAnimationStyle;
    disableAnimations?: boolean;
    particlesOnly?: boolean;
}

/** Parameters for link animation rendering */
export interface LinkAnimationParams {
    phase: number;
    quality: number;
    glowIntensity: number;
    particleDensity: number;
    direction: number;
    isStatic: boolean;
}

/** ComfyUI application object */
export interface ComfyApp {
    graph: ComfyGraph | null;
    ui: ComfyUI;
    registerExtension(extension: ComfyExtension): void;
}

/** ComfyUI graph object */
export interface ComfyGraph {
    canvas: ComfyCanvas;
    _nodes: ComfyNode[];
    _nodes_by_id: Record<number, ComfyNode>;
    setDirtyCanvas(dirty: boolean, bgDirty: boolean): void;
}

/** ComfyUI canvas object */
export interface ComfyCanvas {
    dirty_canvas: boolean;
    dirty_bgcanvas: boolean;
    _canvas: HTMLCanvasElement;
    draw(force?: boolean, bgForce?: boolean): void;
}

/** ComfyUI UI object */
export interface ComfyUI {
    settings: ComfySettings;
}

/** Individual setting definition */
export interface ComfySetting {
    id: string;
    callback?: (value: unknown) => void;
}

/** ComfyUI settings manager */
export interface ComfySettings {
    items: ComfySetting[];
    getSettingValue<T>(id: string, defaultValue?: T): T;
    setSettingValue(id: string, value: unknown): void;
    addSetting(setting: unknown): void;
}

/** ComfyUI extension definition */
export interface ComfyExtension {
    name: string;
    setup(app: ComfyApp): Promise<void>;
}

/** ComfyUI API object for event listening */
export interface ComfyAPI {
    addEventListener(
        event: string,
        callback: (event: { detail: unknown }) => void
    ): void;
}
