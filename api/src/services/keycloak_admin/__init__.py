from src.services.keycloak_admin.Base_handler import Base_handler
from src.services.keycloak_admin.Realm_handler import Realm_handler
from src.services.keycloak_admin.User_handler import User_handler
from src.services.keycloak_admin.Groups_handler import Groups_handler
from src.services.keycloak_admin.Event_handler import Event_handler
from src.services.keycloak_admin.Feature_handler import Feature_handler


class KeycloakAdmin(Base_handler, Realm_handler, User_handler, Groups_handler, Event_handler, Feature_handler):

    def __init__(self):
        Base_handler.__init__(self)


_instance: KeycloakAdmin | None = None


def get_keycloak_admin() -> KeycloakAdmin:
    global _instance
    if _instance is None:
        _instance = KeycloakAdmin()
    return _instance