import pika
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field


class RabbitMQConfig(BaseSettings):
    """RabbitMQ connection configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    RABBITMQ_HOST: str
    RABBITMQ_USER: str
    RABBITMQ_PASS: str
    RABBITMQ_QUEUE: str

    @property
    def credentials(self) -> pika.PlainCredentials:
        """Create RabbitMQ credentials from config."""
        return pika.PlainCredentials(self.RABBITMQ_USER, self.RABBITMQ_PASS)

    @property
    def connection_parameters(self) -> pika.ConnectionParameters:
        """Create RabbitMQ connection parameters from config."""
        return pika.ConnectionParameters(
            host=self.RABBITMQ_HOST,
            credentials=self.credentials
        )


class RateLimiterConfig(BaseSettings):
    """Rate limiter configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    RATE_LIMITER_MAX_REQUESTS: int
    RATE_LIMITER_TIME_WINDOW_SECONDS: float