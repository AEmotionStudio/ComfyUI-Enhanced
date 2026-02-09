import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createPatternDesignerWindow } from '@/utils/designer';

describe('Pattern Designer Accessibility', () => {
    // Mock crypto for nonce generation if needed
    beforeEach(() => {
        if (!window.crypto) {
            Object.defineProperty(window, 'crypto', {
                value: {
                    randomUUID: () => 'test-uuid',
                    getRandomValues: (arr: Uint8Array) => arr
                },
                writable: true
            });
        }
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should have proper ARIA attributes on the modal container', () => {
        const modal = createPatternDesignerWindow();

        expect(modal.getAttribute('role')).toBe('dialog');
        expect(modal.getAttribute('aria-modal')).toBe('true');
        expect(modal.getAttribute('aria-labelledby')).toBeTruthy();

        const labelId = modal.getAttribute('aria-labelledby');
        const titleElement = modal.querySelector(`#${labelId}`);
        expect(titleElement).not.toBeNull();
        expect(titleElement?.textContent).toContain('About Æmotion Studio');
    });

    it('should have a title attribute on the close button', () => {
        const modal = createPatternDesignerWindow();
        // The close button is the one with '×'
        const buttons = Array.from(modal.querySelectorAll('button'));
        const closeButton = buttons.find(btn => btn.textContent === '×');

        expect(closeButton).toBeDefined();
        expect(closeButton!.getAttribute('title')).toBe('Close');
    });

    it('should close on Escape key', () => {
        const modal = createPatternDesignerWindow();
        document.body.appendChild(modal);

        // Spy on remove method
        const removeSpy = vi.spyOn(modal, 'remove');

        // Trigger Escape key
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);

        expect(removeSpy).toHaveBeenCalled();
    });

    it('should focus the close button when opened', async () => {
        // We need to use fake timers or wait because of the setTimeout
        vi.useFakeTimers();

        const modal = createPatternDesignerWindow();
        document.body.appendChild(modal);

        // Run timers
        vi.runAllTimers();

        const buttons = Array.from(modal.querySelectorAll('button'));
        const closeButton = buttons.find(btn => btn.textContent === '×');

        expect(document.activeElement).toBe(closeButton);

        vi.useRealTimers();
    });

    it('should restore focus to the previously focused element on close', () => {
        const prevButton = document.createElement('button');
        document.body.appendChild(prevButton);
        prevButton.focus();

        const modal = createPatternDesignerWindow();
        document.body.appendChild(modal);

        const buttons = Array.from(modal.querySelectorAll('button'));
        const closeButton = buttons.find(btn => btn.textContent === '×');

        // Simulate close click
        closeButton!.click();

        expect(document.activeElement).toBe(prevButton);
    });

    it('should show visible focus styles on close button', () => {
        const modal = createPatternDesignerWindow();
        document.body.appendChild(modal);

        const buttons = Array.from(modal.querySelectorAll('button'));
        const closeButton = buttons.find(btn => btn.textContent === '×');

        // Initial state
        closeButton!.blur();
        expect(closeButton!.style.outline).not.toBe('2px solid white');

        // Focus state
        closeButton!.focus();
        // Trigger onfocus handler if it exists
        closeButton!.dispatchEvent(new FocusEvent('focus'));

        expect(closeButton!.style.outline).toBe('2px solid white');
        expect(closeButton!.style.color).toBe('rgb(255, 255, 255)'); // #ffffff

        // Blur state
        closeButton!.blur();
        closeButton!.dispatchEvent(new FocusEvent('blur'));

        expect(closeButton!.style.outline).toBe('none');
        expect(closeButton!.style.color).toBe('rgb(224, 224, 224)'); // #e0e0e0
    });

    it('should maintain white color on mouseleave if focused', () => {
        const modal = createPatternDesignerWindow();
        document.body.appendChild(modal);
        const closeButton = Array.from(modal.querySelectorAll('button')).find(btn => btn.textContent === '×');

        // Initial state
        closeButton!.style.color = 'rgb(224, 224, 224)';

        // Focus
        closeButton!.focus();
        closeButton!.dispatchEvent(new FocusEvent('focus'));
        expect(closeButton!.style.color).toBe('rgb(255, 255, 255)'); // #ffffff

        // Hover
        closeButton!.dispatchEvent(new MouseEvent('mouseenter'));
        expect(closeButton!.style.color).toBe('rgb(255, 255, 255)');

        // Mouse leave
        closeButton!.dispatchEvent(new MouseEvent('mouseleave'));
        // Should still be white because it is focused
        expect(closeButton!.style.color).toBe('rgb(255, 255, 255)');

        // Blur
        closeButton!.blur();
        closeButton!.dispatchEvent(new FocusEvent('blur'));
        expect(closeButton!.style.color).toBe('rgb(224, 224, 224)'); // #e0e0e0
    });
});
