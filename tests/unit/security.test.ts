import { describe, it, expect } from 'vitest';
import { createPatternDesignerWindow } from '@/utils/designer';

describe('Security Enhancements', () => {
    it('should include Content Security Policy with nonce in designer window iframe', () => {
        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const srcdoc = iframe!.srcdoc;
        expect(srcdoc).toContain('<meta http-equiv="Content-Security-Policy"');

        // Verify nonce generation
        const nonceMatch = srcdoc.match(/script-src 'nonce-([^']+)'/);
        expect(nonceMatch).not.toBeNull();
        const nonce = nonceMatch![1];
        expect(nonce).toBeTruthy();

        // Verify specific directives
        const expectedDirectives = [
            "default-src 'none'",
            `script-src 'nonce-${nonce}'`,
            "style-src 'unsafe-inline' https://fonts.googleapis.com",
            "font-src https://fonts.gstatic.com"
        ];

        expectedDirectives.forEach(directive => {
            expect(srcdoc).toContain(directive);
        });

        // Verify script-src does NOT contain unsafe-inline
        // Note: style-src still contains it
        const scriptSrc = srcdoc.match(/script-src [^;]+/);
        expect(scriptSrc).not.toBeNull();
        expect(scriptSrc![0]).not.toContain("'unsafe-inline'");

        // Verify script tag has the nonce
        const parser = new DOMParser();
        const doc = parser.parseFromString(srcdoc, 'text/html');
        const script = doc.querySelector('script');
        expect(script).not.toBeNull();
        expect(script!.getAttribute('nonce')).toBe(nonce);
    });

    it('should prevent reverse tabnabbing on external links', () => {
        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const srcdoc = iframe!.srcdoc;
        const parser = new DOMParser();
        const doc = parser.parseFromString(srcdoc, 'text/html');
        const externalLinks = doc.querySelectorAll('a[target="_blank"]');

        // Should have some links to test
        expect(externalLinks.length).toBeGreaterThan(0);

        externalLinks.forEach(link => {
            const rel = link.getAttribute('rel');
            expect(rel).not.toBeNull();
            expect(rel).toContain('noopener');
            expect(rel).toContain('noreferrer');
        });
    });
});
