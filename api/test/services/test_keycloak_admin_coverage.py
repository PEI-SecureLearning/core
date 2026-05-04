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

def test_realm_handler_methods(mock_kc):
    rh = realm_handler()
    # Mock for get_realm
    mock_kc._make_request.return_value.json.return_value = {"realm": "test", "attributes": {"tenant-domain": ["test.com"]}}
    assert rh.get_realm("test")["realm"] == "test"
    
    # delete_realm
    rh.delete_realm("test")
    mock_kc._make_request.assert_called_with("DELETE", ANY, ANY)
    
    # delete_realm system
    with pytest.raises(HTTPException) as exc:
        rh.delete_realm("master")
    assert exc.value.status_code == 403

    # Mock for find_realm_by_domain (expects a list)
    mock_kc._make_request.return_value.json.return_value = [{"realm": "test", "attributes": {"tenant-domain": ["test.com"]}}]
    assert rh.find_realm_by_domain("test.com") == "test"
    assert rh.find_realm_by_domain("other.com") is None

    # list_realms
    mock_kc._make_request.return_value.json.return_value = [
        {"realm": "test", "id": "1", "attributes": {"tenant-domain": "test.com"}}, 
        {"realm": "master"}
    ]
    with patch("src.services.keycloak_admin.feature_handler.get_feature_handler") as mock_fh:
        mock_fh.return_value.get_realm_features.return_value = {}
        res = rh.list_realms()
        assert len(res) == 1
        assert res[0]["realm"] == "test"
        
    # get_domain_for_realm
    mock_kc._make_request.return_value.json.return_value = {"attributes": {"tenant-domain": "test.com"}}
    assert rh.get_domain_for_realm("test") == "test.com"
    
    # update_realm_attributes
    rh.update_realm_attributes("test", {"new": "attr"})
    mock_kc._make_request.assert_called_with("PUT", ANY, ANY, json_data={"attributes": ANY})
    
    # update_realm_attributes (not a dict)
    mock_kc._make_request.return_value.json.return_value = {"attributes": None}
    rh.update_realm_attributes("test", {"new": "attr"})

    # extract_tenant_domain (not a dict)
    assert rh.extract_tenant_domain({"attributes": None}) is None
    # extract_tenant_domain (no tenant-domain)
    assert rh.extract_tenant_domain({"attributes": {}}) is None

def test_user_handler_methods(mock_kc):
    uh = user_handler()
    
    # list_users
    uh.list_users("realm")
    mock_kc.list_users.assert_called_once()
    
    # get_user_count
    mock_kc._make_request.return_value.json.return_value = 5
    assert uh.get_user_count("realm") == 5
    
    # delete_user
    uh.delete_user("realm", "id")
    mock_kc.delete_user.assert_called_once()

    # get_user_realm_roles
    uh.get_user_realm_roles("realm", "id")
    mock_kc.get_user_realm_roles.assert_called_once()

    # role assignments
    mock_kc.get_realm_role.return_value = {"name": "role"}
    uh.assign_realm_role_to_user("realm", "id", "role")
    mock_kc.assign_realm_roles.assert_called_once()
    
    uh.remove_realm_role_from_user("realm", "id", "role")
    mock_kc.remove_realm_roles.assert_called_once()
    
    # test add_user local DB interactions
    session = MagicMock()
    mock_kc.create_user.return_value.status_code = 201
    mock_kc.create_user.return_value.headers = {"Location": "/123"}
    session.get.return_value = None # user not exists
    uh.add_user(session, "realm", "user", "pass", role="USER")
    assert session.add.called
    
    session.get.return_value = MagicMock() # user exists
    uh.add_user(session, "realm", "user", "pass", role="USER")
    assert session.commit.called
