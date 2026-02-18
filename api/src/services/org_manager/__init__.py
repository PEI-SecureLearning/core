from src.services.org_manager.base_handler import base_handler
from src.services.org_manager.user_handler import user_handler
from src.services.org_manager.group_handler import group_handler


class OrgManagerService(base_handler, user_handler, group_handler):
    """Unified org manager service composing all domain handlers."""

    def __init__(self):
        base_handler.__init__(self)


_instance: OrgManagerService | None = None


def get_org_manager_service() -> OrgManagerService:
    global _instance
    if _instance is None:
        _instance = OrgManagerService()
    return _instance
