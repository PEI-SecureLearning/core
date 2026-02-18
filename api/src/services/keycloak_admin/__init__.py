from src.services.keycloak_admin.base_handler import base_handler
from src.services.keycloak_admin.realm_handler import realm_handler
from src.services.keycloak_admin.user_handler import user_handler
from src.services.keycloak_admin.groups_handler import groups_handler
from src.services.keycloak_admin.event_handler import event_handler
from src.services.keycloak_admin.feature_handler import feature_handler


class KeycloakAdmin(base_handler, realm_handler, user_handler, groups_handler, event_handler, feature_handler):

    def __init__(self):
        base_handler.__init__(self)


_instance: KeycloakAdmin | None = None


def get_keycloak_admin() -> KeycloakAdmin:
    global _instance
    if _instance is None:
        _instance = KeycloakAdmin()
    return _instance