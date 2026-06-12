import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:5177')
        await page.wait_for_timeout(3000)
        
        # Check PIXI canvas bounds and force a solid background
        await page.evaluate("""
            const canvas = document.querySelector('canvas');
            if(canvas) {
                canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            }
            
            // Log entity divs z-indexes
            const divs = document.querySelectorAll('.entity');
            console.log('Found ' + divs.length + ' entities');
            divs.forEach(d => {
                d.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
            });
        """)
        
        await page.wait_for_timeout(500)
        await page.screenshot(path='test_game2.png')
        await browser.close()

asyncio.run(main())
