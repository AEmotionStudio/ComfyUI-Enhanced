import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPatternDesignerWindow } from '@/utils/designer';

describe('Designer Window Accessibility', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should have correct ARIA role and modal attributes', () => {
        const modal = createPatternDesignerWindow();
        expect(modal.getAttribute('role')).toBe('dialog');
        expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    it('should be labelled by the title', () => {
        const modal = createPatternDesignerWindow();
        const titleId = modal.getAttribute('aria-labelledby');
        expect(titleId).toBeTruthy();

        const titleElement = modal.querySelector(`#${titleId}`);
        expect(titleElement).not.toBeNull();
        expect(titleElement?.textContent).toBe('About Æmotion Studio');
    });

    it('should set focus to close button upon creation', () => {
        // Since we can't easily test the asynchronous focus in JSDOM without appending to body
        // and waiting, we'll append it to body and simulate the environment.
        document.body.innerHTML = ''; // Clear body
        const modal = createPatternDesignerWindow();
        document.body.appendChild(modal);

        // We need to wait for the focus to happen.
        // In the implementation, we might use setTimeout(..., 0) or requestAnimationFrame.
        // For testing, we can use vi.runAllTimers() if we use fake timers,
        // or just check if the logic exists.

        // Let's assume we'll implement it using requestAnimationFrame or setTimeout
        // We'll use fake timers to control time.
        vi.useFakeTimers();

        // We need to re-create the modal while fake timers are active if the focus logic runs immediately
        document.body.innerHTML = '';
        const modal2 = createPatternDesignerWindow();
        document.body.appendChild(modal2);

        // Fast-forward time
        vi.runAllTimers();

        // Find the close button
        const buttons = modal2.querySelectorAll('button');
        let closeButton: HTMLButtonElement | null = null;
        buttons.forEach(btn => {
            if (btn.textContent === '×') {
                closeButton = btn;
            }
        });

        expect(document.activeElement).toBe(closeButton);

        vi.useRealTimers();
    });
});
