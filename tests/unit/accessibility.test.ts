import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPatternDesignerWindow } from '@/utils/designer';

describe('Pattern Designer Accessibility', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should have correct ARIA attributes on the modal container', () => {
        const modal = createPatternDesignerWindow();

        expect(modal.getAttribute('role')).toBe('dialog');
        expect(modal.getAttribute('aria-modal')).toBe('true');
        expect(modal.hasAttribute('aria-labelledby')).toBe(true);

        const labelledBy = modal.getAttribute('aria-labelledby');
        const titleElement = modal.querySelector(`#${labelledBy}`);
        expect(titleElement).not.toBeNull();
        expect(titleElement?.textContent).toBe('About Æmotion Studio');
    });

    it('should attempt to focus the close button after mounting', () => {
        vi.useFakeTimers();
        const modal = createPatternDesignerWindow();
        document.body.appendChild(modal);

        // Find the close button
        const buttons = modal.querySelectorAll('button');
        let closeButton: HTMLButtonElement | null = null;
        buttons.forEach(btn => {
            if (btn.textContent === '×') {
                closeButton = btn;
            }
        });

        expect(closeButton).not.toBeNull();

        // Mock focus method
        const focusSpy = vi.spyOn(closeButton!, 'focus');

        // Fast forward time
        vi.runAllTimers();

        expect(focusSpy).toHaveBeenCalled();

        document.body.removeChild(modal);
        vi.useRealTimers();
    });
});
