#!/usr/bin/env python3
"""
SecureLearning — demo playlist.

Queues every demo flow and plays the next one each time you press ENTER, so you
can narrate between them during a live walkthrough. Reuses the flow functions
from live_demo.py and complete_course.py (no duplicated logic).

Queue:
  1. Content manager — create a module (+ preview it from the listing)
  2. Content manager — build a course from that module
  3. Org manager      — create a phishing kit
  4. Org manager      — create a phishing campaign
  5. Org manager      — assign the course to the learner's group
  6. Normal user      — complete the assigned course

Each actor gets its own browser context (content manager, then org manager,
then learner), kept open across the ENTER pauses within that actor's flows.

Run:
    demo/.venv/bin/python demo/play.py        # headed, waits on ENTER
    AUTO=1 demo/.venv/bin/python demo/play.py # no pauses (smoke test)

Env: HEADLESS (0), SLOWMO (500 ms), plus everything live_demo.py /
complete_course.py accept (PACE, LEARNER_USER, COURSE_PREFIX, …).

Note: the phishing kit/campaign flows expect a freshly-seeded realm (they use
the empty-state buttons and fixed names), so run this once per clean seed.
"""

from __future__ import annotations

import os
import sys

from playwright.sync_api import sync_playwright

import live_demo as ld
import complete_course as cc

HEADLESS = os.getenv("HEADLESS", "0") == "1"
SLOWMO = int(os.getenv("SLOWMO", "500"))
AUTO = os.getenv("AUTO", "0") == "1"

COURSE_TITLE = ld.COURSE_TITLE  # the course built in flow 2, assigned/completed later


def gate(idx: int, total: int, label: str) -> None:
    """Show the queue position and wait for ENTER (q to quit)."""
    print(f"\n-- [{idx}/{total}] Next: {label}", flush=True)
    if AUTO or not sys.stdin.isatty():
        print("   (auto)", flush=True)
        return
    try:
        if input("   Press ENTER to play  ·  q then ENTER to quit: ").strip().lower() == "q":
            raise SystemExit(0)
    except EOFError:
        pass


def main() -> int:
    print(f"Playlist target: {ld.WEB_URL}")
    print(f"Module : {ld.MODULE_TITLE}")
    print(f"Course : {COURSE_TITLE}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS, slow_mo=SLOWMO)
        state: dict = {}

        def open_ctx(key: str):
            ctx = browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
            page = ctx.new_page()
            page.set_default_timeout(20_000)
            state[key] = ctx
            return page

        # ── Content manager ──────────────────────────────────────────────────
        def flow_module() -> None:
            page = open_ctx("cm")
            ld.login_content_manager(page)
            ld.create_module(page)
            ld.preview_module_from_listing(page)
            state["cm_page"] = page

        def flow_course() -> None:
            ld.create_course(state["cm_page"])
            state["cm"].close()  # done with the content-manager session

        # ── Org manager ──────────────────────────────────────────────────────
        def flow_kit() -> None:
            page = open_ctx("om")
            ld.login_org_manager(page)
            ld.create_phishing_kit(page)
            state["om_page"] = page

        def flow_campaign() -> None:
            ld.create_phishing_campaign(state["om_page"])
            state["om"].close()  # done with this org-manager session

        def flow_assign() -> None:
            # complete_course handles learner prep + a robust, course-specific
            # assign (its own org-manager context), then activates it.
            cc.ensure_learner_ready()
            cc.ensure_compliance_accepted()
            cc.assign_course_via_ui(browser, COURSE_TITLE)
            cc.force_scheduler_tick()

        # ── Learner ──────────────────────────────────────────────────────────
        def flow_complete() -> None:
            cc.complete_course_via_ui(browser, COURSE_TITLE)

        queue = [
            ("Content manager — create a module (+ preview from listing)", flow_module),
            ("Content manager — build a course from that module", flow_course),
            ("Org manager — create a phishing kit", flow_kit),
            ("Org manager — create a phishing campaign", flow_campaign),
            ("Org manager — assign the course to the learner's group", flow_assign),
            ("Normal user — complete the assigned course", flow_complete),
        ]

        try:
            for i, (label, fn) in enumerate(queue, 1):
                gate(i, len(queue), label)
                fn()
            print("\nPlaylist finished — all flows played.")
        except (Exception, KeyboardInterrupt) as err:  # noqa: BLE001
            print(f"\nStopped: {err}", file=sys.stderr)
            return 1
        finally:
            browser.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
