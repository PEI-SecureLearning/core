from typing import Optional

from sqlmodel import Session, select
from src.models.custom_header import CustomHeader
from src.models.sending_profile import (
    SendingProfile,
    SendingProfileCreate,
    SendingProfileDisplayInfo,
    SendingProfileDisplayInfo,
)


class SendingProfileService:

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
