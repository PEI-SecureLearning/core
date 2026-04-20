from src.services.keycloak_client import get_keycloak_client


class base_handler:

    def __init__(self):
        self.kc = get_keycloak_client()
