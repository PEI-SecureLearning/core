"""Campaign statistics aggregation and transformation handler."""

import datetime
from typing import Iterable
from dataclasses import dataclass

from sqlmodel import Session, select

from src.models.campaign import (
    Campaign,
    CampaignDetailInfo,
    CampaignDisplayInfo,
    CampaignGlobalStats,
    CampaignStatus,
)
from src.models.email_sending import EmailSending, EmailSendingStatus, UserSendingInfo
from src.services.campaign.stats_calculator import CampaignStatCalculator

@dataclass
class SendingMetrics:
    total_sent: int
    total_failed: int
    open_times: list[tuple[datetime.datetime, datetime.datetime]]
    click_times: list[tuple[datetime.datetime, datetime.datetime]]
    opened_dates: list[datetime.datetime]
    clicked_dates: list[datetime.datetime]
    user_sendings_data: list[UserSendingInfo]


class StatsHandler:
    """Handler for campaign statistics aggregation and transformation.
    
    This class orchestrates database queries and uses CampaignStatCalculator
    for pure stat computations. It transforms campaign ORM objects into
    API response models.
    """

    def __init__(self):
        self.calc = CampaignStatCalculator()

    def _extract_sending_metrics(self, sendings: Iterable[EmailSending]) -> SendingMetrics:
        """Single-pass extraction of metrics from a list of EmailSending objects."""
        total_sent = 0
        total_failed = 0
        open_times: list[tuple[datetime.datetime, datetime.datetime]] = []
        click_times: list[tuple[datetime.datetime, datetime.datetime]] = []
        opened_dates: list[datetime.datetime] = []
        clicked_dates: list[datetime.datetime] = []
        user_sendings_data: list[UserSendingInfo] = []

        for s in sendings:
            if s.sent_at:
                total_sent += 1
            if s.status == EmailSendingStatus.FAILED:
                total_failed += 1

            if s.opened_at:
                opened_dates.append(s.opened_at)
                open_times.append((s.sent_at, s.opened_at))
            if s.clicked_at:
                clicked_dates.append(s.clicked_at)
                click_times.append((s.opened_at, s.clicked_at))

            user_sendings_data.append(
                UserSendingInfo(
                    user_id=s.user_id,
                    email=s.email_to,
                    status=s.status.value if hasattr(s.status, "value") else str(s.status),
                    sent_at=s.sent_at,
                    opened_at=s.opened_at,
                    clicked_at=s.clicked_at,
                    phished_at=s.phished_at,
                )
            )

        return SendingMetrics(
            total_sent=total_sent,
            total_failed=total_failed,
            open_times=open_times,
            click_times=click_times,
            opened_dates=opened_dates,
            clicked_dates=clicked_dates,
            user_sendings_data=user_sendings_data,
        )

    def _build_user_engagement_from_campaigns(self, campaigns: Iterable[Campaign]) -> dict[str, dict[str, int]]:
        """Build a per-user engagement summary from campaigns."""
        user_campaigns: dict[str, dict[str, int]] = {}

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

        return user_campaigns

    def _compute_global_metrics(self, campaigns: list[Campaign]) -> dict:
        """Compute global statistics across all campaigns."""
        status_counts = dict.fromkeys(CampaignStatus, 0)
        for c in campaigns:
            if c.status is not None:
                status_counts[c.status] += 1

        total_scheduled = sum(c.total_recipients for c in campaigns)
        total_opened = sum(c.total_opened for c in campaigns)
        total_clicked = sum(c.total_clicked for c in campaigns)
        total_phished = sum(c.total_phished for c in campaigns)

        all_sendings: list[EmailSending] = []
        for c in campaigns:
            all_sendings.extend(c.email_sendings)

        sending_metrics = self._extract_sending_metrics(all_sendings)

        unique_users = {s.user_id for s in all_sendings}
        users_opened = {s.user_id for s in all_sendings if s.opened_at}
        users_clicked = {s.user_id for s in all_sendings if s.clicked_at}
        users_phished = {s.user_id for s in all_sendings if s.phished_at}

        user_engagement = self._build_user_engagement_from_campaigns(campaigns)
        repeat_offenders = self.calc.find_repeat_offenders_from_engagement_dict(user_engagement)

        return {
            "total_campaigns": len(campaigns),
            "status_counts": status_counts,
            "total_emails_scheduled": total_scheduled,
            "total_emails_sent": sending_metrics.total_sent,
            "total_emails_opened": total_opened,
            "total_emails_clicked": total_clicked,
            "total_emails_phished": total_phished,
            "total_emails_failed": sending_metrics.total_failed,
            "delivery_rate": self.calc.calc_rate(sending_metrics.total_sent, total_scheduled),
            "open_rate": self.calc.calc_rate(total_opened, sending_metrics.total_sent),
            "click_rate": self.calc.calc_rate(total_clicked, sending_metrics.total_sent),
            "phish_rate": self.calc.calc_rate(total_phished, sending_metrics.total_sent),
            "unique_users_targeted": len(unique_users),
            "users_who_opened": len(users_opened),
            "users_who_clicked": len(users_clicked),
            "users_who_phished": len(users_phished),
            "repeat_offenders": repeat_offenders,
            "avg_time_to_open_seconds": self.calc.calc_avg_time_delta(sending_metrics.open_times),
            "avg_time_to_click_seconds": self.calc.calc_avg_time_delta(sending_metrics.click_times),
        }

    def get_global_stats(
        self, current_realm: str, session: Session
    ) -> CampaignGlobalStats:
        """Calculate global statistics across all campaigns for the realm."""
        campaigns = session.exec(
            select(Campaign).where(Campaign.realm_name == current_realm)
        ).all()

        metrics = self._compute_global_metrics(list(campaigns))

        status_counts = metrics["status_counts"]

        return CampaignGlobalStats(
            total_campaigns=metrics["total_campaigns"],
            scheduled_campaigns=status_counts[CampaignStatus.SCHEDULED],
            running_campaigns=status_counts[CampaignStatus.RUNNING],
            completed_campaigns=status_counts[CampaignStatus.COMPLETED],
            canceled_campaigns=status_counts[CampaignStatus.CANCELED],
            total_emails_scheduled=metrics["total_emails_scheduled"],
            total_emails_sent=metrics["total_emails_sent"],
            total_emails_opened=metrics["total_emails_opened"],
            total_emails_clicked=metrics["total_emails_clicked"],
            total_emails_phished=metrics["total_emails_phished"],
            total_emails_failed=metrics["total_emails_failed"],
            delivery_rate=metrics["delivery_rate"],
            open_rate=metrics["open_rate"],
            click_rate=metrics["click_rate"],
            phish_rate=metrics["phish_rate"],
            unique_users_targeted=metrics["unique_users_targeted"],
            users_who_opened=metrics["users_who_opened"],
            users_who_clicked=metrics["users_who_clicked"],
            users_who_phished=metrics["users_who_phished"],
            repeat_offenders=metrics["repeat_offenders"],
            avg_time_to_open_seconds=metrics["avg_time_to_open_seconds"],
            avg_time_to_click_seconds=metrics["avg_time_to_click_seconds"],
        )

    def _find_repeat_offenders(
        self, campaigns: Iterable[Campaign], threshold: float | None = None
    ) -> list[str]:
        """Find users who fell for phishing above the given threshold rate."""
        user_campaigns = self._build_user_engagement_from_campaigns(campaigns)
        return self.calc.find_repeat_offenders_from_engagement_dict(
            user_campaigns, threshold=threshold
        )

    def _calc_avg_time_delta(
        self, time_pairs: list[tuple[datetime.datetime, datetime.datetime]]
    ) -> float | None:
        """Calculate average time difference in seconds."""
        return self.calc.calc_avg_time_delta(time_pairs)

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

        metrics = self._extract_sending_metrics(sendings)
        total_sent = metrics.total_sent
        total_failed = metrics.total_failed

        open_times = metrics.open_times
        click_times = metrics.click_times
        opened_dates = metrics.opened_dates
        clicked_dates = metrics.clicked_dates

        campaign_duration = (campaign.end_date - campaign.begin_date).total_seconds()
        elapsed = (min(now, campaign.end_date) - campaign.begin_date).total_seconds()
        time_elapsed_pct = max(0, min(100, self.calc.calc_rate(elapsed, campaign_duration))) if campaign_duration > 0 else 0
        progress_pct = self.calc.calc_rate(total_sent, total_recipients)

        first_open_at, last_open_at = self.calc.extract_min_max_from_dates(opened_dates)
        first_click_at, last_click_at = self.calc.extract_min_max_from_dates(clicked_dates)

        return CampaignDetailInfo(
            id=campaign.id,  # type: ignore
            name=campaign.name,
            description=campaign.description,
            begin_date=campaign.begin_date,
            end_date=campaign.end_date,
            sending_interval_seconds=campaign.sending_interval_seconds,
            status=campaign.status,
            realm_name=campaign.realm_name,
            sending_profile_name=(
                campaign.sending_profile.name if campaign.sending_profile else None
            ),
            phishing_kit_names=[
                kit.name for kit in campaign.phishing_kits
            ],
            total_recipients=total_recipients,
            total_sent=total_sent,
            total_opened=total_opened,
            total_clicked=total_clicked,
            total_phished=total_phished,
            total_failed=total_failed,
            delivery_rate=self.calc.calc_rate(total_sent, total_recipients),
            open_rate=self.calc.calc_rate(total_opened, total_sent),
            click_rate=self.calc.calc_rate(total_clicked, total_sent),
            phish_rate=self.calc.calc_rate(total_phished, total_sent),
            progress_percentage=round(progress_pct, 2),
            time_elapsed_percentage=round(max(0, min(100, time_elapsed_pct)), 2),
            avg_time_to_open_seconds=self._calc_avg_time_delta(open_times),
            avg_time_to_click_seconds=self._calc_avg_time_delta(click_times),
            first_open_at=first_open_at,
            last_open_at=last_open_at,
            first_click_at=first_click_at,
            last_click_at=last_click_at,
            user_sendings=metrics.user_sendings_data,
        )


# Backward compatibility alias
stats_handler = StatsHandler
