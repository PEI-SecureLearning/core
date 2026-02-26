"""Pure statistics calculation logic for campaigns (no DB dependencies)."""

from collections.abc import Iterable
import datetime
from typing import Optional



class CampaignStatCalculator:
    """Pure stat calculations that don't depend on the database or ORM models.

    Configuration values are read from the application's `settings` so they
    can be adjusted via environment variables in different deployments.
    """
    
    # Default fallback in case settings are not available
    DEFAULT_REPEAT_OFFENDER_THRESHOLD = 0.5

    @staticmethod
    def calc_avg_time_delta(
        time_pairs: list[tuple[datetime.datetime, datetime.datetime]]
    ) -> Optional[float]:
        """Calculate average time difference in seconds."""
        time_pairs = [(start, end) for start, end in time_pairs if start and end]
        
        if not time_pairs:
            return None
        
        total_seconds = sum((end - start).total_seconds() for start, end in time_pairs)
        return round(total_seconds / len(time_pairs), 2)

    @staticmethod
    def calc_rate(numerator: float, denominator: float, decimals: int = 2) -> float:
        """Calculate a percentage rate."""
        if denominator <= 0:
            return 0.0
        return round((numerator / denominator) * 100, decimals)

    @classmethod
    def find_repeat_offenders_from_engagement_dict(
        cls,
        user_engagement: dict[str, dict[str, int]],
        threshold: Optional[float] = None,
    ) -> list[str]:
        """Identify users who fell for phishing at high rates.

        This method expects a pre-aggregated dict of user engagement, where each
        user has 'targeted' and 'fell' counts.

        Args:
            user_engagement: Dict where each key is user_id and value is
                {'targeted': int, 'fell': int}
            threshold: Fall rate threshold above which user is flagged.
                Defaults to class REPEAT_OFFENDER_THRESHOLD.

        Returns:
            List of user_ids who exceed threshold (higher fall rate).
        """
        if threshold is None:
            try:
                from src.core.settings import settings

                threshold = float(getattr(settings, "REPEAT_OFFENDER_THRESHOLD", cls.DEFAULT_REPEAT_OFFENDER_THRESHOLD))
            except Exception:
                threshold = cls.DEFAULT_REPEAT_OFFENDER_THRESHOLD

        return [
            user_id
            for user_id, stats in user_engagement.items()
            if stats["targeted"] > 0 and stats["fell"] / stats["targeted"] > threshold
        ]

    @staticmethod
    def count_status_occurrences(
        status_list: list[str], possible_statuses: list[str]
    ) -> dict[str, int]:
        """Count occurrences of each status."""
        counts = dict.fromkeys(possible_statuses, 0)
        for status in status_list:
            counts[status] += 1
        return counts



    @staticmethod
    def extract_min_max_from_dates(dates: list[datetime.datetime]) -> tuple[
        Optional[datetime.datetime], Optional[datetime.datetime]
    ]:
        """Extract min and max from a list of datetimes."""
        if not dates:
            return None, None
        return min(dates), max(dates)

    @staticmethod
    def aggregate_user_stats(
        user_targeting: dict[str, set[bool]],
    ) -> dict[str, int]:
        """Convert user targeting info into vulnerability stats.

        This is a helper to convert sets of engagement flags per user into counts.

        Args:
            user_targeting: Dict where key is user_id and value is set of bools
                indicating if they engaged (True) or not (False).

        Returns:
            Dict with keys: unique_users, users_engaged.
        """
        unique_users = len(user_targeting)
        users_engaged = sum(1 for fell in user_targeting.values() if fell)
        return {"unique_users": unique_users, "users_engaged": users_engaged}

