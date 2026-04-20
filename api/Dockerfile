# Base stage: common setup for both dev and prod
FROM python:3.12-alpine AS base

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files
COPY pyproject.toml uv.lock /app/

WORKDIR /app

# Install dependencies (frozen, no-cache for prod optimization)
RUN uv sync --frozen --no-cache

# Development target: hot reload with source mount
FROM base AS dev

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy source code
COPY src ./src

EXPOSE 8000

# Run with hot reload (uv run supports reloading on file changes)
CMD ["uv", "run", "fastapi", "dev", "src/main.py", "--host", "0.0.0.0"]

# Production target: optimized, minimal
FROM base AS prod

# Install wget for healthchecks
RUN apk add --no-cache wget

# Copy the rest of the application
COPY . /app

EXPOSE 80

# Run the application
CMD ["/app/.venv/bin/fastapi", "run", "src/main.py", "--port", "80", "--host", "0.0.0.0"]