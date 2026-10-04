import sys, os, asyncio
from playwright.async_api import async_playwright

FPS = 30
DUR = 45
OUT = os.path.join(os.path.dirname(__file__), "frames")


async def main(times=None):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                                    args=["--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto("file://" + os.path.abspath(os.path.join(os.path.dirname(__file__), "promo.html")))
        await pg.evaluate("document.fonts.ready")
        await pg.wait_for_timeout(800)
        if times:
            for t in times:
                await pg.evaluate(f"render({t})")
                await pg.screenshot(path=f"{OUT}/test_{t:05.1f}.png")
        else:
            for i in range(FPS * DUR):
                await pg.evaluate(f"render({i / FPS})")
                await pg.screenshot(path=f"{OUT}/f_{i:05d}.jpg", type="jpeg", quality=95)
        await b.close()

if __name__ == "__main__":
    ts = [float(x) for x in sys.argv[1:]] or None
    asyncio.run(main(ts))
