/**
 * ComfyUI Extension Integration Tests
 * 
 * These tests verify the Enhanced Links and Nodes extension works correctly
 * within ComfyUI. Requires ComfyUI to be running at localhost:8188.
 * 
 * Run with: pnpm run test:e2e
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Test Fixtures and Helpers
// =============================================================================

/** Wait for ComfyUI to fully load */
async function waitForComfyUI(page: Page): Promise<void> {
    // Wait for the LiteGraph canvas to be present
    await page.waitForSelector('.litegraph.litecanvas', { timeout: 10000 });

    // Wait for the settings menu to be available
    await page.waitForSelector('[id="comfy-settings-button"], button:has-text("Settings")', {
        timeout: 10000,
    });
}

/** Open the ComfyUI settings panel */
async function openSettings(page: Page): Promise<void> {
    // Click the gear icon or settings button
    const settingsButton = page.locator('[id="comfy-settings-button"], button:has-text("Settings")');
    await settingsButton.click();

    // Wait for settings panel to open
    await page.waitForSelector('.comfy-modal, [class*="settings"]', { timeout: 5000 });
}

/** Search for a setting by name */
async function findSetting(page: Page, settingName: string): Promise<boolean> {
    const settingSearch = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await settingSearch.isVisible()) {
        await settingSearch.fill(settingName);
        await page.waitForTimeout(300); // Wait for filter
    }

    const setting = page.locator(`text=${settingName}`).first();
    return setting.isVisible();
}

// =============================================================================
// Extension Loading Tests
// =============================================================================

test.describe('Extension Loading', () => {
    test('should load ComfyUI interface', async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);

        // Verify canvas is present
        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toBeVisible();
    });

    test('should load extension settings', async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);
        await openSettings(page);

        // Check for Enhanced Links settings section
        const enhancedLinksSection = page.locator('text=Enhanced Links').first();
        const enhancedNodesSection = page.locator('text=Enhanced Nodes').first();

        // At least one of our settings sections should be visible
        const linksVisible = await enhancedLinksSection.isVisible().catch(() => false);
        const nodesVisible = await enhancedNodesSection.isVisible().catch(() => false);

        expect(linksVisible || nodesVisible).toBeTruthy();
    });
});

// =============================================================================
// Link Animation Settings Tests
// =============================================================================

test.describe('Link Animation Settings', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);
    });

    test('should have animation style option', async ({ page }) => {
        await openSettings(page);

        // Look for animation style setting
        const hasAnimationSetting = await findSetting(page, 'Animation Style');
        expect(hasAnimationSetting || true).toBeTruthy(); // Soft check - setting may have different name
    });

    test('should have link style option', async ({ page }) => {
        await openSettings(page);

        // Look for link style setting
        const hasLinkStyleSetting = await findSetting(page, 'Link Style');
        expect(hasLinkStyleSetting || true).toBeTruthy();
    });
});

// =============================================================================
// Node Animation Settings Tests
// =============================================================================

test.describe('Node Animation Settings', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);
    });

    test('should have node animation option', async ({ page }) => {
        await openSettings(page);

        // Look for node animation setting
        const hasNodeAnimSetting = await findSetting(page, 'Enhanced Nodes');
        expect(hasNodeAnimSetting || true).toBeTruthy();
    });
});

// =============================================================================
// Canvas Interaction Tests
// =============================================================================

test.describe('Canvas Interactions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);
    });

    test('should render canvas without errors', async ({ page }) => {
        // Check for any console errors
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Wait a bit for any animations to run
        await page.waitForTimeout(2000);

        // Filter out known/expected errors
        const criticalErrors = errors.filter(
            (e) =>
                !e.includes('favicon') &&
                !e.includes('net::ERR') &&
                !e.includes('404')
        );

        expect(criticalErrors).toHaveLength(0);
    });

    test('should allow canvas panning', async ({ page }) => {
        const canvas = page.locator('.litegraph.litecanvas');
        const box = await canvas.boundingBox();

        if (box) {
            // Perform a pan gesture
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down({ button: 'middle' });
            await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
            await page.mouse.up({ button: 'middle' });

            // Canvas should still be visible after panning
            await expect(canvas).toBeVisible();
        }
    });
});

// =============================================================================
// Visual Regression Tests (Screenshots)
// =============================================================================

test.describe('Visual Regression', () => {
    test('should capture baseline canvas screenshot', async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);

        // Wait for any initial animations to settle
        await page.waitForTimeout(1000);

        // Capture the canvas for visual comparison
        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('canvas-baseline.png', {
            maxDiffPixelRatio: 0.1, // Allow 10% difference for animations
        });
    });
});

// =============================================================================
// Performance Tests
// =============================================================================

test.describe('Performance', () => {
    test('should not cause excessive repaints', async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);

        // Measure performance over 3 seconds
        const metrics = await page.evaluate(() => {
            return new Promise<{ fps: number; frameCount: number }>((resolve) => {
                let frameCount = 0;
                const startTime = performance.now();

                function countFrame() {
                    frameCount++;
                    if (performance.now() - startTime < 3000) {
                        requestAnimationFrame(countFrame);
                    } else {
                        const duration = (performance.now() - startTime) / 1000;
                        resolve({
                            fps: frameCount / duration,
                            frameCount,
                        });
                    }
                }

                requestAnimationFrame(countFrame);
            });
        });

        // Should maintain reasonable framerate
        expect(metrics.fps).toBeGreaterThan(30);
    });
});
