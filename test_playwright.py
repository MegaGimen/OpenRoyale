import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:5177')
        await page.wait_for_timeout(3000) # wait for assets to load and game to start
        await page.screenshot(path='test_game.png')
        await browser.close()

asyncio.run(main())
