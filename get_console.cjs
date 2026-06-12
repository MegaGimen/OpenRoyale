const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
    
    await page.goto('http://127.0.0.1:5174/');
    await page.waitForTimeout(3000);
    await browser.close();
})();
