from typing import Optional

from sqlmodel import Field, SQLModel


class Tenant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    logo_link: Optional[str] = None
    domain: str
    keycloak_token: str
