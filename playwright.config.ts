import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:8188', // ComfyUI default
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Uncomment to run ComfyUI before tests
    // webServer: {
    //   command: 'python main.py',
    //   cwd: '../../../',
    //   url: 'http://localhost:8188',
    //   reuseExistingServer: !process.env.CI,
    // },
});
