from src.services.keycloak_client import get_keycloak_client


class Base_handler:

    def __init__(self):
        self.kc = get_keycloak_client()
