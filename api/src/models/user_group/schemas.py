from typing import Optional
from sqlmodel import SQLModel


class KeycloakGroupDTO(SQLModel):
    id: str
    name: Optional[str] = None
    path: Optional[str] = None
