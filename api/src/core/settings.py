import pika

from pydantic import PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

  model_config = SettingsConfigDict( {
    "env_file": ".env",
    "env_ignore_empty": True,
    "extra": "ignore",
  })

  POSTGRES_SERVER: str
  POSTGRES_PORT: int = 5432
  POSTGRES_USER: str
  POSTGRES_PASSWORD: str = ""
  POSTGRES_DB: str = ""

  # MongoDB
  MONGODB_URI: str = "mongodb://template_user:template_pass@mongo:27017/securelearning?authSource=securelearning"
  MONGODB_DB: str = "securelearning"
  MONGODB_COLLECTION_TEMPLATES: str = "templates"
  MONGODB_COLLECTION_TENANT_LOGOS: str = "tenant_logos"
  MONGODB_COLLECTION_CONTENT: str = "content_pieces"
  MONGODB_GRIDFS_BUCKET: str = "content_files"
  MONGODB_INLINE_FILE_MAX_BYTES: int = 8 * 1024 * 1024

  # RabbitMQ
  RABBITMQ_HOST: str
  RABBITMQ_USER: str
  RABBITMQ_PASS: str
  RABBITMQ_QUEUE: str

  @computed_field
  @property
  def RABBIMQ_CREDS(self) -> pika.PlainCredentials:
    """Create RabbitMQ credentials from config."""
    return pika.PlainCredentials(self.RABBITMQ_USER, self.RABBITMQ_PASS)

  @computed_field
  @property
  def RABBITMQ_CONNECTION_PARAMS(self) -> pika.ConnectionParameters:
    """Create RabbitMQ connection parameters from config."""
    return pika.ConnectionParameters(
      host=self.RABBITMQ_HOST,
      credentials=self.RABBIMQ_CREDS
    )

  @computed_field
  @property
  def PGSQL_DATABASE_URI(self) -> PostgresDsn:
      return PostgresDsn.build(
          scheme="postgresql+psycopg",
          username=self.POSTGRES_USER,
          password=self.POSTGRES_PASSWORD,
          host=self.POSTGRES_SERVER,
          port=self.POSTGRES_PORT,
          path=self.POSTGRES_DB,
        )
  
settings = Settings() # type: ignore
