#!/usr/bin/env python3
"""SMTP Client - RabbitMQ consumer for sending emails."""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from src.core.config import RabbitMQConfig, RateLimiterConfig
from src.consumer import RabbitMQConsumer
from src.emails.email_sender import EmailSender, TemplateRenderer
from src.rate_limiter import RateLimiter


def main() -> None:
    """Main entry point for the SMTP client."""
    # Load configuration from environment
    rabbitmq_config = RabbitMQConfig()
    rate_limiter_config = RateLimiterConfig()

    
    # Initialize components
    template_renderer = TemplateRenderer(templates_dir=Path("templates"))
    email_sender = EmailSender(template_renderer=template_renderer)
    rate_limiter = RateLimiter(rate_limiter_config)
    consumer = RabbitMQConsumer(rabbitmq_config, rate_limiter, email_sender)
    
    # Start consuming messages
    consumer.start()


if __name__ == "__main__":
    main()
