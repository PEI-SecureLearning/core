from src.services.admin_service.Base_handler import Base_handler
from src.services.admin_service.Realm_handler import Realm_handler
from src.services.admin_service.User_handler import User_handler
from src.services.admin_service.Groups_handler import Groups_handler
from src.services.admin_service.Event_handler import Event_handler
from src.services.admin_service.Feature_handler import Feature_handler


class Admin_Service(Base_handler, Realm_handler, User_handler, Groups_handler, Event_handler, Feature_handler):

    def __init__(self):
        Base_handler.__init__(self)


_admin_service: Admin_Service | None = None


def get_admin_service() -> Admin_Service:
    """Get the Admin_Service singleton instance."""
    global _admin_service

    if _admin_service is None:
        _admin_service = Admin_Service()
        
    return _admin_service