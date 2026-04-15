# Deployment

Docker Compose orchestration for the SecureLearning platform. Contains both development and production stack configurations.

## Directory Structure

```
deployment/
├── docker-compose.yml          # Production stack (Nginx + TLS)
├── docker-compose.dev.yml      # Development stack (hot reload, exposed ports)
├── nginx.securelearning.conf   # Nginx config — securelearning.pt domain
├── nginx.mednat.conf           # Nginx config — mednat.ieeta.pt domain
├── scripts/                    # Utility scripts (TLS cert generation)
├── services/                   # Per-service init configs
│   ├── db/                     # PostgreSQL init SQL
│   ├── keycloak/               # Realm imports, themes, providers
│   ├── mongo/                  # MongoDB init script
│   ├── rabbitmq/               # Custom Dockerfile + user setup
│   └── garage/                 # Garage TOML config template
├── .env.dev.example            # Development env template
└── .env.prod.example           # Production env template
```

## Services

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| `db` | `sl-db-dev` | 5432 | PostgreSQL 18 — relational data + Keycloak DB |
| `mongo` | `sl-mongo-dev` | 27017 | MongoDB 4.4 — templates, content, modules |
| `keycloak` | `sl-keycloak-dev` | 8080 | Identity provider, multi-tenant RBAC |
| `rabbitmq` | `sl-rabbitmq-dev` | 5672 / 15672 | Message broker (email + tracking queues) |
| `garage` | `sl-garage-dev` | 3900 | S3-compatible object storage |
| `api` | `sl-api-dev` | 8000 | FastAPI backend |
| `frontend` | `sl-frontend-dev` | 5173 | React dev server (Vite) |
| `smtp` | `sl-smtp-dev` | — | RabbitMQ email consumer (no exposed port) |

## Quick Start

### Development

```sh
cp .env.dev.example .env
docker compose -f docker-compose.dev.yml up -d
```

Frontend: `http://localhost:5173` · API docs: `http://localhost:8000/api/docs` · Keycloak: `http://localhost:8080`

### Production

```sh
cp .env.prod.example .env
# Edit .env with production values (strong passwords, real domains)
docker compose up -d --build
```

## Environment Configuration

Copy the matching example file to `.env` before starting. Key variable groups:

| Group | Key Variables |
|-------|--------------|
| Database | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| MongoDB | `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`, `MONGO_DB` |
| Keycloak | `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`, `CLIENT_SECRET` |
| RabbitMQ | `RABBITMQ_DEFAULT_USER`, `RABBITMQ_API_USER`, `RABBITMQ_SMTP_USER` |
| Garage | `GARAGE_ACCESS_KEY_ID`, `GARAGE_SECRET_ACCESS_KEY` |
| URLs | `API_URL`, `WEB_URL`, `KC_HOSTNAME_URL` |

> **Never use default passwords in production.**

## Nginx

Two Nginx configs route traffic in production:

```
/         → Frontend (static SPA)
/api/*    → API (FastAPI)
/kc/*     → Keycloak
```

Features: TLS termination, gzip, rate limiting (10 req/s/IP), security headers, SPA fallback to `index.html`.

## Common Commands

```sh
docker compose -f docker-compose.dev.yml logs -f api    # Follow API logs
docker compose -f docker-compose.dev.yml ps              # Service status
docker compose -f docker-compose.dev.yml restart api     # Restart single service
docker compose -f docker-compose.dev.yml down -v         # Stop + remove volumes
docker compose exec db psql -U myuser -d mydatabase      # DB shell
```

## Health Checks

All services have Docker health checks configured:

| Service | Method |
|---------|--------|
| API | `curl -sf http://localhost:8000/health` |
| PostgreSQL | `pg_isready` |
| Keycloak | TCP `/health/ready` on port 9000 |
| RabbitMQ | `rabbitmq-diagnostics -q ping` |
| MongoDB | `mongo --eval "db.adminCommand('ping')"` |
| Garage | `/garage status` |
