// Type declaration for Vite CSS inline imports
declare module '*.css?inline' {
    const content: string;
    export default content;
}
