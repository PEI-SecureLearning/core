from typing import Optional

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from src.models import (
    PhishingKit,
    PhishingKitCreate,
    PhishingKitDisplayInfo,
    PhishingKitSendingProfileLink,
)

from src.models.email_template import EmailTemplate
from src.models.landing_page import LandingPageTemplate

class PhishingKitService:

    def _get_or_create_email_template(self, session: Session, data: PhishingKitCreate) -> EmailTemplate:
        template = session.exec(select(EmailTemplate).where(EmailTemplate.content_link == data.email_template_id)).first()
        if not template:
            template = EmailTemplate(content_link=data.email_template_id, name=data.email_template_name)
            session.add(template)
            session.commit()
            session.refresh(template)
        return template

    def _get_or_create_landing_page_template(self, session: Session, data: PhishingKitCreate) -> LandingPageTemplate:
        template = session.exec(select(LandingPageTemplate).where(LandingPageTemplate.content_link == data.landing_page_template_id)).first()
        if not template:
            template = LandingPageTemplate(content_link=data.landing_page_template_id, name=data.landing_page_template_name)
            session.add(template)
            session.commit()
            session.refresh(template)
        return template

    def create_phishing_kit(
        self, data: PhishingKitCreate, realm: str, session: Session
    ) -> PhishingKit:
        email_tmpl = self._get_or_create_email_template(session, data)
        landing_tmpl = self._get_or_create_landing_page_template(session, data)

        kit = PhishingKit(
            name=data.name,
            description=data.description,
            args=data.args,
            email_template_id=email_tmpl.id,
            landing_page_template_id=landing_tmpl.id,
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
        return [self._to_display_info(kit) for kit in kits]

    def get_phishing_kit(
        self, kit_id: int, session: Session
    ) -> Optional[PhishingKitDisplayInfo]:
        statement = (
            select(PhishingKit)
            .where(PhishingKit.id == kit_id)
            .options(
                selectinload(PhishingKit.email_template),
                selectinload(PhishingKit.landing_page_template),
                selectinload(PhishingKit.sending_profiles),
            )
        )
        kit = session.exec(statement).first()
        return self._to_display_info(kit) if kit else None

    def _to_display_info(self, kit: PhishingKit) -> PhishingKitDisplayInfo:
        et = kit.email_template
        lpt = kit.landing_page_template
        return PhishingKitDisplayInfo(
            id=kit.id,
            name=kit.name,
            description=kit.description,
            args=kit.args,
            email_template_name=et.name if et else None,
            email_template_created_at=et.created_at if et else None,
            email_template_updated_at=et.updated_at if et else None,
            landing_page_template_name=lpt.name if lpt else None,
            landing_page_template_created_at=lpt.created_at if lpt else None,
            landing_page_template_updated_at=lpt.updated_at if lpt else None,
            sending_profile_names=[sp.name for sp in kit.sending_profiles],
        )

    def update_phishing_kit(
        self, kit_id: int, data: PhishingKitCreate, session: Session
    ) -> Optional[PhishingKit]:
        kit = session.get(PhishingKit, kit_id)
        if not kit:
            return None

        email_tmpl = self._get_or_create_email_template(session, data)
        landing_tmpl = self._get_or_create_landing_page_template(session, data)

        kit.name = data.name
        kit.description = data.description
        kit.args = data.args
        kit.email_template_id = email_tmpl.id
        kit.landing_page_template_id = landing_tmpl.id

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
