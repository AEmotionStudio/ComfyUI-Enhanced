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

    it('should have rel="noopener noreferrer" on all target="_blank" links', () => {
        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const srcdoc = iframe!.srcdoc;
        // Basic check using regex on the HTML string since we can't easily parse the srcdoc inner DOM in this test env without more setup
        const linksWithTargetBlank = srcdoc.match(/<a[^>]*target="_blank"[^>]*>/g) || [];

        expect(linksWithTargetBlank.length).toBeGreaterThan(0);

        linksWithTargetBlank.forEach(linkTag => {
            expect(linkTag).toContain('rel="noopener noreferrer"');
        });
    });
});
