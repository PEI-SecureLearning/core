# CLAUDE.md — SecureLearning

> Codebase context for AI coding assistants. Don't delete this file.

## Project Overview

Multi-tenant cybersecurity awareness platform. Three services:

- **`api/`** — FastAPI backend (Python 3.12, SQLModel, Motor, uv)
- **`web/`** — React 19 SPA (Vite 7, TanStack Router, Tailwind v4, shadcn/ui)
- **`smtp/`** — RabbitMQ email worker (Pika, pydantic-settings)
- **`deployment/`** — Docker Compose, Nginx, env templates

Infrastructure: PostgreSQL 18, MongoDB 4.4, Keycloak 26.4, RabbitMQ, Garage (S3), Nginx.

---

## Key Commands

```sh
# API
cd api && uv run pytest                       # Tests

# Web
cd web && npm run lint                        # ESLint
cd web && npm run build                       # Type check + build
cd web && npx shadcn@latest add <name>        # Add UI component

# Full stack
cp deployment/.env.dev.example deployment/.env
cd deployment && docker compose -f docker-compose.dev.yml up -d
```

---

## Architecture

```
Router (routers/) → Service (services/) → Model/DB (models/ + core/)
```

- **Routers** — HTTP concerns, status codes, `Roles` dep for auth
- **Services** — Business logic, module-level singletons
- **Models** — `table.py` (SQLModel) + `schemas.py` (Pydantic) per domain subpackage

### Dual-Database Pattern

| Data | Storage | Reason |
|------|---------|--------|
| Campaigns, users, realms, compliance | PostgreSQL | Relational integrity |
| Templates, content, modules, courses | MongoDB | Flexible schema, nested docs |
| File uploads | Garage (S3) | Binary blobs + presigned URLs |

### Message Queue

```
API → RabbitMQ (email_queue) → SMTP Worker → SMTP Server
                                    ↓
                            RabbitMQ (tracking_queue) → API (tracking consumer)
```

### Multi-Tenant Isolation

Each tenant = Keycloak realm. `realm_name` scopes all data. `CurrentRealm` dep extracts realm from JWT issuer. Three roles: `ADMIN`, `ORG_MANAGER`, `CONTENT_MANAGER`. Two scopes: `VIEW`, `MANAGE`.

---

## Coding Standards

### Python (API & SMTP)

- **Indent:** 2 spaces
- **Imports:** stdlib → third-party → local (`src.` prefix). Relative imports within model subpackages.
- **Types:** `Annotated`, `Optional`, `TYPE_CHECKING` for forward refs
- **Enums:** Inherit `StrEnum`
- **Strings:** f-strings only
- **Errors:** `HTTPException` with specific status + detail in routers
- **Async:** MongoDB + object storage async. PostgreSQL sync (SQLModel sessions).

### TypeScript/React (Web)

- **Indent:** 2 spaces
- **Semicolons:** Always
- **Quotes:** Double quotes
- **Components:** Functional + hooks only
- **CSS:** Tailwind utilities. **Never** hardcode hex — use theme vars (`text-primary`, not `text-purple-600`)
- **Null:** `| null` or `?` optional

---

## Naming Conventions

### Python

| Element | Convention | Example |
|---------|------------|---------|
| Files | `snake_case` | `sending_profile.py` |
| Classes | `PascalCase` | `CampaignService` |
| Tables | `PascalCase` singular | `Campaign`, `UserGroup` |
| Schemas | `PascalCase` + suffix (`Create`, `Update`, `Out`, `DisplayInfo`, `Response`) | `CampaignCreate` |
| Link tables | `PascalCase` + `Link` | `CampaignUserGroupLink` |
| Router var | Always `router = APIRouter()` | — |
| Service | Module-level singleton | `service = CampaignService()` |

### TypeScript

| Element | Convention | Example |
|---------|------------|---------|
| Components | `PascalCase.tsx` or `kebab-case.tsx` | `WelcomePage.tsx` |
| Routes | `kebab-case.tsx` | `compliance-org-manager.tsx` |
| Services | `camelCase` + `Api` | `campaignsApi.ts` |
| Hooks | `use` prefix | `useDebounce.ts` |
| Feature dirs | `kebab-case` | `phishing-kits/` |
| `ui/` dir | Reserved for shadcn/ui | Never put custom components here |

### API Routes

- Paths: `kebab-case`, plural (`/api/campaigns`, `/api/sending-profiles`)
- Params: `snake_case` (`campaign_id`)
- Prefix: always `/api`
- Tags: `kebab-case`, plural (`tags=["sending-profiles"]`)

---

## Common Tasks

### Add API endpoint

1. Schema in `api/src/models/<domain>/schemas.py`
2. Export from `api/src/models/<domain>/__init__.py` + `api/src/models/__init__.py`
3. Logic in `api/src/services/<domain>/`
4. Route in `api/src/routers/<domain>.py` with `Roles` dep
5. Register router in `api/src/main.py` if new module

### Add frontend page

1. Route file in `web/src/routes/<name>.tsx` (auto-generates route tree)
2. Component in `web/src/Pages/` or `web/src/components/<feature>/`
3. Nav entry in `web/src/config/navLinks.ts`
4. Test all 5 themes. No hardcoded colors.

---

## Gotchas

- **Model import order matters.** `models/__init__.py` has specific order for SQLModel relationships. Link tables first.
- **Dual Keycloak URLs.** `KEYCLOAK_URL` (internal) vs `KEYCLOAK_ISSUER_URL` (public) differ in containers.
- **MongoDB `_id` → `id`.** All docs go through `serialize_*` fns.
- **RabbitMQ separate users.** API uses `RABBITMQ_API_USER`, SMTP uses `RABBITMQ_SMTP_USER`.
- **Garage dual client.** Internal endpoint for writes, public for presigned URLs.
- **`Pages/` is PascalCase**, feature dirs kebab-case. Intentional.
- **`routeTree.gen.ts` auto-generated.** Never edit manually.
- **SMTP worker blocking pika.** Single-threaded, auto-reconnect loop.
- **Report module** at `api/src/services/reports/`. Pipeline: `ReportBuilder → ReportSpec → ReportService → collectors → HTML sections → ReportRenderer → PdfConverter (WeasyPrint)`. Public API: `report_service.generate(spec, session)` → PDF bytes; `report_service.render_html(spec, session)` → HTML string. No HTTP endpoint yet. System deps: `pango cairo fontconfig ttf-dejavu` (Dockerfile). Full detail in `CONTEXT.md`.
- **Risk collector is stub.** `collectors/risk.py` returns zeros. K/S/E not integrated.
- **Report `__init__.py` eager-imports** keycloak + Settings. Anything loading the module outside a live env must use importlib to bypass — see `CONTEXT.md` bootstrap section.