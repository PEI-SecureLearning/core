from typing import Optional
from sqlmodel import SQLModel


class ProgressUpdate(SQLModel):
  section_id: str
  task_id: str


class SectionComplete(SQLModel):
  section_id: str
  total_sections: int


class CertificateDTO(SQLModel):
    user_id: str
    course_id: str
    last_emission_date: str
    expiration_date: str
    expired: bool = False
    course_name: Optional["str"]
    course_cover_image_link: Optional["str"]
    difficulty: Optional["str"]
    category: Optional["str"]
    realm: str
