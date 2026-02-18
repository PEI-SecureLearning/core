from src.services.keycloak_client.base_handler import base_handler
from src.services.keycloak_client.user_handler import user_handler
from src.services.keycloak_client.group_handler import group_handler
from src.services.keycloak_client.role_handler import role_handler
from src.services.keycloak_client.client_handler import client_handler


class KeycloakClient(base_handler, user_handler, group_handler, role_handler, client_handler):
    """Unified Keycloak API client."""

    def __init__(self):
        base_handler.__init__(self)


# Singleton instance
_keycloak_client: KeycloakClient | None = None


def get_keycloak_client() -> KeycloakClient:
    """Get the singleton KeycloakClient instance."""
    global _keycloak_client
    if _keycloak_client is None:
        _keycloak_client = KeycloakClient()
    return _keycloak_client
