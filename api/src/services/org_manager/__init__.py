from api.src.services.org_manager.base_handler import Base_handler
from api.src.services.org_manager.user_handler import User_handler
from api.src.services.org_manager.group_handler import Group_handler


class OrgManagerService(Base_handler, User_handler, Group_handler):
    """Unified org manager service composing all domain handlers."""

    def __init__(self):
        Base_handler.__init__(self)


_instance: OrgManagerService | None = None


def get_org_manager_service() -> OrgManagerService:
    global _instance
    if _instance is None:
        _instance = OrgManagerService()
    return _instance
