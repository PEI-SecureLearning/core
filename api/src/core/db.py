from sqlmodel import create_engine, SQLModel
from src.core.settings import settings
import src.models

engine = create_engine(
    str(settings.PGSQL_DATABASE_URI),
    pool_size=settings.POSTGRES_POOL_SIZE,
    max_overflow=settings.POSTGRES_MAX_OVERFLOW,
)


async def init_db():
    SQLModel.metadata.create_all(engine)
