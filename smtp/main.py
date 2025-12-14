#!/usr/bin/env python3
"""SMTP Client - RabbitMQ consumer for sending emails."""

import sys
from pathlib import Path

# Force unbuffered output for Docker logs
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from src.core.config import RabbitMQConfig, RateLimiterConfig, APIConfig
from src.consumer import RabbitMQConsumer
from src.emails.email_sender import EmailSender, TemplateRenderer
from src.rate_limiter import RateLimiter


def main() -> None:
    """Main entry point for the SMTP client."""
    print("=" * 50)
    print("SMTP Client Starting...")
    print("=" * 50)
    
    # Load configuration from environment
    rabbitmq_config = RabbitMQConfig()
    rate_limiter_config = RateLimiterConfig()
    api_config = APIConfig()

    print(f"RabbitMQ Host: {rabbitmq_config.RABBITMQ_HOST}")
    print(f"RabbitMQ Queue: {rabbitmq_config.RABBITMQ_QUEUE}")
    print(f"API Internal URL: {api_config.API_INTERNAL_URL}")
    print(f"API URL: {api_config.API_URL}")
    
    # Initialize components
    template_renderer = TemplateRenderer(api_url=api_config.API_INTERNAL_URL)
    email_sender = EmailSender(template_renderer=template_renderer)
    rate_limiter = RateLimiter(rate_limiter_config)
    consumer = RabbitMQConsumer(rabbitmq_config, rate_limiter, email_sender)
    
    print("Components initialized. Starting consumer...")
    
    # Start consuming messages
    consumer.start()


if __name__ == "__main__":
    main()

