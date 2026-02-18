from src.services.platform_admin.base_handler import base_handler
from src.services.platform_admin.realm_handler import realm_handler
from src.services.platform_admin.user_handler import user_handler
from src.services.platform_admin.group_handler import group_handler
from src.services.platform_admin.logo_handler import logo_handler
from src.services.platform_admin.event_handler import event_handler


class PlatformAdminService(base_handler, realm_handler, user_handler, group_handler, logo_handler, event_handler):
    """Unified platform admin service composing all domain handlers."""

    def __init__(self):
        base_handler.__init__(self)


_instance: PlatformAdminService | None = None


def get_platform_admin_service() -> PlatformAdminService:
    global _instance
    if _instance is None:
        _instance = PlatformAdminService()
    return _instance
