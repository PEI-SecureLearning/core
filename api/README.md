# API

FastAPI backend for the SecureLearning platform. Handles campaigns, users, content management, compliance, and integrations with Keycloak, PostgreSQL, MongoDB, Garage (S3), and RabbitMQ.

## Structure

```
api/
├── src/
│   ├── core/               # Infrastructure layer
│   │   ├── settings.py     # All env config (pydantic-settings)
│   │   ├── db.py           # SQLModel engine + init_db()
│   │   ├── mongo.py        # Motor client + collection getters + serializers
│   │   ├── object_storage.py # Garage S3 operations (put, get, delete, presign)
│   │   ├── security.py     # JWT validation, RBAC (Roles, Resource, Scope)
│   │   └── dependencies.py # SessionDep, CurrentRealm typed deps
│   ├── models/             # Data layer (domain subpackages)
│   │   ├── campaign/       # table.py (SQLModel) + schemas.py (Pydantic)
│   │   ├── user/
│   │   ├── realm/
│   │   ├── compliance/
│   │   └── __init__.py     # Central re-exports (import order matters)
│   ├── routers/            # HTTP layer
│   │   ├── campaign.py
│   │   ├── content.py
│   │   ├── courses.py
│   │   ├── modules.py
│   │   ├── tracking.py
│   │   └── ...
│   ├── services/           # Business logic (domain subpackages)
│   │   ├── campaign/       # CampaignHandler, StatsHandler, EmailHandler
│   │   ├── content.py
│   │   ├── rabbit.py       # RabbitMQ publisher
│   │   └── ...
│   ├── tasks/              # Background jobs
│   │   ├── scheduler.py    # APScheduler campaign scheduler
│   │   └── tracking_consumer.py  # RabbitMQ tracking event consumer
│   └── main.py             # App factory, lifespan, router registration
├── test/                   # Pytest tests
├── pyproject.toml          # Dependencies (uv)
└── Dockerfile              # Multi-stage: base → dev → prod
```

## Setup

```sh
# Install dependencies
uv sync --group dev

# Run dev server (hot reload)
uv run fastapi dev src/main.py

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=src
```

Requires a `.env` file or environment variables. See `deployment/.env.dev.example` for reference.

## Architecture

Three-layer pattern per domain:

```
Router (routers/) → Service (services/) → Model/DB (models/ + core/)
```

- **Routers** define HTTP endpoints with `Roles` dependency for auth
- **Services** hold business logic as module-level singletons
- **Models** split into `table.py` (SQLModel ORM) + `schemas.py` (Pydantic DTOs) per domain subpackage

## Database Access

| Storage | Driver | Data |
|---------|--------|------|
| PostgreSQL | SQLModel (sync) | Campaigns, users, realms, compliance, sending profiles |
| MongoDB | Motor (async) | Templates, content, modules, courses |
| Garage (S3) | Boto3 (async via `asyncio.to_thread`) | File uploads, tenant logos |

## Authentication

JWT validation via Keycloak JWKS per-realm. Security middleware in `core/security.py`:

- `Roles(resource, scope)` — callable FastAPI dependency
- Resources: `ADMIN`, `ORG_MANAGER`, `CONTENT_MANAGER`
- Scopes: `VIEW`, `MANAGE`
- `CurrentRealm` — extracts tenant from JWT issuer

## API Routes

All routes prefixed with `/api`. OpenAPI docs at `/api/docs`.

| Tag | Prefix | Domain |
|-----|--------|--------|
| `campaigns` | `/api` | Phishing campaign CRUD + stats |
| `tracking` | `/api` | Email open/click tracking |
| `content` | `/api` | Content pieces + folders (MongoDB + Garage) |
| `templates` | `/api` | Email templates (MongoDB) |
| `modules` | `/api` | Learning modules |
| `courses` | `/api` | Course management |
| `compliance` | `/api` | Policy acceptance + quizzes |
| `org-manager` | `/api/org-manager` | Tenant admin operations |
| `realms` | `/api` | Keycloak realm management |
| `sending-profiles` | `/api` | SMTP sending profile config |
| `phishing-kits` | `/api` | Phishing kit bundles |
| `progress` | `/api` | User learning progress |

## Testing

```sh
uv run pytest                                    # All tests
uv run pytest test/test_course_endpoints.py      # Single file
```

- Coverage config in `pyproject.toml` — excludes `models/`, `core/`, `main.py`
- Reports: `htmlcov/` (HTML), `coverage.xml` (SonarQube)
