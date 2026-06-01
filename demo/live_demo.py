#!/usr/bin/env python3
"""
SecureLearning live demo (Playwright). Two content-manager flows:

  1. Create a module in the interactive builder, preview it, save it, then
     preview it again from the Modules listing.
  2. Build a course from that module, preview it, publish it.

Drag-and-drop is used only to add the module to the course (no click
alternative). Everything else is typed/clicked at a human pace.

    python demo/live_demo.py

Env: WEB_URL, CM_USER, CM_PASS, HEADLESS (1=hide), SLOWMO (ms/action),
TYPE_DELAY (ms/keystroke), PACE (pause multiplier).
"""

from __future__ import annotations

import os
import struct
import sys
import time
import zlib
from datetime import datetime
from pathlib import Path

from playwright.sync_api import Locator, Page, TimeoutError as PWTimeout, sync_playwright

WEB_URL = os.getenv("WEB_URL", "http://localhost:5173").rstrip("/")
CM_USER = os.getenv("CM_USER", "content_manager")
CM_PASS = os.getenv("CM_PASS", "admin")
HEADLESS = os.getenv("HEADLESS", "0") == "1"
SLOWMO = int(os.getenv("SLOWMO", "500"))
TYPE_DELAY = int(os.getenv("TYPE_DELAY", "30"))
PACE = float(os.getenv("PACE", "1.2"))

SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(exist_ok=True)

STAMP = datetime.now().strftime("%H%M%S")
MODULE_TITLE = f"Phishing Awareness (demo {STAMP})"
COURSE_TITLE = f"Security Essentials (demo {STAMP})"


def say(msg: str) -> None:
    print(f"\n> {msg}", flush=True)


def beat(seconds: float = 1.0) -> None:
    time.sleep(seconds * PACE)


def shot(page: Page, name: str) -> None:
    path = SHOTS / f"{STAMP}-{name}.png"
    page.screenshot(path=str(path))
    print(f"  shot: {path}", flush=True)


def type_into(loc: Locator, text: str) -> None:
    """Click and type character-by-character, like a person would."""
    loc.click()
    loc.press_sequentially(text, delay=TYPE_DELAY)


def make_png(path: Path, width: int = 640, height: int = 320,
             rgb: tuple[int, int, int] = (124, 58, 237)) -> Path:
    """Solid-colour PNG (app primary purple), pure stdlib."""
    r, g, b = rgb
    raw = bytearray()
    for _y in range(height):
        raw.append(0)
        raw.extend((r, g, b) * width)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", ihdr)
           + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + chunk(b"IEND", b""))
    path.write_bytes(png)
    return path


COVER_PNG = make_png(SHOTS / "_cover.png")


def login_content_manager(page: Page) -> None:
    """Sign in via Keycloak. /content-manager/* is an admin route, so it goes
    straight to the platform realm login (no email-entry step)."""
    say(f"Sign in as {CM_USER}")
    page.goto(f"{WEB_URL}/content-manager/modules", wait_until="domcontentloaded")

    page.wait_for_selector("#username", timeout=30_000)
    type_into(page.locator("#username"), CM_USER)
    type_into(page.locator("#password"), CM_PASS)
    beat(0.6)
    page.click("#kc-login")

    # Optional one-time profile form on first login.
    try:
        first_name = page.get_by_role("textbox", name="First name")
        first_name.wait_for(timeout=5_000)
        say("Complete profile form")
        type_into(page.get_by_role("textbox", name="Email"), f"{CM_USER}@platform.pt")
        type_into(first_name, "Content")
        type_into(page.get_by_role("textbox", name="Last name"), "Manager")
        page.get_by_role("button", name="Submit").click()
    except PWTimeout:
        pass

    # Key off the page's primary button (Keycloak appends a ?code query the
    # URL glob won't match).
    page.get_by_role("button", name="New Module").wait_for(timeout=30_000)
    beat()


def upload_cover(page: Page, title: str) -> None:
    say("Add cover image")
    page.get_by_role("button", name="Click to choose cover").click()

    upload_tab = page.get_by_role("button", name="Upload", exact=True)
    upload_tab.wait_for(timeout=15_000)
    upload_tab.click()

    # File input is sr-only; set_input_files works once it's attached.
    page.wait_for_selector("#cfp-file-input", state="attached", timeout=10_000)
    page.set_input_files("#cfp-file-input", str(COVER_PNG))
    type_into(page.locator("#cfp-title"), f"{title} cover")
    beat(0.6)
    page.get_by_role("button", name="Upload & Use").click()
    page.wait_for_selector("#cfp-file-input", state="detached", timeout=30_000)
    beat()


def create_module(page: Page) -> None:
    say("Flow 1 — create a module")
    page.get_by_role("button", name="New Module").click()
    page.wait_for_selector("#module-title", timeout=15_000)

    say("Fill module details")
    type_into(page.locator("#module-title"), MODULE_TITLE)
    page.select_option("#module-category", "Security")
    page.get_by_role("button", name="Medium", exact=True).click()
    type_into(page.locator("#module-duration"), "20 minutes")
    type_into(page.locator("#module-description"),
              "Spot phishing emails, recognise red flags, and report them safely.")
    beat()

    upload_cover(page, MODULE_TITLE)

    say("Add a section")
    page.get_by_role("button", name="Add Section").click()
    section_title = page.get_by_placeholder("Section title...")
    section_title.wait_for(timeout=10_000)
    type_into(section_title, "Recognising a phishing email")
    section_title.press("Enter")
    beat()

    say("Add a text block")
    page.get_by_role("button", name="Add block").first.click()
    page.get_by_role("menuitem", name="Text").click()
    body = page.get_by_placeholder("Write text with Markdown...")
    body.wait_for(timeout=10_000)
    type_into(body,
              "## Red flags\n\n"
              "- Urgent or threatening language\n"
              "- Mismatched sender domains\n"
              "- Unexpected attachments or links\n\n"
              "**When in doubt, report it.**")
    beat()

    say("Open preview")
    page.get_by_title("Preview Module").click()
    page.get_by_role("button", name="Close").wait_for(timeout=10_000)
    beat(2.0)
    shot(page, "module-preview")
    page.get_by_role("button", name="Close").click()
    beat()

    say("Save module")
    page.get_by_role("button", name="Save", exact=True).click()
    page.get_by_text("created successfully").wait_for(timeout=20_000)
    beat()

    say("Back to listing")
    page.get_by_role("button", name="Back to Modules").click()
    page.wait_for_url("**/content-manager/modules", timeout=15_000)
    beat()


def preview_module_from_listing(page: Page) -> None:
    say("Flow 1 — preview the module from the listing")
    heading = page.get_by_role("heading", name=MODULE_TITLE)
    heading.first.wait_for(timeout=20_000)

    card = page.locator("div.group").filter(has=heading)
    card.first.get_by_title("Preview").click()

    page.get_by_role("button", name="Close").wait_for(timeout=20_000)
    beat(2.0)
    shot(page, "module-preview-from-listing")
    page.get_by_role("button", name="Close").click()
    beat()


def drag(page: Page, source: Locator, target: Locator) -> None:
    """Pointer drag tuned for @dnd-kit (needs real intermediate moves)."""
    sb = source.bounding_box()
    tb = target.bounding_box()
    if not sb or not tb:
        raise RuntimeError("drag: source or target has no bounding box")

    sx, sy = sb["x"] + sb["width"] / 2, sb["y"] + sb["height"] / 2
    tx, ty = tb["x"] + tb["width"] / 2, tb["y"] + tb["height"] / 2

    page.mouse.move(sx, sy)
    page.mouse.down()
    steps = 25
    for i in range(1, steps + 1):
        page.mouse.move(sx + (tx - sx) * i / steps, sy + (ty - sy) * i / steps)
        page.wait_for_timeout(12)
    page.mouse.move(tx, ty)
    page.wait_for_timeout(150)
    page.mouse.up()
    page.mouse.move(10, 10)


def click_until_visible(page: Page, trigger: Locator, target: Locator, tries: int = 3) -> None:
    """Click trigger, wait for target; retry on animation flake."""
    for attempt in range(1, tries + 1):
        trigger.click()
        try:
            target.wait_for(timeout=6_000)
            return
        except PWTimeout:
            if attempt == tries:
                raise


def create_course(page: Page) -> None:
    say("Flow 2 — create a course")
    page.goto(f"{WEB_URL}/content-manager/courses", wait_until="domcontentloaded")
    page.get_by_role("link", name="New Course").click()
    page.wait_for_selector("#course-title", timeout=15_000)

    say("Fill course details")
    type_into(page.locator("#course-title"), COURSE_TITLE)
    page.select_option("#course-category", "Security")
    page.get_by_role("button", name="Easy", exact=True).click()
    type_into(page.locator("#course-description"),
              "A short onboarding course covering everyday security awareness.")
    beat()

    say("Drag the module into the course")
    type_into(page.get_by_placeholder("Search modules..."), MODULE_TITLE)
    source = page.get_by_text(MODULE_TITLE, exact=True).first
    source.wait_for(timeout=15_000)
    target = page.get_by_text("Drop modules here")
    target.wait_for(timeout=10_000)
    beat(0.8)
    drag(page, source, target)
    page.get_by_text("1 module added").wait_for(timeout=10_000)
    beat()

    say("Open course preview")
    click_until_visible(
        page,
        page.get_by_role("button", name="Preview"),
        page.get_by_role("heading", name="Course Preview"),
    )
    beat(2.0)
    shot(page, "course-preview")
    # Close is an icon-only button — anchor on the header.
    topbar = page.get_by_role("heading", name="Course Preview").locator(
        "xpath=ancestor::div[contains(@class,'justify-between')][1]")
    topbar.get_by_role("button").click()
    beat()

    say("Publish course")
    page.get_by_role("button", name="Publish").click()
    page.get_by_text("Course published").wait_for(timeout=20_000)
    page.wait_for_url("**/content-manager/courses", timeout=15_000)
    page.get_by_role("heading", name=COURSE_TITLE).first.wait_for(timeout=20_000)
    shot(page, "course-on-listing")
    beat()


def main() -> int:
    print(f"Target: {WEB_URL}")
    print(f"Module: {MODULE_TITLE}")
    print(f"Course: {COURSE_TITLE}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS, slow_mo=SLOWMO)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        page.set_default_timeout(20_000)

        try:
            login_content_manager(page)
            create_module(page)
            preview_module_from_listing(page)
            create_course(page)
            say("Done — both flows ran end to end.")
            beat(2.0)
        except (PWTimeout, Exception) as err:  # noqa: BLE001
            print(f"\nFailed: {err}", file=sys.stderr)
            shot(page, "FAILURE")
            return 1
        finally:
            context.close()
            browser.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
