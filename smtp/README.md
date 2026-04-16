# SMTP Worker

RabbitMQ consumer that processes email sending jobs for phishing campaign simulations. Receives messages from the API via `email_queue`, sends emails via SMTP, and publishes delivery status events to `tracking_queue`.

## Structure

```
smtp/
├── src/
│   ├── core/
│   │   └── config.py         # RabbitMQConfig, APIConfig (pydantic-settings)
│   ├── emails/
│   │   └── email_sender.py   # EmailSender + TemplateRenderer
│   ├── models/               # Pydantic models
│   │   ├── __init__.py       # EmailMessage, TrackingEvent
│   │   └── ...
│   └── consumer.py           # RabbitMQConsumer (blocking, auto-reconnect)
├── main.py                   # Entry point
├── pyproject.toml            # Dependencies (uv)
└── Dockerfile
```

## Message Flow

```
API publishes to email_queue
        ↓
SMTP Worker consumes message (EmailMessage)
        ↓
Sends email via SMTP using per-campaign sending profile
        ↓
Publishes TrackingEvent to tracking_queue
  - "sent" on success
  - "failed" + error cause on failure
        ↓
API tracking consumer updates campaign stats
```

## Configuration

Environment variables (via `pydantic-settings`):

| Variable | Purpose |
|----------|---------|
| `RABBITMQ_HOST` | RabbitMQ server |
| `RABBITMQ_USER` | Consumer credentials (uses `RABBITMQ_SMTP_USER`) |
| `RABBITMQ_PASS` | Consumer password |
| `RABBITMQ_QUEUE` | Email queue name (`email_queue`) |
| `RABBITMQ_TRACKING_QUEUE` | Tracking event queue (`tracking_queue`) |
| `RATE_LIMITER_MAX_REQUESTS` | Max emails per time window |
| `RATE_LIMITER_TIME_WINDOW_SECONDS` | Rate limit window |
| `API_INTERNAL_URL` | Internal API URL (for template fetching) |
| `API_URL` | Public API URL (for tracking pixel/redirect URLs) |

## Email Templates

Templates use `${{var_name}}` syntax for variable substitution.

Required variables in every template:
- `${{redirect}}` — phishing link (click tracking)
- `${{pixel}}` — invisible tracking pixel (open tracking)

## Error Handling

SMTP errors are classified and reported back via tracking events:

| Error Type | Cause |
|------------|-------|
| `auth_error` | SMTP authentication failed |
| `network_error` | Connection refused, timeout, DNS failure |
| `unknown_error` | Any other exception |

## Running

The worker is designed to run as a Docker container (started by Docker Compose). It runs a single-threaded blocking consumer loop with automatic reconnection on connection loss.

```sh
# Standalone (for debugging)
uv sync
uv run python main.py

# Via Docker Compose (normal usage)
# Managed by deployment/docker-compose.dev.yml as the "smtp" service
```
