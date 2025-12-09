from pydantic import BaseModel
from typing import Optional


class SMTPConfig(BaseModel):
    """SMTP server configuration."""
    host: str
    port: int
    user: str
    password: str


class EmailMessage(BaseModel):
    """Email message payload from RabbitMQ."""
    smtp_config: SMTPConfig
    sender_email: str
    receiver_email: str
    subject: str
    template_path: str
    tracking_id: Optional[str] = None
    arguments: dict[str, str] = {}
