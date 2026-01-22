import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPatternDesignerWindow } from '@/utils/designer';

describe('Security Enhancements', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

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
            `style-src 'nonce-${nonce}' https://fonts.googleapis.com`,
            "font-src https://fonts.gstatic.com"
        ];

        expectedDirectives.forEach(directive => {
            expect(srcdoc).toContain(directive);
        });

        // Verify script-src and style-src do NOT contain unsafe-inline
        const scriptSrc = srcdoc.match(/script-src [^;]+/);
        expect(scriptSrc).not.toBeNull();
        expect(scriptSrc![0]).not.toContain("'unsafe-inline'");

        const styleSrc = srcdoc.match(/style-src [^;]+/);
        expect(styleSrc).not.toBeNull();
        expect(styleSrc![0]).not.toContain("'unsafe-inline'");

        // Verify script tag has the nonce
        const parser = new DOMParser();
        const doc = parser.parseFromString(srcdoc, 'text/html');
        const script = doc.querySelector('script');
        expect(script).not.toBeNull();
        expect(script!.getAttribute('nonce')).toBe(nonce);

        // Verify style tags have the nonce
        const styles = doc.querySelectorAll('style');
        expect(styles.length).toBeGreaterThan(0);
        styles.forEach(style => {
            expect(style.getAttribute('nonce')).toBe(nonce);
        });
    });

    it('should use crypto.getRandomValues fallback if randomUUID is missing', () => {
        // Mock window.crypto.randomUUID to be undefined
        const originalRandomUUID = window.crypto.randomUUID;
        // @ts-ignore
        window.crypto.randomUUID = undefined;

        // Spy on getRandomValues
        const getRandomValuesSpy = vi.spyOn(window.crypto, 'getRandomValues');

        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        const srcdoc = iframe!.srcdoc;

        // Check that a nonce was still generated
        const nonceMatch = srcdoc.match(/script-src 'nonce-([^']+)'/);
        expect(nonceMatch).not.toBeNull();
        const nonce = nonceMatch![1];
        expect(nonce).toBeTruthy();
        // Should be a hex string (since we use hex encoding in fallback)
        expect(nonce).toMatch(/^[0-9a-f]+$/);

        // Verify fallback was called
        expect(getRandomValuesSpy).toHaveBeenCalled();

        // Restore
        window.crypto.randomUUID = originalRandomUUID;
    });

    it('should throw error if no secure crypto is available', () => {
        // Mock window.crypto to be undefined
        const originalCrypto = window.crypto;
        // @ts-ignore
        Object.defineProperty(window, 'crypto', {
            value: undefined,
            writable: true
        });

        expect(() => {
            createPatternDesignerWindow();
        }).toThrow("Secure random number generation is not available.");

        // Restore
        Object.defineProperty(window, 'crypto', {
            value: originalCrypto,
            writable: true
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

    it('should have accessible close button', () => {
        const modal = createPatternDesignerWindow();
        // The close button is the one with '×' text content in the title bar
        // We can't select by class as it uses inline styles, so let's find the button in the title bar
        const buttons = modal.querySelectorAll('button');
        let closeButton: HTMLButtonElement | null = null;
        buttons.forEach(btn => {
            if (btn.textContent === '×') {
                closeButton = btn;
            }
        });

        expect(closeButton).not.toBeNull();
        expect(closeButton!.getAttribute('aria-label')).toBe('Close');
    });

    it('should have accessible social links with aria-labels', () => {
        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const srcdoc = iframe!.srcdoc;
        const parser = new DOMParser();
        const doc = parser.parseFromString(srcdoc, 'text/html');
        const ballLinks = doc.querySelectorAll('a.ball-link');

        expect(ballLinks.length).toBe(4);

        ballLinks.forEach(link => {
            expect(link.getAttribute('aria-label')).toBeTruthy();
            expect(link.getAttribute('title')).toBeTruthy();
        });
    });
});
