from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel



class PhishingKitCreate(SQLModel):
    """Schema for creating a phishing kit."""
    name: str
    description: Optional[str] = None
    args: dict[str, str] = {}
    email_template_id: str
    email_template_name: str
    landing_page_template_id: str
    landing_page_template_name: str
    sending_profile_ids: list[int] = []


class PhishingKitDisplayInfo(SQLModel):
    """Schema for displaying phishing kit info."""

    id: int
    name: str
    description: Optional[str] = None
    args: dict[str, str] = {}
    email_template_name: Optional[str] = None
    email_template_created_at: Optional[datetime] = None
    email_template_updated_at: Optional[datetime] = None
    landing_page_template_name: Optional[str] = None
    landing_page_template_created_at: Optional[datetime] = None
    landing_page_template_updated_at: Optional[datetime] = None
    sending_profile_names: list[str] = []
