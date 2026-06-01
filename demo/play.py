#!/usr/bin/env python3
"""
SecureLearning — demo playlist.

Queues the demo flows and plays the next one each time you press ENTER, so you
can narrate between them during a live walkthrough. Reuses the flow functions
from live_demo.py and complete_course.py (no duplicated logic).

Queue:
  1. Content manager — create a module (+ preview it from the listing)
  2. Content manager — build a course from that module
  3. Normal user      — get assigned the course and complete it

Flows 1–2 share one browser window (the content manager stays logged in across
the ENTER pause). Flow 3 runs as the org manager (assign) then the learner.

Run:
    demo/.venv/bin/python demo/play.py        # headed, waits on ENTER
    AUTO=1 demo/.venv/bin/python demo/play.py # no pauses (smoke test)

Env: HEADLESS (0), SLOWMO (350 ms), plus everything live_demo.py /
complete_course.py accept (PACE, LEARNER_USER, COURSE_PREFIX, …).
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
    print(f"Course : {ld.COURSE_TITLE}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS, slow_mo=SLOWMO)
        state: dict = {}

        def flow_module() -> None:
            ctx = browser.new_context(viewport={"width": 1440, "height": 900})
            page = ctx.new_page()
            page.set_default_timeout(20_000)
            state["ctx"] = ctx
            ld.login_content_manager(page)
            ld.create_module(page)
            ld.preview_module_from_listing(page)
            state["page"] = page

        def flow_course() -> None:
            ld.create_course(state["page"])
            state["ctx"].close()  # done with the content-manager session

        def flow_complete() -> None:
            cc.ensure_learner_ready()
            cc.ensure_compliance_accepted()
            title = cc.find_target_course()       # the course we just built
            cc.assign_course_via_ui(browser, title)
            cc.force_scheduler_tick()
            cc.complete_course_via_ui(browser, title)

        queue = [
            ("Content manager — create a module (+ preview from listing)", flow_module),
            ("Content manager — build a course from that module", flow_course),
            ("Normal user — get assigned the course and complete it", flow_complete),
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
