# Web

React 19 single-page application for the SecureLearning platform. Multi-tenant dashboard for managing phishing campaigns, compliance, training content, and user administration.

## Structure

```
web/
├── src/
│   ├── components/          # UI components
│   │   ├── ui/              # shadcn/ui primitives (auto-generated, do not edit)
│   │   ├── shared/          # Cross-feature reusable components
│   │   ├── campaigns/       # Campaign-specific components
│   │   ├── courses/         # Course components
│   │   ├── templates/       # Email template components
│   │   └── ...              # Other feature dirs (kebab-case)
│   ├── Pages/               # Full-page view components (PascalCase)
│   ├── routes/              # TanStack Router file-based route defs
│   ├── services/            # API client functions per domain
│   │   ├── campaignsApi.ts
│   │   ├── coursesApi.ts
│   │   ├── modulesApi.ts
│   │   └── ...
│   ├── types/               # TypeScript interfaces
│   ├── lib/                 # Hooks, providers, API client, utilities
│   │   ├── api-client.ts    # ApiClient class (auto Keycloak token)
│   │   ├── providers.tsx    # App-level providers
│   │   └── useThemeTransition.ts
│   ├── config/navLinks.ts   # Sidebar navigation config
│   ├── globals.css          # Tailwind imports, theme tokens, all 5 themes
│   ├── keycloak.ts          # Keycloak client init + dynamic realm resolution
│   └── main.tsx             # App entry: Keycloak, router, error boundary
├── tests/                   # Playwright E2E tests (.spec.ts)
├── DESIGN_SYSTEM.md         # Theme tokens, color rules, component guidelines
├── components.json          # shadcn/ui config (new-york style)
├── vite.config.ts           # Vite + TanStack Router + Tailwind plugins
├── playwright.config.ts     # E2E test config (Chromium, Firefox, WebKit)
└── package.json
```

## Setup

```sh
npm install
npm run dev         # Dev server at http://localhost:5173
npm run build       # TypeScript check + production build
npm run lint        # ESLint
```

In dev mode, `/api` requests proxy to `http://localhost:8000` (configured in `vite.config.ts`).

## Key Technologies

| Library | Purpose |
|---------|---------|
| React 19 + Vite 7 | Framework + build tool |
| TanStack Router | File-based routing with auto code-splitting |
| Tailwind CSS v4 | Styling (via `@tailwindcss/vite` plugin) |
| shadcn/ui (new-york) | UI components built on Radix primitives |
| Keycloak JS | SSO authentication (multi-realm) |
| Recharts | Dashboard charts |
| Motion | Animations |
| Zod | Schema validation |
| nuqs | URL query state management |

## Theming

Five theme modes, toggled via CSS class on `<html>`:

| Theme | Class | Primary Color |
|-------|-------|---------------|
| Light | (default) | Purple `#7C3AED` |
| Dark | `.dark` | Purple `#7C3AED` |
| Deuteranopia | `.deuteranopia` | Cobalt `#005AB5` |
| Protanopia | `.protanopia` | Gold `#E69F00` |
| Tritanopia | `.tritanopia` | Crimson `#D62828` |

All colors defined as CSS custom properties in `globals.css`. See `DESIGN_SYSTEM.md` for full token reference.

**Rules:**
- Never hardcode hex values in JSX — use theme variables (`text-primary`, `bg-surface`)
- Never use Tailwind color literals (`text-purple-600`)
- Test all changes in all 5 theme modes

## Authentication

Multi-tenant Keycloak SSO with dynamic realm resolution:

- Admin routes (`/admin`, `/content-manager`) → `platform` realm + `react-admin` client
- Tenant routes → user's stored realm + `react-app` client
- `ApiClient` in `lib/api-client.ts` auto-injects Keycloak bearer tokens

## Routing

TanStack Router with file-based route generation. Route files in `src/routes/` auto-generate `routeTree.gen.ts` (never edit this file manually).

Key routes: `/dashboard`, `/campaigns`, `/templates`, `/statistics`, `/settings`, `/admin`, `/content-manager`

## Adding Components

```sh
npx shadcn@latest add <component-name>    # Adds to src/components/ui/
```

## E2E Testing

```sh
npx playwright test                        # All browsers
npx playwright test --project=chromium     # Single browser
npx playwright test tests/createUser.spec.ts  # Single test
```

Config: 60s test timeout, 20s action timeout. Tests in `tests/` directory.
