import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from src.routers.realm import realm_routes
from src.models import RealmCreate, RealmFeatureToggle

def test_list_tenants(monkeypatch):
    mock_service = MagicMock()
    mock_service.list_realms.return_value = ["realm1", "realm2"]
    monkeypatch.setattr(realm_routes, "realm_service", mock_service)
    
    assert realm_routes.list_tenants() == ["realm1", "realm2"]

def test_get_platform_logs(monkeypatch):
    mock_service = MagicMock()
    mock_service.get_platform_logs.return_value = ["log1"]
    monkeypatch.setattr(realm_routes, "realm_service", mock_service)
    
    assert realm_routes.get_platform_logs(max_results=10) == ["log1"]

def test_get_realms_by_domain(monkeypatch):
    mock_service = MagicMock()
    mock_service.find_realm_by_domain.return_value = "realm1"
    monkeypatch.setattr(realm_routes, "realm_service", mock_service)
    
    assert realm_routes.get_realms_by_domain("test.com") == {"realm": "realm1"}
    
    mock_service.find_realm_by_domain.return_value = None
    with pytest.raises(HTTPException) as exc:
        realm_routes.get_realms_by_domain("none.com")
    assert exc.value.status_code == 404

def test_create_realm(monkeypatch):
    mock_service = MagicMock()
    session = MagicMock()
    realm_data = RealmCreate(name="n", domain="d", adminEmail="e@e.com")
    monkeypatch.setattr(realm_routes, "realm_service", mock_service)
    
    realm_routes.create_realm(realm_data, session)
    mock_service.create_realm_in_keycloak.assert_called_once_with(realm_data, session)

def test_delete_realm(monkeypatch):
    mock_service = MagicMock()
    session = MagicMock()
    monkeypatch.setattr(realm_routes, "realm_service", mock_service)
    
    realm_routes.delete_realm("realm1", session)
    mock_service.delete_realm_from_keycloak.assert_called_once_with("realm1", session)

def test_get_realm_info(monkeypatch):
    mock_service = MagicMock()
    session = MagicMock()
    mock_service.get_realm_info.return_value = {"info": "ok"}
    monkeypatch.setattr(realm_routes, "realm_service", mock_service)
    
    assert realm_routes.get_realm_info("realm1", session) == {"realm": {"info": "ok"}}
    
    mock_service.get_realm_info.return_value = None
    with pytest.raises(HTTPException) as exc:
        realm_routes.get_realm_info("realm1", session)
    assert exc.value.status_code == 404

def test_toggle_realm_feature(monkeypatch):
    mock_service = MagicMock()
    monkeypatch.setattr(realm_routes, "realm_service", mock_service)
    toggle = RealmFeatureToggle(enabled=True)
    
    mock_service.admin.toggle_realm_feature.return_value = True
    assert realm_routes.toggle_realm_feature("realm1", "f1", toggle) == {"success": True}
    
    mock_service.admin.toggle_realm_feature.return_value = False
    with pytest.raises(HTTPException) as exc:
        realm_routes.toggle_realm_feature("realm1", "f1", toggle)
    assert exc.value.status_code == 500
