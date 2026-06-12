import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:5177')
        await page.wait_for_timeout(2000)
        
        # Click Blue Team Knight
        # Wait for the UI to be fully loaded
        await page.wait_for_selector('.card-btn', timeout=5000)
        
        # We can just click the first card btn in the right column
        await page.evaluate("""
            const btns = document.querySelectorAll('#blue-cards .card-btn');
            if(btns.length > 0) btns[0].click();
        """)
        
        # Red King Tower is at Vector2(9, 2) which means x=180, y=40
        # The game container is 360x640. 
        box = await page.locator('#game-container').bounding_box()
        
        # Click near the red king tower: x=box.width/2, y=60
        await page.mouse.click(box['x'] + box['width']/2, box['y'] + 60)
        
        # Wait 2 seconds for Knight to attack King Tower and trigger activation
        await page.wait_for_timeout(2000)
        await page.screenshot(path='test_game_activating.png')
        
        # Wait 8.5 more seconds for King to fully activate (total 10.5 seconds, activating takes 8 seconds)
        await page.wait_for_timeout(8500)
        await page.screenshot(path='test_game_awake.png')
        
        await browser.close()

asyncio.run(main())
