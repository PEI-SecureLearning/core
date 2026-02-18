import datetime
from typing import Iterable

from sqlmodel import Session, select

from src.models.campaign import (
    Campaign,
    CampaignDetailInfo,
    CampaignDisplayInfo,
    CampaignGlobalStats,
    CampaignStatus,
)
from src.models.email_sending import EmailSending, UserSendingInfo


class Stats_handler:

    def get_global_stats(
        self, current_realm: str, session: Session
    ) -> CampaignGlobalStats:
        """Calculate global statistics across all campaigns for the realm."""
        campaigns = session.exec(
            select(Campaign).where(Campaign.realm_name == current_realm)
        ).all()

        status_counts = {status: 0 for status in CampaignStatus}
        for c in campaigns:
            status_counts[c.status] += 1

        total_scheduled = sum(c.total_recipients for c in campaigns)
        total_opened = sum(c.total_opened for c in campaigns)
        total_clicked = sum(c.total_clicked for c in campaigns)
        total_phished = sum(c.total_phished for c in campaigns)

        all_sendings: list[EmailSending] = []
        for c in campaigns:
            all_sendings.extend(c.email_sendings)
        total_sent = sum(1 for s in all_sendings if s.sent_at)
        total_failed = sum(1 for s in all_sendings if s.status.value == "failed")

        unique_users = set(s.user_id for s in all_sendings)
        users_opened = set(s.user_id for s in all_sendings if s.opened_at)
        users_clicked = set(s.user_id for s in all_sendings if s.clicked_at)
        users_phished = set(s.user_id for s in all_sendings if s.phished_at)

        repeat_offenders = self._find_repeat_offenders(list(campaigns))

        avg_open_time = self._calc_avg_time_delta(
            [
                (s.sent_at, s.opened_at)
                for s in all_sendings
                if s.sent_at and s.opened_at
            ]
        )
        avg_click_time = self._calc_avg_time_delta(
            [
                (s.sent_at, s.clicked_at)
                for s in all_sendings
                if s.sent_at and s.clicked_at
            ]
        )

        return CampaignGlobalStats(
            total_campaigns=len(campaigns),
            scheduled_campaigns=status_counts[CampaignStatus.SCHEDULED],
            running_campaigns=status_counts[CampaignStatus.RUNNING],
            completed_campaigns=status_counts[CampaignStatus.COMPLETED],
            canceled_campaigns=status_counts[CampaignStatus.CANCELED],
            total_emails_scheduled=total_scheduled,
            total_emails_sent=total_sent,
            total_emails_opened=total_opened,
            total_emails_clicked=total_clicked,
            total_emails_phished=total_phished,
            total_emails_failed=total_failed,
            delivery_rate=(
                round(total_sent / total_scheduled * 100, 2) if total_scheduled else 0.0
            ),
            open_rate=round(total_opened / total_sent * 100, 2) if total_sent else 0.0,
            click_rate=(
                round(total_clicked / total_sent * 100, 2) if total_sent else 0.0
            ),
            phish_rate=(
                round(total_phished / total_sent * 100, 2) if total_sent else 0.0
            ),
            unique_users_targeted=len(unique_users),
            users_who_opened=len(users_opened),
            users_who_clicked=len(users_clicked),
            users_who_phished=len(users_phished),
            repeat_offenders=repeat_offenders,
            avg_time_to_open_seconds=avg_open_time,
            avg_time_to_click_seconds=avg_click_time,
        )

    def _find_repeat_offenders(self, campaigns: Iterable[Campaign]) -> list[str]:
        """Find users who clicked/phished in more than 50% of campaigns they were targeted in."""
        user_campaigns: dict[str, dict] = {}

        for campaign in campaigns:
            users_in_campaign = set()
            users_fell_in_campaign = set()

            for sending in campaign.email_sendings:
                users_in_campaign.add(sending.user_id)
                if sending.clicked_at or sending.phished_at:
                    users_fell_in_campaign.add(sending.user_id)

            for user_id in users_in_campaign:
                if user_id not in user_campaigns:
                    user_campaigns[user_id] = {"targeted": 0, "fell": 0}
                user_campaigns[user_id]["targeted"] += 1
                if user_id in users_fell_in_campaign:
                    user_campaigns[user_id]["fell"] += 1

        return [
            user_id
            for user_id, stats in user_campaigns.items()
            if stats["targeted"] > 0 and stats["fell"] / stats["targeted"] > 0.5
        ]

    def _calc_avg_time_delta(
        self, time_pairs: list[tuple[datetime.datetime, datetime.datetime]]
    ) -> float | None:
        """Calculate average time difference in seconds."""
        if not time_pairs:
            return None
        total_seconds = sum((end - start).total_seconds() for start, end in time_pairs)
        return round(total_seconds / len(time_pairs), 2)

    def _to_display_info(self, campaign: Campaign) -> CampaignDisplayInfo:
        """Convert a Campaign to CampaignDisplayInfo using stored stats."""
        total_sent = sum(1 for s in campaign.email_sendings if s.sent_at is not None)
        return CampaignDisplayInfo(
            id=campaign.id,  # type: ignore
            name=campaign.name,
            begin_date=campaign.begin_date,
            end_date=campaign.end_date,
            status=campaign.status,
            total_sent=total_sent,
            total_opened=campaign.total_opened,
            total_clicked=campaign.total_clicked,
        )

    def _to_detail_info(self, campaign: Campaign) -> CampaignDetailInfo:
        """Convert a Campaign to CampaignDetailInfo with full details and stats."""
        sendings = campaign.email_sendings
        now = datetime.datetime.now()

        total_recipients = campaign.total_recipients
        total_opened = campaign.total_opened
        total_clicked = campaign.total_clicked
        total_phished = campaign.total_phished
        total_sent = sum(1 for s in sendings if s.sent_at)
        total_failed = sum(1 for s in sendings if s.status.value == "failed")

        open_times = [
            (s.sent_at, s.opened_at) for s in sendings if s.sent_at and s.opened_at
        ]
        click_times = [
            (s.sent_at, s.clicked_at) for s in sendings if s.sent_at and s.clicked_at
        ]

        opened_dates = [s.opened_at for s in sendings if s.opened_at]
        clicked_dates = [s.clicked_at for s in sendings if s.clicked_at]

        campaign_duration = (campaign.end_date - campaign.begin_date).total_seconds()
        elapsed = (min(now, campaign.end_date) - campaign.begin_date).total_seconds()
        time_elapsed_pct = (
            (elapsed / campaign_duration * 100) if campaign_duration > 0 else 0
        )
        progress_pct = (
            (total_sent / total_recipients * 100) if total_recipients > 0 else 0
        )

        user_sendings = [
            UserSendingInfo(
                user_id=s.user_id,
                email=s.email_to,
                status=s.status.value,
                sent_at=s.sent_at,
                opened_at=s.opened_at,
                clicked_at=s.clicked_at,
                phished_at=s.phished_at,
            )
            for s in sendings
        ]

        return CampaignDetailInfo(
            id=campaign.id,  # type: ignore
            name=campaign.name,
            description=campaign.description,
            begin_date=campaign.begin_date,
            end_date=campaign.end_date,
            sending_interval_seconds=campaign.sending_interval_seconds,
            status=campaign.status,
            realm_name=campaign.realm_name,
            email_template_id=campaign.email_template_id,
            landing_page_template_id=campaign.landing_page_template_id,
            sending_profile_name=(
                campaign.sending_profile.name if campaign.sending_profile else None
            ),
            email_template_name=(
                campaign.email_template.name if campaign.email_template else None
            ),
            landing_page_template_name=(
                campaign.landing_page_template.name
                if campaign.landing_page_template
                else None
            ),
            total_recipients=total_recipients,
            total_sent=total_sent,
            total_opened=total_opened,
            total_clicked=total_clicked,
            total_phished=total_phished,
            total_failed=total_failed,
            delivery_rate=(
                round(total_sent / total_recipients * 100, 2)
                if total_recipients
                else 0.0
            ),
            open_rate=round(total_opened / total_sent * 100, 2) if total_sent else 0.0,
            click_rate=(
                round(total_clicked / total_sent * 100, 2) if total_sent else 0.0
            ),
            phish_rate=(
                round(total_phished / total_sent * 100, 2) if total_sent else 0.0
            ),
            progress_percentage=round(progress_pct, 2),
            time_elapsed_percentage=round(max(0, min(100, time_elapsed_pct)), 2),
            avg_time_to_open_seconds=self._calc_avg_time_delta(open_times),
            avg_time_to_click_seconds=self._calc_avg_time_delta(click_times),
            first_open_at=min(opened_dates) if opened_dates else None,
            last_open_at=max(opened_dates) if opened_dates else None,
            first_click_at=min(clicked_dates) if clicked_dates else None,
            last_click_at=max(clicked_dates) if clicked_dates else None,
            user_sendings=user_sendings,
        )
