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
  
  # Keycloak
  KEYCLOAK_URL: str = ""
  KEYCLOAK_INTERNAL_URL: str = ""
  KEYCLOAK_ISSUER_URL: str = ""
  CLIENT_SECRET: str = ""
  SMTP_PASSWORD: str = ""

  WEB_URL: str = "http://localhost:5173"
  API_URL: str = "http://localhost:8000"

  # MongoDB
  MONGODB_URI: str = "mongodb://template_user:template_pass@mongo:27017/securelearning?authSource=securelearning"
  MONGODB_DB: str = "securelearning"
  MONGODB_COLLECTION_TEMPLATES: str = "templates"
  MONGODB_COLLECTION_TENANT_LOGOS: str = "tenant_logos"
  MONGODB_COLLECTION_CONTENT: str = "content_pieces"
  MONGODB_COLLECTION_CONTENT_FOLDERS: str = "content_folders"
  MONGODB_COLLECTION_MODULES: str = "modules"
  MONGODB_COLLECTION_COURSES: str = "courses"
  MONGODB_INLINE_FILE_MAX_BYTES: int = 8 * 1024 * 1024

  # Garage object storage (S3-compatible)
  FILE_STORAGE_BACKEND: str = "garage"
  GARAGE_S3_ENDPOINT: str = ""
  GARAGE_S3_PUBLIC_ENDPOINT: str = ""
  GARAGE_S3_REGION: str = "garage"
  GARAGE_ACCESS_KEY_ID: str = ""
  GARAGE_SECRET_ACCESS_KEY: str = ""
  GARAGE_EXPECTED_BUCKET_OWNER: str = ""
  GARAGE_FORCE_PATH_STYLE: bool = True
  GARAGE_BUCKET_CONTENT: str = "securelearning-content"
  GARAGE_BUCKET_LOGOS: str = "securelearning-logos"
  GARAGE_CONTENT_PREFIX: str = "content"
  GARAGE_LOGOS_PREFIX: str = "logos"
  GARAGE_PRESIGNED_URL_TTL_SECONDS: int = 900

  # RabbitMQ
  RABBITMQ_HOST: str
  RABBITMQ_USER: str
  RABBITMQ_PASS: str
  RABBITMQ_QUEUE: str
  RABBITMQ_TRACKING_QUEUE: str = "tracking_queue"
  
  # Statistics
  # Users who fell for phishing in more than this fraction of campaigns are
  # considered repeat offenders. Default is 0.5 (50%).
  REPEAT_OFFENDER_THRESHOLD: float = 0.5

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
