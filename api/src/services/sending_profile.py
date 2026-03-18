import ssl
import smtplib
from sqlalchemy.exc import SQLAlchemyError

from sqlmodel import Session, select
from src.models import (
    CustomHeader,
    SendingProfile,
    SendingProfileCreate,
    SendingProfileDisplayInfo,
)


PROFILE_NOT_FOUND_MESSAGE = "Sending profile not found"


class SendingProfileService:

    def _hydrate_profile_headers(self, profile: SendingProfile) -> SendingProfile:
        _ = profile.custom_headers
        return profile

    def test_sending_profile_configuration(self, profile: SendingProfileCreate) -> str:
        """
        Tests the SMTP configuration by attempting to connect and authenticate with the provided settings.

        Returns a success message when valid.
        Raises ValueError for user-fixable SMTP issues.
        Raises RuntimeError for unexpected runtime failures.
        """

        try:
            context = ssl.create_default_context()
            context.minimum_version = ssl.TLSVersion.TLSv1_2

            if profile.smtp_port == 465:
                with smtplib.SMTP_SSL(
                    profile.smtp_host, profile.smtp_port, context=context, timeout=10
                ) as smtp:
                    smtp.login(profile.username, profile.password)
            else:
                with smtplib.SMTP(
                    profile.smtp_host, profile.smtp_port, timeout=10
                ) as smtp:
                    smtp.ehlo()
                    smtp.starttls(context=context)
                    smtp.ehlo()
                    smtp.login(profile.username, profile.password)

            return "SMTP configuration is valid"

        except smtplib.SMTPAuthenticationError:
            raise ValueError("Invalid credentials")
        except smtplib.SMTPConnectError:
            raise ValueError("Could not connect to the SMTP server")
        except smtplib.SMTPServerDisconnected:
            raise ValueError("Server disconnected unexpectedly")
        except TimeoutError:
            raise ValueError("Connection timed out")
        except Exception as e:
            raise RuntimeError(str(e))

    def create_sending_profile(
        self, profile_data: SendingProfileCreate, current_realm: str, session: Session
    ):
        try:
            profile = SendingProfile(
                **profile_data.model_dump(exclude={"custom_headers"})
            )
            profile.realm_name = current_realm
            session.add(profile)
            session.commit()
            session.refresh(profile)

            if profile.id is None:
                raise RuntimeError("Failed to create sending profile")

            for header_data in profile_data.custom_headers:
                header = CustomHeader(
                    name=header_data.name,
                    value=header_data.value,
                    profile_id=profile.id,
                )
                session.add(header)

            session.commit()
            session.refresh(profile)

            return self._hydrate_profile_headers(profile)
        except (ValueError, LookupError, RuntimeError):
            session.rollback()
            raise
        except SQLAlchemyError as e:
            session.rollback()
            raise RuntimeError("Failed to create sending profile") from e

    def get_sending_profile(self, profile_id: int, session: Session) -> SendingProfile:
        profile = session.get(SendingProfile, profile_id)
        if not profile:
            raise LookupError(PROFILE_NOT_FOUND_MESSAGE)
        return self._hydrate_profile_headers(profile)

    def get_sending_profiles_by_realm(
        self, realm_name: str, session: Session
    ) -> list[SendingProfileDisplayInfo]:
        try:
            profiles = session.exec(
                select(SendingProfile).where(SendingProfile.realm_name == realm_name)
            ).all()
            return [
                SendingProfileDisplayInfo.model_validate(profile)
                for profile in profiles
            ]
        except SQLAlchemyError as e:
            raise RuntimeError("Failed to fetch sending profiles") from e

    def delete_sending_profile(self, profile_id: int, session: Session) -> None:
        profile = session.get(SendingProfile, profile_id)
        if not profile:
            raise LookupError(PROFILE_NOT_FOUND_MESSAGE)

        try:
            session.delete(profile)
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            raise RuntimeError("Failed to delete sending profile") from e

    def update_sending_profile(
        self,
        profile_id: int,
        profile_data: SendingProfileCreate,
        session: Session,
    ) -> SendingProfile:
        profile = session.get(SendingProfile, profile_id)
        if not profile:
            raise LookupError(PROFILE_NOT_FOUND_MESSAGE)

        try:
            for key, value in profile_data.model_dump(
                exclude={"custom_headers"}
            ).items():
                setattr(profile, key, value)

            if profile.id is None:
                raise RuntimeError("Invalid sending profile id")

            profile.custom_headers = [
                CustomHeader(name=h.name, value=h.value, profile_id=profile.id)
                for h in profile_data.custom_headers
            ]

            session.add(profile)
            session.commit()
            session.refresh(profile)

            return self._hydrate_profile_headers(profile)
        except (ValueError, LookupError, RuntimeError):
            session.rollback()
            raise
        except SQLAlchemyError as e:
            session.rollback()
            raise RuntimeError("Failed to update sending profile") from e
