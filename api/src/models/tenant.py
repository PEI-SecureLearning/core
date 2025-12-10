from typing import Optional

from sqlmodel import Field, SQLModel


class Tenant(SQLModel, table=True):
    keycloak_id: str = Field(primary_key=True)
    logo_link: Optional[str] = None
    domain: str
