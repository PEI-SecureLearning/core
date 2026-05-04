import os
import importlib
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

os.environ.update(
    {
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "testuser",
        "POSTGRES_PASSWORD": "testpassword",
        "RABBITMQ_HOST": "localhost",
        "RABBITMQ_USER": "guest",
        "RABBITMQ_PASS": "guest",
        "RABBITMQ_QUEUE": "email_queue",
    }
)

from src.models import Realm, User
from src.services.platform_admin import PlatformAdminService

platform_user_handler_module = importlib.import_module(
    "src.services.platform_admin.user_handler"
)


@pytest.fixture(name="engine")
def engine_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture
def mock_admin():
    with patch("src.services.platform_admin.base_handler.get_keycloak_admin") as mock:
        yield mock.return_value


@pytest.fixture
def service(mock_admin):
    return PlatformAdminService()


def test_create_user_in_realm_normalizes_input_and_assigns_role(
    service, mock_admin, session
):
    session.add(Realm(name="tenant-a", domain="tenant.test"))
    session.commit()
    mock_admin.add_user.return_value = MagicMock(
        headers={"Location": "http://keycloak/users/u-1"}
    )
    service._assign_roles = MagicMock()

    result = service.create_user_in_realm(
        session=session,
        realm="tenant-a",
        username=" jane.doe ",
        name=" Jane Doe ",
        email=" JANE.DOE@TENANT.TEST ",
        role=" org_manager ",
    )

    assert result.username == "jane.doe"
    mock_admin.add_user.assert_called_once()
    assert mock_admin.add_user.call_args.args[:4] == (
        session,
        "tenant-a",
        "jane.doe",
        result.temporary_password,
    )
    assert mock_admin.add_user.call_args.kwargs["full_name"] == "Jane Doe"
    assert mock_admin.add_user.call_args.kwargs["email"] == "jane.doe@tenant.test"
    assert mock_admin.add_user.call_args.kwargs["role"] == "ORG_MANAGER"
    service._assign_roles.assert_called_once_with("tenant-a", "u-1", "ORG_MANAGER")

    db_user = session.get(User, "u-1")
    assert db_user is not None
    assert db_user.email == "jane.doe@tenant.test"
    assert db_user.is_org_manager is True


def test_create_user_in_realm_rejects_email_outside_realm_domain(
    service, mock_admin, session
):
    session.add(Realm(name="tenant-a", domain="tenant.test"))
    session.commit()

    with pytest.raises(HTTPException) as exc:
        service.create_user_in_realm(
            session=session,
            realm="tenant-a",
            username="jane",
            name="Jane",
            email="jane@other.test",
            role="DEFAULT_USER",
        )

    assert exc.value.status_code == 400
    assert (
        'Email domain "other.test" does not match this organization.'
        in exc.value.detail
    )
    mock_admin.add_user.assert_not_called()


def test_create_user_in_realm_maps_keycloak_conflict_to_user_friendly_error(
    service, mock_admin, session
):
    mock_admin.get_domain_for_realm.return_value = None
    mock_admin.add_user.side_effect = HTTPException(status_code=409, detail="Conflict")

    with pytest.raises(HTTPException) as exc:
        service.create_user_in_realm(
            session=session,
            realm="tenant-a",
            username="jane",
            name="Jane",
            email="jane@tenant.test",
            role="DEFAULT_USER",
        )

    assert exc.value.status_code == 409
    assert "username or email" in exc.value.detail


def test_delete_user_in_realm_rejects_self_delete(
    service, mock_admin, session, monkeypatch
):
    monkeypatch.setattr(
        platform_user_handler_module,
        "decode_token_verified",
        lambda token: {"iss": "http://idp/realms/tenant-a", "sub": "u-1"},
    )
    monkeypatch.setattr(
        platform_user_handler_module,
        "get_realm_from_iss",
        lambda issuer: "tenant-a",
    )

    with pytest.raises(HTTPException) as exc:
        service.delete_user_in_realm("tenant-a", "u-1", session, "token")

    assert exc.value.status_code == 400
    assert exc.value.detail == "You cannot delete your own account."
    mock_admin.delete_user.assert_not_called()


def test_assign_roles_grants_realm_admin_client_role_for_org_manager(
    service, mock_admin
):
    mock_admin._get_admin_token.return_value = "admin-token"
    mock_admin.keycloak_client.get_client_by_client_id.return_value = {
        "id": "realm-management-id"
    }
    mock_admin.keycloak_client.get_client_role.return_value = {"name": "realm-admin"}

    service._assign_roles("tenant-a", "u-1", "ORG_MANAGER")

    mock_admin.assign_realm_role_to_user.assert_called_once_with(
        "tenant-a", "u-1", "ORG_MANAGER"
    )
    mock_admin.keycloak_client.assign_client_roles.assert_called_once_with(
        "tenant-a",
        "admin-token",
        "u-1",
        "realm-management-id",
        [{"name": "realm-admin"}],
    )
