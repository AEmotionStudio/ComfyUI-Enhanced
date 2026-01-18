import { describe, it, expect } from 'vitest';
import { createPatternDesignerWindow } from '@/utils/designer';

describe('Security Enhancements', () => {
    it('should include Content Security Policy in designer window iframe', () => {
        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const srcdoc = iframe!.srcdoc;
        expect(srcdoc).toContain('<meta http-equiv="Content-Security-Policy"');

        // Verify specific directives
        const expectedDirectives = [
            "default-src 'none'",
            "script-src 'unsafe-inline'",
            "style-src 'unsafe-inline' https://fonts.googleapis.com",
            "font-src https://fonts.gstatic.com"
        ];

        expectedDirectives.forEach(directive => {
            expect(srcdoc).toContain(directive);
        });
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
