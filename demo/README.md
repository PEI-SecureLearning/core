# Demo drivers

Two Playwright (Python) scripts that drive a real browser end to end.

## 1. `live_demo.py` — content-manager flows

1. **Module creation** — interactive builder: metadata, cover upload, a section
   with a text block, in-editor Preview, save, then Preview again from the
   Modules listing.
2. **Course creation** — editor: metadata, drag the just-made module into the
   course, Course Preview, publish, then confirm it on the Courses listing.

Drag-and-drop is used only for adding a module to a course (the UI offers no
click alternative there). Everything else is clicks/typing.

## 2. `complete_course.py` — normal-user completion

Takes the latest `Security Essentials (demo …)` course created by `live_demo.py`
and drives it to completion as a seeded end user:

- **Setup (Keycloak/API, no UI):** gives the seeded learner (`alice.williams`)
  a known password + clears required actions + ensures group membership, and
  pre-accepts the mandatory compliance policy. Seeded users otherwise have a
  random temp password and an undeliverable `UPDATE_PASSWORD` email, so they
  can't log in as-is.
- **Phase 1 (as `org_manager`):** opens the assign wizard, picks the course,
  picks the learner's group, publishes — then force-ticks the assignment
  scheduler so the `SCHEDULED` enrollment becomes `ACTIVE` today.
- **Phase 2 (as the learner):** opens the assigned course from *My Courses*,
  enters the module, and completes the section → "Module Complete!".

## Prereqs

The full stack must be running (web on `:5173`, Keycloak on `:8080`):

```sh
cp deployment/.env.dev.example deployment/.env
cd deployment && docker compose -f docker-compose.dev.yml up -d
```

- `live_demo.py` only needs the stack up — `content_manager` / `admin` ships in
  the `platform` realm via `realm-export.json`.
- `complete_course.py` additionally needs the `ua` realm + seeded users from
  `populate.py` **and** at least one course from a prior `live_demo.py` run.

**One-time seeding gotcha:** `populate.py` logs in via password grant on the
`react-admin` client, which has Direct Access Grants disabled by default. Enable
it once (Keycloak admin → realm `platform` → clients → `react-admin` → toggle
*Direct access grants*), or via the admin REST API, then run `python populate.py`
from the repo root. The user-creation step also 500s on the `UPDATE_PASSWORD`
email (no real SMTP in dev) — that's expected; the Keycloak users are still
created, and `complete_course.py`'s setup phase fixes up the one learner it uses.

## 3. `play.py` — the playlist (recommended for a live walkthrough)

Queues all three flows and plays the **next one each time you press ENTER**, so
you can narrate between them. Flows 1–2 share one browser window (the content
manager stays logged in across the pause); flow 3 runs as org manager then
learner. The learner completes the very course you just built in this run.

```sh
./demo/run_play.sh             # headed, ENTER advances to the next flow
AUTO=1 ./demo/run_play.sh      # play everything with no pauses (smoke test)
```

Without the playlist, each script just runs its own flows back-to-back with no
stops.

## Run

One-liners (create the venv + browser on first run, check the app is up):

```sh
./demo/run_play.sh             # all flows, ENTER between each (recommended)
./demo/run.sh                  # content-manager flows only (headed)
./demo/run_complete.sh         # normal-user completion only (headed)
HEADLESS=1 ./demo/run.sh       # headless
./demo/run.sh --setup          # force-rebuild the venv/browser, then run
```

Or drive directly with the prepared venv:

```sh
demo/.venv/bin/python demo/live_demo.py
demo/.venv/bin/python demo/complete_course.py
```

Headed and paced for an audience by default. Screenshots land in
`demo/screenshots/`.

## Env vars

Common: `WEB_URL` (`http://localhost:5173`), `HEADLESS` (`0`), `SLOWMO` (`350` ms),
`PACE` (`1.2` s).

| Script               | Var            | Default               | Notes                          |
|----------------------|----------------|-----------------------|--------------------------------|
| `live_demo.py`       | `CM_USER`      | `content_manager`     | Platform-realm content manager |
|                      | `CM_PASS`      | `admin`               |                                |
| `complete_course.py` | `REALM`        | `ua`                  | Tenant realm                   |
|                      | `ORG_USER`     | `org_manager`         | Assigns the course (UI)        |
|                      | `ORG_PASS`     | `1234`                |                                |
|                      | `LEARNER_USER` | `alice.williams`      | Seeded user who completes it   |
|                      | `LEARNER_PASS` | `Demo1234!`           | Set by the setup phase         |
|                      | `LEARNER_GROUP`| `group-a`             | Group targeted in the wizard   |
|                      | `COURSE_PREFIX`| `Security Essentials (demo ` | Course title to match   |
