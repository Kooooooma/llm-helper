const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const pathToExtension = path.resolve(__dirname, '..');
    const userDataDir = path.join(__dirname, 'test-user-data');

    console.log('Launching browser with extension...');
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`
        ]
    });

    const page = await context.newPage();

    console.log('Navigating to example page...');
    await page.goto('https://example.com');

    // Test 1: Verify Content Script Injection (initially disabled)
    console.log('Test 1: Verify picker is initially disabled');
    const isActiveInitial = await page.evaluate(() => window.__urlCollectorActive);
    if (isActiveInitial === false || isActiveInitial === undefined) {
        console.log('✅ Picker is initially disabled');
    } else {
        console.error('❌ Picker should be disabled but is active');
    }

    // Test 2: Check background service worker
    let backgroundWorker = null;
    for (const worker of context.serviceWorkers()) {
        if (worker.url().includes('background.js')) {
            backgroundWorker = worker;
            break;
        }
    }

    if (!backgroundWorker) {
        await page.waitForTimeout(1000);
        for (const worker of context.serviceWorkers()) {
            if (worker.url().includes('background.js')) {
                backgroundWorker = worker;
                break;
            }
        }
    }

    if (backgroundWorker) {
        console.log('✅ Background service worker is running');
    } else {
        console.error('❌ Background service worker not found');
    }

    console.log('\n-- Manual Test Instructions --');
    console.log('The browser is open. You can now manually test the extension:');
    console.log('1. Click the extension icon in the toolbar');
    console.log('2. Click the (+) button to capture the current page URL');
    console.log('3. Toggle "Link Picker" ON');
    console.log('4. Click the "More information..." link on the page');
    console.log('5. Verify the URL is captured (toast notification)');
    console.log('6. Click edit to verify modal height with scrollbar');
    console.log('\nBrowser will stay open for 120 seconds...');

    // Keep browser open for manual verification
    try {
        await page.waitForTimeout(120000);
    } catch {
        // Browser was closed manually — this is expected
        console.log('\nBrowser was closed.');
    }

    try {
        await context.close();
    } catch {
        // Already closed
    }
})();
