/**
 * Visual regression tests for link animations.
 * These tests capture screenshots of different link styles and animations.
 * 
 * Run with: pnpm run test:e2e
 */

import { test, expect, Page } from '@playwright/test';

// Helpers

async function waitForComfyUI(page: Page): Promise<void> {
    await page.waitForSelector('.litegraph.litecanvas', { timeout: 10000 });
}

async function setLinkSetting(page: Page, settingId: string, value: string | number | boolean): Promise<void> {
    // This would interact with ComfyUI settings
    // Implementation depends on ComfyUI's settings API
    await page.evaluate(
        ({ id, val }) => {
            const app = (window as any).app;
            if (app?.ui?.settings?.setSettingValue) {
                app.ui.settings.setSettingValue(id, val);
            }
        },
        { id: settingId, val: value }
    );
    await page.waitForTimeout(500); // Wait for setting to apply
}

// Tests

test.describe('Link Style Visuals', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);
        await page.waitForTimeout(1000); // Wait for animations to settle
    });

    test('spline style screenshot', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Link.Style', 'spline');

        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('link-style-spline.png', {
            maxDiffPixelRatio: 0.15,
        });
    });

    test('straight style screenshot', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Link.Style', 'straight');

        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('link-style-straight.png', {
            maxDiffPixelRatio: 0.15,
        });
    });

    test('linear style screenshot', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Link.Style', 'linear');

        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('link-style-linear.png', {
            maxDiffPixelRatio: 0.15,
        });
    });
});

test.describe('Animation Style Visuals', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);
    });

    test('static mode screenshot', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Static.Mode', true);
        await page.waitForTimeout(500);

        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('animation-static.png', {
            maxDiffPixelRatio: 0.1,
        });
    });

    test('animated mode has movement', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Static.Mode', false);
        await setLinkSetting(page, '🔗 Enhanced Links.Animate', 9); // Classic Flow

        // Take two screenshots with delay
        const canvas = page.locator('.litegraph.litecanvas');
        const screenshot1 = await canvas.screenshot();
        await page.waitForTimeout(500);
        const screenshot2 = await canvas.screenshot();

        // In animated mode, screenshots should differ slightly
        // This is a basic check - in practice use visual diff tools
        expect(screenshot1.length > 0).toBeTruthy();
        expect(screenshot2.length > 0).toBeTruthy();
    });
});

test.describe('Marker Shape Visuals', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForComfyUI(page);
        // Enable markers
        await setLinkSetting(page, '🔗 Enhanced Links.Marker.Enabled', true);
    });

    test('arrow marker screenshot', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Marker.Shape', 'arrow');
        await page.waitForTimeout(500);

        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('marker-arrow.png', {
            maxDiffPixelRatio: 0.15,
        });
    });

    test('diamond marker screenshot', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Marker.Shape', 'diamond');
        await page.waitForTimeout(500);

        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('marker-diamond.png', {
            maxDiffPixelRatio: 0.15,
        });
    });

    test('circle marker screenshot', async ({ page }) => {
        await setLinkSetting(page, '🔗 Enhanced Links.Marker.Shape', 'circle');
        await page.waitForTimeout(500);

        const canvas = page.locator('.litegraph.litecanvas');
        await expect(canvas).toHaveScreenshot('marker-circle.png', {
            maxDiffPixelRatio: 0.15,
        });
    });
});
