from api.src.services.platform_admin.base_handler import Base_handler
from api.src.services.platform_admin.realm_handler import Realm_handler
from api.src.services.platform_admin.user_handler import User_handler
from api.src.services.platform_admin.group_handler import Group_handler
from api.src.services.platform_admin.logo_handler import Logo_handler
from api.src.services.platform_admin.event_handler import Event_handler


class PlatformAdminService(Base_handler, Realm_handler, User_handler, Group_handler, Logo_handler, Event_handler):
    """Unified platform admin service composing all domain handlers."""

    def __init__(self):
        Base_handler.__init__(self)


_instance: PlatformAdminService | None = None


def get_platform_admin_service() -> PlatformAdminService:
    global _instance
    if _instance is None:
        _instance = PlatformAdminService()
    return _instance
