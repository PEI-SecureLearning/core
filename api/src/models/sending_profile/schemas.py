from typing import Final
from sqlmodel import SQLModel

class CustomHeaderCreate(SQLModel):
    name: str
    value: str


class SendingProfileCreate(SQLModel):
    name: str
    smtp_host: str
    smtp_port: int
    username: str
    password: str
    from_fname: str
    from_lname: str
    from_email: str

    custom_headers: list[CustomHeaderCreate] = []


class SendingProfileDisplayInfo(SQLModel):
    id: int
    name: str
    from_fname: str
    from_lname: str
    from_email: str
    smtp_host: Final[str]
    smtp_port: Final[int]
