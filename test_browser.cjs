const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('http://localhost:5174');
    await new Promise(r => setTimeout(r, 5000));
    
    await page.screenshot({ path: '/home/ClashRoyale/screenshot.png' });
    console.log("Screenshot saved!");
    
    await browser.close();
})();
