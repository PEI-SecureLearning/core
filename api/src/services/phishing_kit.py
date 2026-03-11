from typing import Optional

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from src.models import (
    PhishingKit,
    PhishingKitCreate,
    PhishingKitDisplayInfo,
    PhishingKitSendingProfileLink,
)


class PhishingKitService:

    def create_phishing_kit(
        self, data: PhishingKitCreate, realm: str, session: Session
    ) -> PhishingKit:
        kit = PhishingKit(
            name=data.name,
            description=data.description,
            args=data.args,
            email_template_id=data.email_template_id,
            landing_page_template_id=data.landing_page_template_id,
            realm_name=realm,
        )
        session.add(kit)
        session.commit()
        session.refresh(kit)

        # Link sending profiles via M2M
        for sp_id in data.sending_profile_ids:
            link = PhishingKitSendingProfileLink(
                phishing_kit_id=kit.id, sending_profile_id=sp_id
            )
            session.add(link)

        session.commit()
        session.refresh(kit)
        return kit

    def get_phishing_kits_by_realm(
        self, realm: str, session: Session
    ) -> list[PhishingKitDisplayInfo]:
        statement = (
            select(PhishingKit)
            .where(PhishingKit.realm_name == realm)
            .options(
                selectinload(PhishingKit.email_template),
                selectinload(PhishingKit.landing_page_template),
                selectinload(PhishingKit.sending_profiles),
            )
        )
        kits = session.exec(statement).all()
        return [
            PhishingKitDisplayInfo(
                id=kit.id,
                name=kit.name,
                description=kit.description,
                args=kit.args,
                email_template_name=(
                    kit.email_template.name if kit.email_template else None
                ),
                landing_page_template_name=(
                    kit.landing_page_template.name
                    if kit.landing_page_template
                    else None
                ),
                sending_profile_names=[sp.name for sp in kit.sending_profiles],
            )
            for kit in kits
        ]

    def get_phishing_kit(
        self, kit_id: int, session: Session
    ) -> Optional[PhishingKit]:
        statement = (
            select(PhishingKit)
            .where(PhishingKit.id == kit_id)
            .options(
                selectinload(PhishingKit.email_template),
                selectinload(PhishingKit.landing_page_template),
                selectinload(PhishingKit.sending_profiles),
            )
        )
        return session.exec(statement).first()

    def update_phishing_kit(
        self, kit_id: int, data: PhishingKitCreate, session: Session
    ) -> Optional[PhishingKit]:
        kit = session.get(PhishingKit, kit_id)
        if not kit:
            return None

        kit.name = data.name
        kit.description = data.description
        kit.args = data.args
        kit.email_template_id = data.email_template_id
        kit.landing_page_template_id = data.landing_page_template_id

        # Re-sync M2M sending profiles: delete old links, add new ones
        old_links = session.exec(
            select(PhishingKitSendingProfileLink).where(
                PhishingKitSendingProfileLink.phishing_kit_id == kit_id
            )
        ).all()
        for link in old_links:
            session.delete(link)

        for sp_id in data.sending_profile_ids:
            link = PhishingKitSendingProfileLink(
                phishing_kit_id=kit_id, sending_profile_id=sp_id
            )
            session.add(link)

        session.add(kit)
        session.commit()
        session.refresh(kit)
        return kit

    def delete_phishing_kit(self, kit_id: int, session: Session) -> None:
        kit = session.get(PhishingKit, kit_id)
        if kit:
            session.delete(kit)
            session.commit()
