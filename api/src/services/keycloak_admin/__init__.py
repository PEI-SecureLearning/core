from api.src.services.keycloak_admin.base_handler import Base_handler
from api.src.services.keycloak_admin.realm_handler import Realm_handler
from api.src.services.keycloak_admin.user_handler import User_handler
from api.src.services.keycloak_admin.groups_handler import Groups_handler
from api.src.services.keycloak_admin.event_handler import Event_handler
from api.src.services.keycloak_admin.feature_handler import Feature_handler


class KeycloakAdmin(Base_handler, Realm_handler, User_handler, Groups_handler, Event_handler, Feature_handler):

    def __init__(self):
        Base_handler.__init__(self)


_instance: KeycloakAdmin | None = None


def get_keycloak_admin() -> KeycloakAdmin:
    global _instance
    if _instance is None:
        _instance = KeycloakAdmin()
    return _instance