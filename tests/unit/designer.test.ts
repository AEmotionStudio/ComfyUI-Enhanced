import { describe, it, expect } from 'vitest';
import { createPatternDesignerWindow } from '../../src/utils/designer';

describe('createPatternDesignerWindow', () => {
    it('should have accessible close button', () => {
        const modal = createPatternDesignerWindow();
        const closeButton = modal.querySelector('button');
        expect(closeButton).not.toBeNull();
        expect(closeButton?.getAttribute('aria-label')).toBe('Close');
    });

    it('should have accessible social links in the iframe content', () => {
        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const htmlContent = iframe?.srcdoc || '';

        // Check for aria-labels on the links
        // We use regex or simple includes because parsing the full HTML string in JSDOM inside a test
        // that's already running in JSDOM might be tricky without creating a new document.
        expect(htmlContent).toContain('aria-label="Visit our YouTube channel"');
        expect(htmlContent).toContain('aria-label="Visit our GitHub profile"');
        expect(htmlContent).toContain('aria-label="Join our Discord server"');
        expect(htmlContent).toContain('aria-label="Visit our official website"');
    });
});
