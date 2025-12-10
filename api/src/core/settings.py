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
