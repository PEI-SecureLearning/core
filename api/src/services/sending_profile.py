from typing import Optional, Tuple

import ssl
import smtplib

from sqlmodel import Session, select
from src.models.custom_header import CustomHeader
from src.models.sending_profile import (
    SendingProfile,
    SendingProfileCreate,
    SendingProfileDisplayInfo,
)


class SendingProfileService:

    def _test_sending_profile_configuration(self, profile: SendingProfileCreate) -> Tuple[bool, str]:
        """
        Tests the SMTP configuration by attempting to connect and authenticate with the provided settings.
        
        Returns a tuple (is_valid, message) where:
        - is_valid: A boolean indicating whether the configuration is valid.
        - message: A string providing details about the validation result.
        """
        
        try:
            context = ssl.create_default_context()
            context.minimum_version = ssl.TLSVersion.TLSv1_2

            if profile.smtp_port == 465:
                with smtplib.SMTP_SSL(profile.smtp_host, profile.smtp_port, context=context, timeout=10) as smtp:
                    smtp.login(profile.username, profile.password)
            else:
                with smtplib.SMTP(profile.smtp_host, profile.smtp_port, timeout=10) as smtp:
                    smtp.ehlo()
                    smtp.starttls(context=context)
                    smtp.ehlo()
                    smtp.login(profile.username, profile.password)

            return (True, "SMTP configuration is valid")

        except smtplib.SMTPAuthenticationError:
            return (False, "Invalid credentials")
        except smtplib.SMTPConnectError:
            return (False, "Could not connect to the SMTP server")
        except smtplib.SMTPServerDisconnected:
            return (False, "Server disconnected unexpectedly")
        except TimeoutError:
            return (False, "Connection timed out")
        except Exception as e:
            return (False, str(e))

    def create_sending_profile(
        self, profile_data: SendingProfileCreate, current_realm: str, session: Session
    ):
        profile = SendingProfile(**profile_data.model_dump(exclude={"custom_headers"}))
        profile.realm_name = current_realm
        session.add(profile)
        session.commit()
        session.refresh(profile)

        for header_data in profile_data.custom_headers:
            header = CustomHeader.model_validate(header_data)
            header.profile_id = profile.id
            session.add(header)

        session.commit()
        session.refresh(profile)

    def get_sending_profile(
        self, profile_id: int, session: Session
    ) -> Optional[SendingProfile]:
        return session.get(SendingProfile, profile_id)

    def get_sending_profiles_by_realm(
        self, realm_name: str, session: Session
    ) -> list[SendingProfileDisplayInfo]:
        profiles = session.exec(
            select(SendingProfile).where(SendingProfile.realm_name == realm_name)
        ).all()
        return [
            SendingProfileDisplayInfo.model_validate(profile) for profile in profiles
        ]

    def delete_sending_profile(self, profile_id: int, session: Session) -> None:
        profile = session.get(SendingProfile, profile_id)
        if profile:
            session.delete(profile)
            session.commit()

    def update_sending_profile(
        self,
        profile_id: int,
        profile_data: SendingProfileCreate,
        session: Session,
    ) -> Optional[SendingProfile]:
        profile = session.get(SendingProfile, profile_id)
        if not profile:
            return None

        for key, value in profile_data.model_dump(exclude={"custom_headers"}).items():
            setattr(profile, key, value)

        session.add(profile)
        session.commit()
        session.refresh(profile)

        # Delete existing headers
        existing_headers = session.exec(
            select(CustomHeader).where(CustomHeader.profile_id == profile.id)
        ).all()
        for header in existing_headers:
            session.delete(header)

        # Add new headers
        for header_data in profile_data.custom_headers:
            header = CustomHeader(
                name=header_data.name, value=header_data.value, profile_id=profile.id
            )
            session.add(header)

        session.commit()
        session.refresh(profile)

        return profile
