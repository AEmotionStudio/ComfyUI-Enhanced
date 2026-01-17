import { describe, it, expect } from 'vitest';
import { createPatternDesignerWindow } from '@/utils/designer';

describe('Designer Accessibility', () => {
    it('should have accessible modal attributes', () => {
        const modal = createPatternDesignerWindow();

        expect(modal.getAttribute('role')).toBe('dialog');
        expect(modal.getAttribute('aria-modal')).toBe('true');

        const labelledBy = modal.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();
        expect(labelledBy).toMatch(/^designer-title-/);

        const title = modal.querySelector(`#${labelledBy}`);
        expect(title).not.toBeNull();
    });

    it('should have accessible close button', () => {
        const modal = createPatternDesignerWindow();
        const buttons = modal.querySelectorAll('button');
        const closeBtn = Array.from(buttons).find(b => b.textContent === '×');

        expect(closeBtn).toBeDefined();
        expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
    });

    it('should have accessible links in iframe content', () => {
        const modal = createPatternDesignerWindow();
        const iframe = modal.querySelector('iframe');
        expect(iframe).not.toBeNull();

        const srcdoc = iframe!.srcdoc || '';

        expect(srcdoc).toContain('aria-label="Visit Æmotion Studio YouTube Channel"');
        expect(srcdoc).toContain('aria-label="Visit Æmotion Studio GitHub Profile"');
        expect(srcdoc).toContain('aria-label="Join Æmotion Studio Discord Server"');
        expect(srcdoc).toContain('aria-label="Visit Æmotion Studio Website"');
    });
});
