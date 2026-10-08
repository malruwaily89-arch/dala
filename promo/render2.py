"""Render frames of an HTML timeline page: render2.py <html> <hash> <outdir> <start_s> <end_s> [test t1 t2 ...]"""
import sys, os, asyncio
from playwright.async_api import async_playwright

FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))


async def main(html, h, outdir, t0, t1, tests):
    os.makedirs(outdir, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                                    args=["--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": 1080, "height": 1920})
        await pg.goto(f"file://{HERE}/{html}#{h}")
        await pg.evaluate("document.fonts.ready")
        await pg.wait_for_timeout(800)
        if tests:
            for t in tests:
                await pg.evaluate(f"render({t})")
                await pg.screenshot(path=f"{outdir}/test_{h}_{t:05.1f}.png")
        else:
            for i in range(int(t0 * FPS), int(t1 * FPS)):
                await pg.evaluate(f"render({i / FPS})")
                await pg.screenshot(path=f"{outdir}/f_{i:05d}.jpg", type="jpeg", quality=95)
        await b.close()

if __name__ == "__main__":
    a = sys.argv
    tests = [float(x) for x in a[6:]] if len(a) > 6 else None
    asyncio.run(main(a[1], a[2], a[3], float(a[4]), float(a[5]), tests))
