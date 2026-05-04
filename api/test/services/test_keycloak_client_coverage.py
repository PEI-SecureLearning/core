import pytest
from unittest.mock import MagicMock, patch, ANY
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

def test_user_handler_client_methods(handler):
    realm = "r"
    token = "t"
    user_id = "u"
    
    # list_users
    handler._make_request.return_value.json.return_value = []
    assert handler.list_users(realm, token) == []
    
    # create_user
    handler.create_user(realm, token, {"username": "u"})
    handler._make_request.assert_called_with("POST", ANY, token, json_data={"username": "u"})
    
    # delete_user
    handler.delete_user(realm, token, user_id)
    handler._make_request.assert_called_with("DELETE", ANY, token)
    
    # get_user
    handler._make_request.return_value.json.return_value = {"id": user_id}
    assert handler.get_user(realm, token, user_id) == {"id": user_id}
    
    # get_user 404
    from fastapi import HTTPException
    handler._make_request.side_effect = HTTPException(status_code=404)
    assert handler.get_user(realm, token, user_id) is None
    
    # get_user other error
    handler._make_request.side_effect = HTTPException(status_code=500)
    with pytest.raises(HTTPException):
        handler.get_user(realm, token, user_id)
    
    # get_user_realm_roles
    handler._make_request.side_effect = None
    handler._make_request.return_value.json.return_value = []
    assert handler.get_user_realm_roles(realm, token, user_id) == []

    # get_user_realm_roles 404
    handler._make_request.side_effect = HTTPException(status_code=404)
    assert handler.get_user_realm_roles(realm, token, user_id) == []
    
    # get_user_realm_roles other error
    handler._make_request.side_effect = HTTPException(status_code=500)
    with pytest.raises(HTTPException):
        handler.get_user_realm_roles(realm, token, user_id)

    # get_userinfo
    handler._make_request.side_effect = None
    handler._make_request.return_value.json.return_value = {"sub": "id"}
    assert handler.get_userinfo(realm, token) == {"sub": "id"}
