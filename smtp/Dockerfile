FROM python:3.12-alpine

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock /app/

WORKDIR /app

RUN uv sync --frozen --no-cache

COPY . /app

CMD ["/app/.venv/bin/python", "main.py"]
