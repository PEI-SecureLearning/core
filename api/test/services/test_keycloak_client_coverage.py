import pytest
from unittest.mock import MagicMock, patch
from src.services.keycloak_client.user_handler import user_handler

@pytest.fixture
def handler():
    with patch("src.services.keycloak_client.base_handler.settings") as mock_settings:
        mock_settings.KEYCLOAK_URL = "http://keycloak"
        mock_settings.CLIENT_SECRET = "secret"
        with patch("src.services.keycloak_client.user_handler.base_handler._make_request") as mock_req:
            h = user_handler()
            h._make_request = mock_req
            yield h

def test_execute_actions_email(handler):
    # Arrange
    realm = "test-realm"
    token = "test-token"
    user_id = "user-123"
    actions = ["UPDATE_PASSWORD", "VERIFY_EMAIL"]
    
    # Act
    handler.execute_actions_email(realm, token, user_id, actions)
    
    # Assert
    handler._make_request.assert_called_once_with(
        "PUT",
        f"http://keycloak/admin/realms/{realm}/users/{user_id}/execute-actions-email",
        token,
        json_data=actions
    )

def test_get_user_handler():
    from src.services.keycloak_client.user_handler import get_user_handler
    h1 = get_user_handler()
    h2 = get_user_handler()
    assert h1 is h2
    assert h1 is not None
