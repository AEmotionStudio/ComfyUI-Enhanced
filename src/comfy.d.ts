import { ComfyApp, ComfyAPI } from './core/types';

declare module "/scripts/app.js" {
    export const app: ComfyApp;
}

declare module "/scripts/api.js" {
    export const api: ComfyAPI;
}

declare global {
    const LGraphCanvas: any;
}

export { };
