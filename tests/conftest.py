import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))


def _free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def _serve(directory):
    port = _free_port()
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "-d", str(directory)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(50):
        try:
            socket.create_connection(("127.0.0.1", port), timeout=0.2).close()
            break
        except OSError:
            time.sleep(0.1)
    return proc, f"http://127.0.0.1:{port}/"


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture(scope="session")
def site():
    """site() serves the committed repo root. site(products_path) builds that
    products file against index.template.html into a temp dir and serves it."""
    procs, dirs = [], []

    def make(products_path=None):
        if products_path is None:
            directory = ROOT
        else:
            import build  # tools/build.py

            directory = Path(tempfile.mkdtemp(prefix="tigris-site-"))
            dirs.append(directory)
            for f in ROOT.glob("*.svg"):
                shutil.copy(f, directory / f.name)
            assets = directory / "assets"
            assets.mkdir(exist_ok=True)
            from PIL import Image

            Image.new("RGB", (2, 2), (16, 15, 13)).save(assets / "praix-screen.png")
            html = build.build(Path(products_path), ROOT / "index.template.html")
            (directory / "index.html").write_text(html, encoding="utf-8", newline="\n")
        proc, url = _serve(directory)
        procs.append(proc)
        return url

    yield make
    for p in procs:
        p.terminate()
    for d in dirs:
        shutil.rmtree(d, ignore_errors=True)


def open_page(browser, url, w=1440, h=900):
    page = browser.new_page(viewport={"width": w, "height": h})
    page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.goto(url)
    page.wait_for_function("() => window.__tigris && window.__tigris.strataEls")
    page.wait_for_timeout(600)  # fonts + first paint
    return page


def goto(page, depth):
    page.evaluate(
        """d => { const a = window.__tigris;
        a.target = d; a.depth = d; a.clamp(); a.lastDrawn = -999; a.frame(); }""",
        depth,
    )
    page.wait_for_timeout(250)


def probe(page, expr):
    return page.evaluate(f"() => {{ const a = window.__tigris; return ({expr}); }}")
