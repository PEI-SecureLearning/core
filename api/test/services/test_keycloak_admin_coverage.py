import pytest
import json
from unittest.mock import MagicMock, patch, ANY, mock_open
from src.services.keycloak_admin.realm_handler import realm_handler
from src.services.keycloak_admin.user_handler import user_handler
from src.services.keycloak_admin.base_handler import base_handler
from fastapi import HTTPException

@pytest.fixture
def mock_kc():
    with patch("src.services.keycloak_admin.base_handler.get_keycloak_client") as mock:
        yield mock.return_value

def test_base_handler_missing_settings():
    with patch("src.services.keycloak_admin.base_handler.settings") as mock_settings:
        mock_settings.KEYCLOAK_URL = None
        with pytest.raises(HTTPException) as exc:
            base_handler()
        assert exc.value.status_code == 500
        
        mock_settings.KEYCLOAK_URL = "http://kc"
        mock_settings.CLIENT_SECRET = None
        with pytest.raises(HTTPException) as exc:
            base_handler()
        assert exc.value.status_code == 500

def test_load_realm_template(mock_kc):
    bh = base_handler()
    # Create a dummy template file for testing
    template_content = '{"key": "{sub}"}'
    with patch("builtins.open", mock_open(read_data=template_content)):
        res = bh._load_realm_template(sub="value")
        assert res == {"key": "value"}

def test_create_realm_with_smtp_and_required_actions(mock_kc):
    # Arrange
    rh = realm_handler()
    rh.keycloak_url = "http://keycloak"
    rh.web_url = "http://web"
    rh.api_url = "http://api"
    rh.smtp_password = "test-password"
    rh.smtp_user = "test-user"
    rh.smtp_from = "test-from"
    
    # Mock template loading
    template = {
        "client_scopes": [],
        "default_default_client_scopes": [],
        "enabled_event_types": ["LOGIN"],
        "realm_roles": [{"name": "admin"}],
        "clients": [{"clientId": "c1"}],
        "users": [{"username": "u1"}],
        "smtpServer": {"host": "smtp.gmail.com"},
        "requiredActions": [{"alias": "UPDATE_PASSWORD"}]
    }
    with patch.object(rh, "_load_realm_template", return_value=template) as mock_load:
        # Act
        rh.create_realm("new-realm", "admin@test.com", "test.com")
        
        # Assert
        mock_load.assert_called_once_with(
            web_url="http://web",
            api_url="http://api",
            admin_email="admin@test.com",
            smtp_password="test-password",
            smtp_user="test-user",
            smtp_from="test-from"
        )
        
        # Verify payload sent to Keycloak
        args, kwargs = mock_kc._make_request.call_args
        payload = kwargs["json_data"]
        assert payload["realm"] == "new-realm"
        assert payload["smtpServer"] == template["smtpServer"]
        assert payload["requiredActions"] == template["requiredActions"]
        assert payload["roles"]["realm"] == template["realm_roles"]
        assert payload["clients"] == template["clients"]
        assert payload["users"] == template["users"]

def test_add_user_triggers_email(mock_kc):
    # Arrange
    uh = user_handler()
    session = MagicMock()
    
    mock_response = MagicMock(
        status_code=201, 
        headers={"Location": "http://keycloak/u/123"}
    )
    mock_kc.create_user.return_value = mock_response
    mock_kc.get_realm_role.return_value = {"id": "r1"}
    
    # Act
    uh.add_user(session, "realm", "user", "pass", "Full Name", "user@test.com", "ORG_MANAGER")
    
    # Assert
    mock_kc.execute_actions_email.assert_called_once_with(
        "realm", ANY, "123", ["UPDATE_PASSWORD"]
    )

def test_add_user_location_missing(mock_kc):
    uh = user_handler()
    session = MagicMock()
    mock_response = MagicMock(status_code=201, headers={})
    mock_kc.create_user.return_value = mock_response
    
    res = uh.add_user(session, "r", "u", "p")
    assert res == mock_response
    mock_kc.execute_actions_email.assert_not_called()

def test_create_realm_with_features(mock_kc):
    rh = realm_handler()
    rh.keycloak_url = "http://keycloak"
    rh.web_url = "http://web"
    rh.api_url = "http://api"
    rh.smtp_password = "test-password"
    rh.smtp_user = "test-user"
    rh.smtp_from = "test-from"
    
    template = {
        "client_scopes": [],
        "default_default_client_scopes": [],
        "enabled_event_types": [],
        "realm_roles": [],
        "clients": [],
        "users": []
    }
    with patch.object(rh, "_load_realm_template", return_value=template):
        features = {"test_feature": True}
        rh.create_realm("realm", "admin@test.com", "test.com", features=features)
        
        args, kwargs = mock_kc._make_request.call_args
        payload = kwargs["json_data"]
        assert len(payload["clientScopes"]) == 1
        assert payload["clientScopes"][0]["name"] == "realm-feature-flags"
        assert payload["defaultDefaultClientScopes"] == ["realm-feature-flags"]

def test_singletons():
    from src.services.keycloak_admin.realm_handler import get_realm_handler
    from src.services.keycloak_admin.user_handler import get_user_handler
    from src.services.keycloak_admin.base_handler import get_base_handler
    
    assert get_realm_handler() is get_realm_handler()
    assert get_user_handler() is get_user_handler()
    assert get_base_handler() is get_base_handler()
