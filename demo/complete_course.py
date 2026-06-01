#!/usr/bin/env python3
"""
SecureLearning normal-user completion demo (Playwright).

Takes the latest "Security Essentials (demo …)" course made by live_demo.py
and drives it to completion as a seeded end user:

  0. Setup (Keycloak/API, no UI): give the learner a known password, clear
     required actions, ensure group membership, pre-accept compliance.
  1. As org_manager: assign the course via the wizard, then force the
     scheduler so the assignment goes ACTIVE today.
  2. As the learner: open the course, enter the module, complete the section.

Prereqs: stack up, populate.py has seeded the `ua` realm + users, and
live_demo.py has created a course.

    demo/.venv/bin/python demo/complete_course.py

Env: WEB_URL, REALM, ORG_USER/ORG_PASS, LEARNER_USER/LEARNER_PASS,
LEARNER_GROUP, COURSE_PREFIX, HEADLESS, SLOWMO, TYPE_DELAY, PACE.
"""

from __future__ import annotations

import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from playwright.sync_api import Locator, Page, TimeoutError as PWTimeout, sync_playwright

WEB_URL = os.getenv("WEB_URL", "http://localhost:5173").rstrip("/")
API_URL = os.getenv("API_URL", "http://localhost:8000").rstrip("/")
KC_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080").rstrip("/")

REALM = os.getenv("REALM", "ua")
REALM_DOMAIN = os.getenv("REALM_DOMAIN", "ua.pt")

ADMIN_CLIENT = os.getenv("ADMIN_CLIENT", "SecureLearning-admin")
ADMIN_SECRET = os.getenv("CLIENT_SECRET", "your_very_secure_key_here")

ORG_USER = os.getenv("ORG_USER", "org_manager")
ORG_PASS = os.getenv("ORG_PASS", "1234")

LEARNER_USER = os.getenv("LEARNER_USER", "alice.williams")
LEARNER_PASS = os.getenv("LEARNER_PASS", "Demo1234!")
LEARNER_EMAIL = os.getenv("LEARNER_EMAIL", f"{LEARNER_USER}@{REALM_DOMAIN}")
LEARNER_GROUP = os.getenv("LEARNER_GROUP", "group-a")

COURSE_PREFIX = os.getenv("COURSE_PREFIX", "Security Essentials (demo ")

HEADLESS = os.getenv("HEADLESS", "0") == "1"
SLOWMO = int(os.getenv("SLOWMO", "500"))
TYPE_DELAY = int(os.getenv("TYPE_DELAY", "30"))
PACE = float(os.getenv("PACE", "1.2"))

SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(exist_ok=True)
STAMP = datetime.now().strftime("%H%M%S")


def say(msg: str) -> None:
    print(f"\n> {msg}", flush=True)


def beat(seconds: float = 1.0) -> None:
    time.sleep(seconds * PACE)


def shot(page: Page, name: str) -> None:
    path = SHOTS / f"{STAMP}-{name}.png"
    page.screenshot(path=str(path))
    print(f"  shot: {path}", flush=True)


def type_into(loc: Locator, text: str) -> None:
    loc.click()
    loc.press_sequentially(text, delay=TYPE_DELAY)


# ── Keycloak / API helpers (REST, no UI) ─────────────────────────────────────

def kc_admin_token() -> str:
    r = requests.post(
        f"{KC_URL}/realms/master/protocol/openid-connect/token",
        data={"grant_type": "client_credentials", "client_id": ADMIN_CLIENT,
              "client_secret": ADMIN_SECRET}, timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def _realm_token(user: str, pw: str) -> str:
    r = requests.post(
        f"{KC_URL}/realms/{REALM}/protocol/openid-connect/token",
        data={"grant_type": "password", "client_id": "react-app",
              "username": user, "password": pw}, timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def ensure_learner_ready() -> None:
    """Known password, no required actions, group membership. Idempotent."""
    say(f"Setup — prepare learner {LEARNER_USER}")
    at = kc_admin_token()
    h = {"Authorization": f"Bearer {at}", "Content-Type": "application/json"}

    users = requests.get(
        f"{KC_URL}/admin/realms/{REALM}/users",
        params={"username": LEARNER_USER, "exact": "true"}, headers=h, timeout=15,
    ).json()
    if not users:
        raise RuntimeError(f"User {LEARNER_USER} not found in realm {REALM}. Run populate.py?")
    uid = users[0]["id"]

    requests.put(f"{KC_URL}/admin/realms/{REALM}/users/{uid}", headers=h,
                 json={"requiredActions": [], "emailVerified": True, "enabled": True},
                 timeout=15).raise_for_status()
    requests.put(f"{KC_URL}/admin/realms/{REALM}/users/{uid}/reset-password", headers=h,
                 json={"type": "password", "value": LEARNER_PASS, "temporary": False},
                 timeout=15).raise_for_status()

    groups = requests.get(f"{KC_URL}/admin/realms/{REALM}/groups",
                          params={"search": LEARNER_GROUP}, headers=h, timeout=15).json()
    gid = next((g["id"] for g in groups if g["name"] == LEARNER_GROUP), None)
    if not gid:
        raise RuntimeError(f"Group {LEARNER_GROUP} not found in realm {REALM}.")
    requests.put(f"{KC_URL}/admin/realms/{REALM}/users/{uid}/groups/{gid}",
                 headers=h, timeout=15).raise_for_status()


def ensure_compliance_accepted() -> None:
    """End users hit a mandatory compliance modal that overlays the app.
    Pre-accept it for the learner. No-op if the realm has no policy."""
    say("Setup — pre-accept compliance")
    h = {"Authorization": f"Bearer {_realm_token(LEARNER_USER, LEARNER_PASS)}",
         "Content-Type": "application/json"}
    latest = requests.get(f"{API_URL}/api/compliance/latest", headers=h, timeout=15)
    if not latest.ok:
        return
    requests.post(f"{API_URL}/api/compliance/accept", headers=h,
                  json={"version": latest.json()["version"], "score": 9999}, timeout=15)


def find_target_course() -> str:
    """Title of the most recent COURSE_PREFIX course."""
    r = requests.get(f"{API_URL}/api/courses", params={"limit": 100},
                     headers={"Authorization": f"Bearer {_realm_token(ORG_USER, ORG_PASS)}"},
                     timeout=15)
    r.raise_for_status()
    matches = [c for c in r.json().get("items", [])
               if (c.get("title") or "").startswith(COURSE_PREFIX)]
    if not matches:
        raise RuntimeError(f"No course starting with {COURSE_PREFIX!r}. Run live_demo.py first.")
    matches.sort(key=lambda c: (c.get("created_at") or "", c.get("title") or ""))
    return matches[-1]["title"]


def force_scheduler_tick() -> None:
    """Flip SCHEDULED assignments past their start_date to ACTIVE."""
    r = requests.post(f"{API_URL}/api/courses/scheduler/force-tick", timeout=30)
    print(f"  scheduler tick: {r.status_code}", flush=True)


def fetch_module(module_id: str, token: str) -> dict:
    r = requests.get(f"{API_URL}/api/modules/{module_id}",
                     headers={"Authorization": f"Bearer {token}"}, timeout=15)
    r.raise_for_status()
    return r.json()


def correct_answer(q: dict) -> str:
    """The text/value a learner must give to pass a question."""
    if q.get("type") == "short_answer":
        return q.get("answer", "")
    for c in q.get("choices") or []:
        if c.get("is_correct"):
            return c.get("text", "")
    return "True"  # true_false fallback when no choices are stored


# ── Shared login (email-entry → Keycloak) ────────────────────────────────────

def login_realm_user(page: Page, kc_user: str, kc_pass: str, dest_path: str) -> None:
    page.goto(f"{WEB_URL}{dest_path}", wait_until="domcontentloaded")

    # Email-entry gate: any address in the realm domain resolves the realm.
    email_box = page.get_by_placeholder("name@company.com")
    try:
        email_box.wait_for(timeout=8_000)
        type_into(email_box, f"any@{REALM_DOMAIN}")
        email_box.press("Enter")
    except PWTimeout:
        pass

    page.wait_for_selector("#username", timeout=30_000)
    type_into(page.locator("#username"), kc_user)
    type_into(page.locator("#password"), kc_pass)
    beat(0.6)
    page.click("#kc-login")

    # Optional one-time profile form.
    try:
        fn = page.get_by_role("textbox", name="First name")
        fn.wait_for(timeout=4_000)
        type_into(page.get_by_role("textbox", name="Email"), f"{kc_user}@{REALM_DOMAIN}")
        type_into(fn, kc_user)
        type_into(page.get_by_role("textbox", name="Last name"), "User")
        page.get_by_role("button", name="Submit").click()
    except PWTimeout:
        pass


# ── Phase 1: assign (org_manager) ────────────────────────────────────────────

def assign_course_via_ui(browser, course_title: str) -> None:
    say(f"Phase 1 — assign '{course_title}' as {ORG_USER}")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.set_default_timeout(20_000)
    try:
        login_realm_user(page, ORG_USER, ORG_PASS, "/courses/assign")

        say("Step 1 — select the course")
        course = page.get_by_role("heading", name=course_title, exact=True)
        course.wait_for(timeout=30_000)
        course.click()
        beat()
        page.get_by_role("button", name="Continue").click()

        say(f"Step 2 — select group {LEARNER_GROUP}")
        group = page.get_by_text(LEARNER_GROUP, exact=True)
        group.wait_for(timeout=15_000)
        group.click()
        beat()
        page.get_by_role("button", name="Continue").click()

        say("Step 3 — publish the assignment")
        page.get_by_role("button", name="Complete").click()
        page.get_by_text("assigned successfully").wait_for(timeout=20_000)
        beat()
    finally:
        shot(page, "assigned")
        ctx.close()


# ── Phase 2: complete (learner) ──────────────────────────────────────────────

def _click_first_enabled(page: Page, name: str) -> None:
    """Click the first enabled button with this name (only the current,
    unlocked section's 'Complete Section' is enabled)."""
    btns = page.get_by_role("button", name=name)
    for i in range(btns.count()):
        if btns.nth(i).is_enabled():
            btns.nth(i).click()
            return
    btns.first.click()


def answer_and_complete_section(page: Page, section: dict) -> None:
    """Answer every question in the section correctly, then complete it.
    A section with questions stays locked until each is answered correctly."""
    for block in section.get("blocks", []):
        if block.get("kind") != "question":
            continue
        q = block["question"]
        ans = correct_answer(q)
        say(f"Answer: {(q.get('text') or '')[:60]}")
        if q.get("type") == "short_answer":
            type_into(page.get_by_placeholder("Your answer…"), ans)
            page.get_by_role("button", name="Check").first.click()
        else:
            page.get_by_role("button", name=ans, exact=True).first.click()
        beat(0.6)

    say("Complete the section")
    page.get_by_role("button", name="Complete Section").first.wait_for(timeout=15_000)
    beat(0.4)
    _click_first_enabled(page, "Complete Section")
    beat()


def complete_course_via_ui(browser, course_title: str) -> None:
    say(f"Phase 2 — complete '{course_title}' as {LEARNER_USER}")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.set_default_timeout(20_000)
    try:
        login_realm_user(page, LEARNER_USER, LEARNER_PASS, "/courses")

        say("Open the assigned course")
        card = page.get_by_role("heading", name=course_title, exact=True)
        card.wait_for(timeout=30_000)
        card.click()

        say("Enter the module")
        module_link = page.locator("a[href*='/modules/']").first
        module_link.wait_for(timeout=15_000)
        href = module_link.get_attribute("href") or ""
        module_id = href.rsplit("/modules/", 1)[-1]
        module_link.click()

        # Pull correct answers from the API so we click the right choices.
        module = fetch_module(module_id, _realm_token(LEARNER_USER, LEARNER_PASS))
        for section in module.get("sections", []):
            answer_and_complete_section(page, section)

        page.get_by_text("Module Complete!").wait_for(timeout=15_000)
        beat(2.0)
        shot(page, "module-complete")
    finally:
        ctx.close()


def main() -> int:
    print(f"Web    : {WEB_URL}")
    print(f"Realm  : {REALM}")
    print(f"Learner: {LEARNER_USER}")

    try:
        ensure_learner_ready()
        ensure_compliance_accepted()
        course_title = find_target_course()
        print(f"Course : {course_title}")
    except Exception as err:  # noqa: BLE001
        print(f"\nSetup failed: {err}", file=sys.stderr)
        return 1

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS, slow_mo=SLOWMO)
        try:
            assign_course_via_ui(browser, course_title)
            force_scheduler_tick()
            complete_course_via_ui(browser, course_title)
            say("Done — learner completed the assigned course.")
            beat(1.5)
        except (PWTimeout, Exception) as err:  # noqa: BLE001
            print(f"\nFailed: {err}", file=sys.stderr)
            return 1
        finally:
            browser.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
