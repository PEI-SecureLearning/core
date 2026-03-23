FROM python:3.12-alpine

# Install wget for healthchecks
RUN apk add --no-cache wget

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy the dependency files.
COPY pyproject.toml uv.lock /app/

# Install the application dependencies.
WORKDIR /app
RUN uv sync --frozen --no-cache

# Copy the rest of the application into the container.
COPY . /app

# Run the application.
CMD ["/app/.venv/bin/fastapi", "run", "src/main.py", "--port", "80", "--host", "0.0.0.0"]