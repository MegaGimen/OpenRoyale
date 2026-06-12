import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:5177')
        await page.wait_for_timeout(2000)
        
        # Click on Knight card (index 0 for red team)
        await page.click('#red-cards .card-btn:nth-child(1)')
        
        # Click on the arena near the bridge
        # The game container is 360x640. 
        # Click coordinates relative to the container. Let's find the container.
        box = await page.locator('#game-container').bounding_box()
        
        # Click at x=box.width/2, y=box.height/4 (red side, near bridge)
        await page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/4)
        
        # Wait 4 seconds for the Knight to walk to the bridge
        await page.wait_for_timeout(4000)
        
        await page.screenshot(path='test_game3.png')
        await browser.close()

asyncio.run(main())
