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
import re
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
OM_USER = os.getenv("OM_USER", "org_manager@ua.pt")
OM_PASS = os.getenv("OM_PASS", "1234")
HEADLESS = os.getenv("HEADLESS", "0") == "1"
SLOWMO = int(os.getenv("SLOWMO", "500"))
TYPE_DELAY = int(os.getenv("TYPE_DELAY", "30"))
PACE = float(os.getenv("PACE", "1.2"))

SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(exist_ok=True)

STAMP = datetime.now().strftime("%H%M%S")
MODULE_TITLE = f"Mastering MFA (demo {STAMP})"
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

    say("Importing rich module definition via prompt guide JSON...")
    # Click on the Import/Export button
    page.get_by_title("Import / Export JSON").click()
    
    # Wait for the storage modal import text area to appear
    textarea = page.get_by_placeholder("Paste module JSON here...")
    textarea.wait_for(state="visible", timeout=10_000)
    
    # Construct our rich and detailed JSON payload using ROBOTS.md prompt guide format
    import json
    mfa_module_data = {
      "title": MODULE_TITLE,
      "category": "Password Security",
      "description": "Learn why passwords aren't enough and how to use MFA effectively.",
      "estimatedTime": "10 minutes",
      "difficulty": "Medium",
      "sections": [
        {
          "id": "764b85c1-1e23-4e4b-b0f1-e3d8f36c5b91",
          "title": "What is MFA?",
          "blocks": [
            {
              "id": "d93b1d72-8f1a-4c28-9d4e-1a2b3c4d5e6f",
              "kind": "text",
              "content": "# Multi-Factor Authentication\n\nMFA adds a **second layer of security** to your accounts.\n\n### The Three Factors:\n1. **Something you know** (Password)\n2. **Something you have** (Phone app, security key)\n3. **Something you are** (Fingerprint, face scan)"
            },
            {
              "id": "e82c2a83-9a2b-4d3c-9e5f-1a2b3c4d5e6f",
              "kind": "question",
              "question": {
                "id": "f93d3b94-0b3c-4e4d-9f6a-1a2b3c4d5e6f",
                "type": "multiple_choice",
                "text": "Which of these is an example of 'Something you have'?",
                "choices": [
                  { "id": "a1b2c3d4", "text": "Your mother's maiden name", "isCorrect": False, "is_correct": False },
                  { "id": "b2c3d4e5", "text": "A hardware security key (YubiKey)", "isCorrect": True, "is_correct": True },
                  { "id": "c3d4e5f6", "text": "Your 8-character password", "isCorrect": False, "is_correct": False }
                ],
                "answer": ""
              }
            },
            {
              "id": "a93b1d72-8f1a-4c28-9d4e-1a2b3c4d5e7a",
              "kind": "question",
              "question": {
                "id": "b93d3b94-0b3c-4e4d-9f6a-1a2b3c4d5e7b",
                "type": "multiple_choice",
                "text": "MFA completely eliminates all risks of account takeover.",
                "choices": [
                  { "id": "tf-t", "text": "True", "isCorrect": False, "is_correct": False },
                  { "id": "tf-f", "text": "False", "isCorrect": True, "is_correct": True }
                ],
                "answer": ""
              }
            },
            {
              "id": "c93b1d72-8f1a-4c28-9d4e-1a2b3c4d5e7c",
              "kind": "question",
              "question": {
                "id": "d93d3b94-0b3c-4e4d-9f6a-1a2b3c4d5e7d",
                "type": "short_answer",
                "text": "What is the acronym for Multi-Factor Authentication?",
                "choices": [],
                "answer": "MFA"
              }
            }
          ]
        }
      ]
    }
    
    # Fill the textarea with the JSON content and perform the import
    textarea.fill(json.dumps(mfa_module_data, indent=2))
    beat(0.8)
    page.get_by_role("button", name="Import from Clipboard").click()
    
    # Wait for modal to close and the detail view to update
    page.wait_for_selector("input[id='module-title']", timeout=10_000)
    beat()

    upload_cover(page, MODULE_TITLE)
    beat()

    say("Open preview to verify loaded JSON layout")
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
    page.wait_for_timeout(500)  # Wait for @dnd-kit drag delay activation constraint
    steps = 5
    for i in range(1, steps + 1):
        page.mouse.move(sx + (tx - sx) * i / steps, sy + (ty - sy) * i / steps)
        page.wait_for_timeout(20)
    page.mouse.move(tx, ty)
    page.wait_for_timeout(500)  # Wait at the destination before mouse up
    page.mouse.up()
    page.mouse.move(10, 10)
    beat(0.5)


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
    source = page.locator("div.cursor-grab").filter(has_text=MODULE_TITLE).first
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


def click_when_ready(loc: Locator, timeout_ms: int = 15_000) -> None:
    loc.wait_for(state="visible", timeout=timeout_ms)
    beat(0.3)
    loc.click()


def login_org_manager(page: Page) -> None:
    """Sign in as Org Manager starting from the email gateway."""
    say(f"Sign in as Org Manager: {OM_USER}")
    page.goto(f"{WEB_URL}/", wait_until="domcontentloaded")
    
    email_box = page.get_by_role("textbox", name="name@company.com")
    email_box.wait_for(state="visible", timeout=15_000)
    type_into(email_box, OM_USER)
    beat(0.4)
    page.get_by_role("button").click()
    
    username_box = page.get_by_role("textbox", name="Username or email")
    username_box.wait_for(state="visible", timeout=15_000)
    type_into(username_box, "org_manager")
    
    password_box = page.get_by_role("textbox", name="Password")
    type_into(password_box, OM_PASS)
    beat(0.4)
    page.get_by_role("button", name="Sign In").click()
    
    page.get_by_role("link", name="Phishing Kits").wait_for(state="visible", timeout=30_000)
    beat()


def create_phishing_kit(page: Page) -> None:
    say("Flow 3 — create a Phishing Kit")
    click_when_ready(page.get_by_role("link", name="Phishing Kits"))
    click_when_ready(page.get_by_role("button", name="Create First Kit"))
    
    kit_name = page.get_by_role("textbox", name="Kit Name * More information")
    kit_name.wait_for(state="visible", timeout=15_000)
    type_into(kit_name, "PEI presentation")
    
    kit_desc = page.get_by_role("textbox", name="Description More information")
    type_into(kit_desc, "Phishing kit for pei presentation")
    beat(0.4)
    page.get_by_role("button", name="Continue").click()
    
    click_when_ready(page.get_by_role("button", name="Lancamento das notas Email"))
    page.get_by_role("button", name="Continue").click()
    
    idp_page_btn = page.get_by_role("button", name=re.compile(r"thumb-.* Preview IDP UA IDP UA page\."))
    click_when_ready(idp_page_btn)
    page.get_by_role("button", name="Continue").click()
    
    click_when_ready(page.get_by_role("combobox", name="Search profiles by name or"))
    click_when_ready(page.get_by_role("button", name="Marketing SMTP marketing@ua."))
    
    page.get_by_role("button", name="Complete").click()
    page.get_by_text("PEI presentation").wait_for(state="visible", timeout=15_000)
    shot(page, "phishing-kit-created")
    
    click_when_ready(page.get_by_role("button", name="Back to Phishing Kits"))
    beat()


def create_phishing_campaign(page: Page) -> None:
    say("Flow 4 — create a Phishing Campaign")
    click_when_ready(page.get_by_role("link", name="Campaigns"))
    click_when_ready(page.get_by_role("link", name="New Campaign"))
    
    camp_name = page.get_by_role("textbox", name="Campaign Name *")
    camp_name.wait_for(state="visible", timeout=15_000)
    type_into(camp_name, "Pei presentation")
    page.get_by_role("button", name="Next").click()
    
    click_when_ready(page.get_by_role("combobox", name="Search groups..."))
    click_when_ready(page.get_by_role("button", name="PEI /PEI"))
    page.get_by_role("button", name="Next").click()
    
    click_when_ready(page.get_by_role("combobox", name="Search phishing kits by name"))
    click_when_ready(page.get_by_role("button", name="PEI presentation Phishing kit"))
    page.get_by_role("button", name="Next").click()
    
    click_when_ready(page.get_by_role("combobox", name="Search profiles by name or"))
    click_when_ready(page.get_by_role("button", name="Marketing SMTP marketing@ua."))
    page.get_by_role("button", name="Next").click()
    
    page.get_by_role("button", name="Complete").click()
    
    campaign_row = page.get_by_role("row", name=re.compile(r"Pei presentation Scheduled.*"))
    campaign_row.wait_for(state="visible", timeout=15_000)
    campaign_row.get_by_label("Campaign options").click()
    
    click_when_ready(page.get_by_role("link", name="View Details"))
    page.get_by_role("heading", name="Pei presentation").wait_for(state="visible", timeout=15_000)
    shot(page, "campaign-details")
    beat(5.0)  # Increased observation time when showing the campaign details


def assign_course(page: Page) -> None:
    say("Flow 5 — assign course to groups")
    click_when_ready(page.get_by_role("button", name="Learning"))
    click_when_ready(page.get_by_role("link", name="Manage Courses"))
    click_when_ready(page.get_by_role("link", name="Assign Courses"))
    click_when_ready(page.get_by_role("button", name="Continue"))
    
    click_when_ready(page.locator(".w-full.h-full.flex.items-center.justify-center").first)
    page.get_by_role("button", name="Continue").click()
    
    click_when_ready(page.get_by_text("5 members"))
    click_when_ready(page.locator("div").filter(has_text=re.compile(r"^group-a2 members$")).first)
    page.get_by_role("button", name="Continue").click()
    
    page.get_by_role("button", name="Complete").click()
    page.get_by_text("assigned successfully").wait_for(state="visible", timeout=15_000)
    shot(page, "course-assigned")
    beat()


def main() -> int:
    print(f"Target: {WEB_URL}")
    print(f"Module: {MODULE_TITLE}")
    print(f"Course: {COURSE_TITLE}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS, slow_mo=SLOWMO, args=["--start-maximized"])
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()
        page.set_default_timeout(20_000)

        try:
            # --- CONTENT MANAGER FLOWS ---
            login_content_manager(page)
            create_module(page)
            preview_module_from_listing(page)
            create_course(page)
            
            # Close CM context to keep auth completely clean and isolated
            context.close()
            
            # --- ORG MANAGER FLOWS ---
            say("Switching to Org Manager flows...")
            context = browser.new_context(viewport=None)
            page = context.new_page()
            page.set_default_timeout(20_000)
            
            login_org_manager(page)
            create_phishing_kit(page)
            create_phishing_campaign(page)
            assign_course(page)
            
            say("Done — all flows ran end to end successfully.")
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
