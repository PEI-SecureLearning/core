# k6 Performance Scripts

Minimal `k6` setup for SecureLearning API latency and throughput checks.

## Files

- `public-api.js`
  Public endpoints that do not require authentication.
- `base-user.js`
  Common authenticated learner/user endpoints.
- `authenticated-api.js`
  Org-manager endpoints that require a bearer token.
- `bulk-user-create.js`
  Batch-style user creation load against the real user creation endpoint.
- `lib/config.js`
  Shared environment-variable parsing.

## Prerequisites

- SecureLearning API running locally, usually at `http://localhost:8000`
- `k6` installed locally

## Env file

Use the shared example file as the base for all runs:

```sh
cp performance/k6/.env.example performance/k6/.env
```

Each runner script loads `performance/k6/.env` automatically. You can override it with `K6_ENV_FILE=/path/to/file`.

Available runner scripts:

- `performance/k6/run-public-api.sh`
- `performance/k6/run-authenticated-api.sh`
- `performance/k6/run-base-user.sh`
- `performance/k6/run-bulk-user-create.sh`

## Public baseline run

This hits:

- `GET /health`
- `GET /api/realms?domain=...`

Run:

```sh
./performance/k6/run-public-api.sh
```

Optional env vars:

```sh
K6_BASE_URL=http://localhost:8000
K6_LOOKUP_DOMAIN=ua.pt
```

Example:

```sh
./performance/k6/run-public-api.sh
```

## Authenticated run

This hits:

- `GET /api/org-manager/{realm}/users`
- `GET /api/org-manager/{realm}/users/{userId}` if `K6_USER_ID` is provided

Required env vars:

```sh
K6_AUTH_TOKEN=...
K6_REALM=...
```

Optional env vars:

```sh
K6_BASE_URL=http://localhost:8000
K6_USER_ID=<existing-user-id>
K6_DURATION=1m
K6_USERS_RATE=5
K6_USER_DETAILS_RATE=3
K6_PREALLOCATED_VUS=5
K6_MAX_VUS=20
```

Example:

```sh
./performance/k6/run-authenticated-api.sh
```

## Bulk user creation run

This simulates bulk import behavior by creating multiple users per k6 iteration against:

- `POST /api/realms/{realm}/users`

Required env vars:

```sh
K6_AUTH_TOKEN=...
K6_REALM=...
K6_BULK_EMAIL_DOMAIN=...
```

Optional env vars:

```sh
K6_BASE_URL=http://localhost:8000
K6_DURATION=1m
K6_BULK_CREATE_RATE=1
K6_BULK_BATCH_SIZE=10
K6_BULK_USER_ROLE=DEFAULT_USER
K6_BULK_USERNAME_PREFIX=k6bulk
K6_BULK_GROUP_ID=<existing-group-id>
K6_PREALLOCATED_VUS=5
K6_MAX_VUS=20
```

Example:

```sh
./performance/k6/run-bulk-user-create.sh
```

Notes:

- Each iteration creates `K6_BULK_BATCH_SIZE` unique users sequentially, which matches the current frontend bulk-create flow more closely than a synthetic CSV upload.
- Created users are not cleaned up automatically by this script.
- The email domain must match the target realm's configured domain or creation will fail validation.

## Base user run

This targets the common authenticated user surface:

- `GET /api/users/me`
- `GET /api/courses/{userId}/enrolled?exclude_scheduled=true`
- `GET /api/users/{userId}/progress?exclude_scheduled=true`
- `GET /api/users/me/certificates`
- `GET /api/campaigns/user/me/stats`
- `GET /api/compliance/status`
- `GET /api/compliance/latest`
- `GET /api/compliance/latest/quiz`
- `GET /api/users/{userId}/progress/{courseId}` if `K6_COURSE_ID` is provided

Required env vars:

```sh
K6_AUTH_TOKEN=...
K6_USER_ID=...
```

Optional env vars:

```sh
K6_BASE_URL=http://localhost:8000
K6_COURSE_ID=<existing-course-id>
K6_DURATION=1m
K6_PROFILE_RATE=5
K6_ENROLLED_RATE=5
K6_PROGRESS_RATE=5
K6_CERTIFICATES_RATE=3
K6_ME_STATS_RATE=3
K6_COMPLIANCE_RATE=3
K6_COMPLIANCE_DOC_RATE=2
K6_COMPLIANCE_QUIZ_RATE=2
K6_COURSE_PROGRESS_RATE=3
K6_PREALLOCATED_VUS=5
K6_MAX_VUS=20
```

Example:

```sh
./performance/k6/run-base-user.sh
```

## What these scripts measure

- p95 response time per scenario
- basic throughput under controlled load
- pass/fail checks for expected HTTP status codes
- batch creation duration for the bulk user creation script

Current thresholds:

- public health: `p95 < 200ms`
- public realm lookup: `p95 < 250ms`
- base user reads: `p95 < 300-500ms` depending on endpoint
- authenticated org-manager reads: `p95 < 500ms`

Adjust thresholds and rates to match your milestone targets and test environment.

## Suggested workflow

1. Start the API and observability stack.
2. Run `run-public-api.sh` as a baseline.
3. Run `run-authenticated-api.sh` against a realistic tenant.
4. Compare `k6` output with Grafana p95 and RPS dashboards.
