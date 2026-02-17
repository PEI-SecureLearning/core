from src.services.keycloak_client.Base_handler import Base_handler
from src.services.keycloak_client.User_handler import User_handler
from src.services.keycloak_client.Group_handler import Group_handler
from src.services.keycloak_client.Role_handler import Role_handler
from src.services.keycloak_client.Client_handler import Client_handler


class KeycloakClient(Base_handler, User_handler, Group_handler, Role_handler, Client_handler):
    """Unified Keycloak API client."""

    def __init__(self):
        Base_handler.__init__(self)


# Singleton instance
_keycloak_client: KeycloakClient | None = None


def get_keycloak_client() -> KeycloakClient:
    """Get the singleton KeycloakClient instance."""
    global _keycloak_client
    if _keycloak_client is None:
        _keycloak_client = KeycloakClient()
    return _keycloak_client
