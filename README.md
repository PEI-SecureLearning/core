<a id="readme-top"></a>

<br />
<div align="center">
  <a href="https://github.com/PEI-SecureLearning/core">
    <img src="./web/public/Hatlogo.png" alt="SecureLearning" height="200" width="200">
  </a>
  <h3 align="center">SecureLearning</h3>

  <p align="center">
    Strengthening organizations through cybersecurity awareness.
    <br />
    <a href="https://securelearning.pt"><strong>Explore our site »</strong></a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#architecture">Architecture</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#environment-configuration">Environment Configuration</a></li>
        <li><a href="#development">Development</a></li>
      </ul>
    </li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#cicd">CI/CD</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

SecureLearning is a cybersecurity awareness platform designed to strengthen organizational resilience by addressing the human element of security. It enables teams to run realistic, periodic phishing simulations and deliver targeted, just-in-time training based on real user behaviour.

The platform closes the loop between attack simulation, instant remediation, and measurable learning outcomes — giving security teams actionable insights into user susceptibility and improvement over time.

**Key capabilities:**

- **Campaign Designer & Scheduler** — Create, schedule, and manage phishing campaigns with configurable sending intervals and target user groups.
- **Phishing Simulation Engine** — Safely deliver simulated phishing emails via SMTP with pixel tracking for opens, clicks, and credential submissions.
- **Content Management** — Upload and organize training materials (documents, videos, markdown) with S3-compatible object storage.
- **Learning Modules & Courses** — Build structured training content with sections, quizzes, and progress tracking.
- **Compliance Workflows** — Enforce organizational compliance policies with quizzes and document acceptance tracking.
- **Multi-tenant Architecture** — Full tenant isolation through Keycloak realms with role-based access control (Admin, Org Manager, Content Manager).
- **Audit-ready Dashboards** — Real-time campaign statistics, user vulnerability scores, and repeat offender detection.
- **Accessibility** — Five theme modes including Deuteranopia, Protanopia, and Tritanopia support.

### Built With

* [![React][React.js]][React-url]
* [![Vite][Vite.js]][Vite-url]
* [![TailwindCSS][TailwindCSS]][TailwindCSS-url]
* [![FastAPI][FastAPI]][FastAPI-url]
* [![Keycloak][Keycloak]][Keycloak-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![MongoDB][MongoDB]][MongoDB-url]
* [![RabbitMQ][RabbitMQ]][RabbitMQ-url]
* [![Docker][Docker]][Docker-url]
* [![Nginx][Nginx]][Nginx-url]
* [![Garage][Garage]][Garage-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Nginx (Reverse Proxy)                       │
│                    TLS termination · routing · static                 │
└──────────┬──────────────────────────────────┬────────────────────────┘
           │                                  │
    ┌──────▼──────┐                    ┌──────▼──────┐
    │  Frontend   │                    │   API       │
    │  React+Vite │                    │   FastAPI   │
    │  :5173      │                    │   :8000     │
    └─────────────┘                    └──────┬──────┘
                                              │
                    ┌─────────────┬────────────┼─────────────┬──────────────┐
                    │             │            │             │              │
             ┌──────▼─────┐ ┌────▼────┐ ┌─────▼─────┐ ┌────▼────┐  ┌─────▼─────┐
             │ PostgreSQL │ │ MongoDB │ │ Keycloak  │ │ Garage  │  │ RabbitMQ  │
             │  :5432     │ │  :27017 │ │   :8080   │ │  :3900  │  │  :5672    │
             └────────────┘ └─────────┘ └───────────┘ └─────────┘  └─────┬─────┘
                                                                         │
                                                                   ┌─────▼─────┐
                                                                   │   SMTP    │
                                                                   │  Worker   │
                                                                   └───────────┘
```

| Service | Purpose |
| --- | --- |
| **Frontend** | React 19 SPA with TanStack Router, Tailwind CSS v4, shadcn/ui components, Keycloak SSO |
| **API** | FastAPI backend with SQLModel ORM, async MongoDB via Motor, S3 object storage |
| **SMTP Worker** | RabbitMQ consumer that sends phishing simulation emails via SMTP |
| **PostgreSQL** | Relational storage for campaigns, users, realms, sending profiles, compliance |
| **MongoDB** | Document storage for email templates, content pieces, modules, courses |
| **Keycloak** | Identity provider with multi-realm tenant isolation and RBAC |
| **Garage** | S3-compatible object storage for content files and tenant logos |
| **RabbitMQ** | Message broker for async email delivery and tracking event pipelines |
| **Nginx** | Reverse proxy with TLS, static asset serving, and route forwarding |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
| --- | --- | --- |
| [Docker](https://www.docker.com/) | 24+ | Container runtime |
| [Docker Compose](https://docs.docker.com/compose/) | 2.20+ | Multi-service orchestration |
| [Node.js](https://nodejs.org/) | 20+ | Frontend development |
| [uv](https://docs.astral.sh/uv/) | Latest | Python package manager |
| [Python](https://www.python.org/) | 3.12+ | API and SMTP services |

**Install uv** (if not already installed):
```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Environment Configuration

1. Copy the example environment file for development:
   ```sh
   cp deployment/.env.dev.example deployment/.env
   ```

2. Review and adjust values in `deployment/.env` to match your local setup. Key settings include database credentials, Keycloak admin credentials, and RabbitMQ configuration.

### Development

There are two ways to develop: **fully containerized** or **local frontend + API with containerized infrastructure**.

#### Option A — Fully Containerized (recommended for first run)

```sh
cd deployment
docker compose -f docker-compose.dev.yml up -d
```

This starts all services including the frontend dev server with hot reload at `http://localhost:5173`.

#### Option B — Local Frontend + API

1. Start infrastructure services only:
   ```sh
   cd deployment
   docker compose -f docker-compose.dev.yml up -d db mongo keycloak rabbitmq garage smtp
   ```

2. Start the frontend dev server:
   ```sh
   cd web
   npm install
   npm run dev
   ```

3. Start the API with hot reload:
   ```sh
   cd api
   uv sync --group dev
   uv run fastapi dev src/main.py
   ```

#### Default Ports

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/api/docs` |
| Keycloak Admin | `http://localhost:8080` |
| RabbitMQ Management | `http://localhost:15672` |
| Garage S3 | `http://localhost:3900` |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Structure

```
core/
├── api/                        # FastAPI backend
│   └── src/
│       ├── core/               # Settings, DB, security, object storage
│       ├── models/             # SQLModel tables + Pydantic schemas
│       ├── routers/            # API route handlers
│       ├── services/           # Business logic layer
│       ├── tasks/              # Background scheduler + tracking consumer
│       └── main.py             # App entry point
│
├── web/                        # React 19 SPA
│   └── src/
│       ├── components/         # UI components (ui/, shared/, feature dirs)
│       ├── routes/             # TanStack Router file-based routes
│       ├── services/           # API client functions per domain
│       ├── lib/                # Hooks, providers, utilities
│       └── main.tsx            # App entry point
│
├── smtp/                       # RabbitMQ email worker
│   └── src/
│       ├── core/               # RabbitMQ + API config
│       ├── emails/             # Email sender + template renderer
│       └── consumer.py         # Message consumer
│
├── deployment/                 # Docker Compose, Nginx configs, env templates
└── .github/workflows/          # CI/CD pipelines (per-service CI + CD)
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## CI/CD

The project uses **GitHub Actions** for continuous integration and deployment:

- **CI (per-service):** Triggered on pushes and PRs to `dev` with path filtering. Each service (API, Web, SMTP) runs its own pipeline: test/lint → SonarQube analysis → Docker image build and push to Docker Hub.
- **CD:** Triggered on release publish or manual dispatch. Runs on a self-hosted runner, generates TLS certificates, rebuilds, and redeploys the full stack using `docker-compose.yml`.

Docker images are published to Docker Hub with multi-stage builds (separate `dev` and `prod` targets).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Project Link: [https://github.com/PEI-SecureLearning/core](https://github.com/PEI-SecureLearning/core)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[React.js]: https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vite.js]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
[FastAPI]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com/
[Keycloak]: https://img.shields.io/badge/Keycloak-3F51B5?style=for-the-badge&logo=keycloak&logoColor=white
[Keycloak-url]: https://www.keycloak.org/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL_18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[MongoDB]: https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
[RabbitMQ]: https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white
[RabbitMQ-url]: https://www.rabbitmq.com/
[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
[Nginx]: https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white
[Nginx-url]: https://nginx.org/
[Garage]: https://img.shields.io/badge/Garage_S3-232F3E?style=for-the-badge&logo=amazons3&logoColor=white
[Garage-url]: https://garagehq.deuxfleurs.fr/
