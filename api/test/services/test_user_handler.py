import os
import importlib

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

import pytest
from unittest.mock import MagicMock, patch
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from src.services.org_manager import OrgManagerService
from src.services.org_manager.user_handler import validate_email_domain
from src.models import Realm, User, UserProgress, AssignmentStatus
from fastapi import HTTPException

org_user_handler_module = importlib.import_module("src.services.org_manager.user_handler")


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
def mock_kc():
    with patch("src.services.org_manager.base_handler.get_keycloak_client") as mock:
        yield mock.return_value


@pytest.fixture
def mock_kc_admin():
    with patch("src.services.org_manager.user_handler.get_keycloak_admin") as mock:
        mock.return_value.get_domain_for_realm.return_value = ""
        yield mock.return_value


@pytest.fixture
def service(mock_kc, mock_kc_admin):
    # OrgManagerService.__init__ calls base_handler.__init__ which calls get_keycloak_client
    return OrgManagerService()


def test_validate_email_domain_accepts_empty_realm_domain():
    validate_email_domain("person@outside.test", None)
    validate_email_domain("person@outside.test", "")


def test_validate_email_domain_accepts_case_insensitive_match():
    validate_email_domain(" Person@Example.COM ", "example.com")


def test_validate_email_domain_rejects_invalid_email_for_realm_domain():
    with pytest.raises(HTTPException) as exc:
        validate_email_domain("not-an-email", "example.com")

    assert exc.value.status_code == 400
    assert '@example.com' in exc.value.detail


def test_validate_email_domain_rejects_domain_mismatch():
    with pytest.raises(HTTPException) as exc:
        validate_email_domain("person@wrong.test", "example.com")

    assert exc.value.status_code == 400
    assert (
        'Email domain "wrong.test" does not match this organization.'
        in exc.value.detail
    )


def test_list_users(service, mock_kc):
    # Arrange
    mock_kc.list_users.return_value = [
        {"id": "u1", "username": "user1", "email": "u1@test.com", "enabled": True}
    ]
    mock_kc.get_user_realm_roles.return_value = [{"name": "ORG_MANAGER"}]

    # Act
    res = service.list_users("test-realm", "token")

    # Assert
    assert len(res["users"]) == 1
    assert res["users"][0]["is_org_manager"] is True
    assert res["users"][0]["username"] == "user1"


def test_create_user_success(service, mock_kc, session: Session):
    # Arrange
    realm_name = "test-realm"
    session.add(Realm(name=realm_name, domain="test.com"))
    session.commit()

    mock_response = MagicMock(
        status_code=201, headers={"Location": "http://keycloak/u/123"}
    )
    mock_kc.create_user.return_value = mock_response
    mock_kc.get_realm_role.return_value = {"id": "role-id", "name": "DEFAULT_USER"}

    # Act
    res = service.create_user(
        session=session,
        realm=realm_name,
        token="token",
        username="john.doe",
        name="John Doe",
        email="john.doe@test.com",
        role="DEFAULT_USER",
    )

    # Assert
    assert res["status"] == "created"
    assert res["username"] == "john.doe"
    mock_kc.execute_actions_email.assert_called_once_with(
        realm_name, "token", "123", ["UPDATE_PASSWORD"]
    )

    # Verify DB
    db_user = session.get(User, "123")
    assert db_user is not None
    assert db_user.email == "john.doe@test.com"


def test_create_user_normalizes_input_before_keycloak_and_db(
    service, mock_kc, session: Session
):
    realm_name = "test-realm"
    session.add(Realm(name=realm_name, domain="test.com"))
    session.commit()

    mock_kc.create_user.return_value = MagicMock(
        status_code=201, headers={"Location": "/u/123"}
    )
    mock_kc.get_realm_role.return_value = {"id": "role-id", "name": "DEFAULT_USER"}

    res = service.create_user(
        session=session,
        realm=realm_name,
        token="token",
        username=" john.doe ",
        name=" John Doe ",
        email=" JOHN.DOE@TEST.COM ",
        role=" default_user ",
    )

    assert res["username"] == "john.doe"
    mock_kc.create_user.assert_called_once()
    user_data = mock_kc.create_user.call_args.args[2]
    assert user_data["username"] == "john.doe"
    assert user_data["email"] == "john.doe@test.com"
    assert user_data["firstName"] == "John"
    assert user_data["lastName"] == "Doe"
    mock_kc.get_realm_role.assert_called_once_with(
        realm_name, "token", "DEFAULT_USER"
    )

    db_user = session.get(User, "123")
    assert db_user is not None
    assert db_user.email == "john.doe@test.com"


def test_list_users_exception(service, mock_kc):
    mock_kc.list_users.return_value = [{"id": "u1", "username": "u1"}]
    mock_kc.get_user_realm_roles.side_effect = Exception("KC error")
    res = service.list_users("r", "t")
    assert res["users"][0]["is_org_manager"] is False


def test_list_user_details_success(service, mock_kc):
    mock_kc.get_user.return_value = {
        "id": "u1",
        "username": "user1",
        "email": "u1@test.com",
        "firstName": "User",
        "lastName": "One",
        "emailVerified": True,
        "enabled": True,
    }
    mock_kc.get_user_realm_roles.return_value = [{"name": "ORG_MANAGER"}]
    mock_kc.list_user_groups.return_value = [
        {"id": "g1", "name": "Managers"},
        {"name": "NoIdGroup"},
    ]

    details = service.list_user_details("realm-a", "token", "u1")

    assert details.id == "u1"
    assert details.username == "user1"
    assert details.email_verified is True
    assert details.role == "ORG_MANAGER"
    assert details.realm == "realm-a"
    assert len(details.groups) == 1
    assert details.groups[0].id == "g1"
    assert details.groups[0].name == "Managers"


def test_list_user_details_not_found_raises_404(service, mock_kc):
    mock_kc.get_user.return_value = None

    with pytest.raises(HTTPException) as exc:
        service.list_user_details("realm-a", "token", "missing")

    assert exc.value.status_code == 404
    assert exc.value.detail == "User not found."


def test_create_user_with_group(service, mock_kc, session):
    realm_name = "test-realm"
    session.add(Realm(name=realm_name, domain="test.com"))
    session.commit()

    mock_kc.create_user.return_value = MagicMock(
        status_code=201, headers={"Location": "/u/123"}
    )
    mock_kc.get_realm_role.return_value = {"id": "r1"}

    service.create_user(
        session,
        realm_name,
        "t",
        "user1",
        "Name",
        "u1@test.com",
        "DEFAULT_USER",
        group_id="g1",
    )
    mock_kc.add_user_to_group.assert_called_once_with(realm_name, "t", "123", "g1")


def test_create_user_org_manager(service, mock_kc, session):
    realm_name = "test-realm"
    session.add(Realm(name=realm_name, domain="test.com"))
    session.commit()

    mock_kc.create_user.return_value = MagicMock(
        status_code=201, headers={"Location": "/u/123"}
    )
    mock_kc.get_realm_role.return_value = {"id": "role-id"}
    mock_kc.get_client_by_client_id.return_value = {"id": "client-id"}
    mock_kc.get_client_role.return_value = {"id": "admin-role-id"}

    service.create_user(
        session, realm_name, "t", "admin1", "Admin", "admin@test.com", "ORG_MANAGER"
    )

    mock_kc.assign_client_roles.assert_called_once()
    db_user = session.get(User, "123")
    assert db_user.is_org_manager is True


def test_create_user_conflict(service, mock_kc, session):
    mock_kc.create_user.side_effect = HTTPException(status_code=409)
    with pytest.raises(HTTPException) as exc:
        service.create_user(session, "r", "t", "john", "N", "j@t.com", "DEFAULT_USER")
    assert exc.value.status_code == 409
    assert "username or email" in exc.value.detail


def test_delete_user_rejects_self_delete(service, mock_kc, session, monkeypatch):
    monkeypatch.setattr(
        org_user_handler_module,
        "decode_token_verified",
        lambda token: {"iss": "http://idp/realms/tenant-a", "sub": "u-1"},
    )
    monkeypatch.setattr(
        org_user_handler_module,
        "get_realm_from_iss",
        lambda issuer: "tenant-a",
    )

    with pytest.raises(HTTPException) as exc:
        service.delete_user("tenant-a", "token", "u-1", session)

    assert exc.value.status_code == 400
    assert exc.value.detail == "You cannot delete your own account."
    mock_kc.delete_user.assert_not_called()


def test_delete_user_allows_delete_when_token_validation_is_unauthorized(
    service, mock_kc, session, monkeypatch
):
    def raise_unauthorized(token):
        raise HTTPException(status_code=401, detail="Unauthorized")

    monkeypatch.setattr(
        org_user_handler_module,
        "decode_token_verified",
        raise_unauthorized,
    )

    service.delete_user("tenant-a", "bad-token", "u-2", session)

    mock_kc.delete_user.assert_called_once_with("tenant-a", "bad-token", "u-2")


def test_enroll_user_already_enrolled(service, session):
    uid = "u1"
    cid = "c1"
    session.add(
        UserProgress(user_id=uid, course_id=cid, status=AssignmentStatus.ACTIVE)
    )
    session.commit()

    # Should update existing
    res = service.enroll_user(session, uid, [cid])
    assert res["enrolled"] == 1

    p = session.get(UserProgress, {"user_id": uid, "course_id": cid})
    assert p.status == AssignmentStatus.SCHEDULED


def test_is_valid_role(service):
    assert service.is_valid_role("ORG_MANAGER") == "ORG_MANAGER"
    assert service.is_valid_role(" default_user ") == "DEFAULT_USER"

    with pytest.raises(HTTPException) as exc:
        service.is_valid_role("invalid")
    assert exc.value.status_code == 400


def test_is_valid_username(service):
    service.is_valid_username("valid_user")

    with pytest.raises(HTTPException) as exc:
        service.is_valid_username("hi")  # too short
    assert exc.value.status_code == 400


def test_is_valid_email_domain_mismatch(service, session):
    realm_name = "test-realm"
    session.add(Realm(name=realm_name, domain="test.com"))
    session.commit()

    service.kc.list_users.return_value = []

    with pytest.raises(HTTPException) as exc:
        service.is_valid_email(realm_name, session, "token", "user@wrong.com")
    assert exc.value.status_code == 400
    assert "domain" in exc.value.detail


def test_enroll_user(service, session):
    # Arrange
    uid = "u1"
    session.add(User(keycloak_id=uid, email="u1@t.com"))
    session.commit()

    # Act
    res = service.enroll_user(session, uid, ["c1", "c2"])

    # Assert
    assert res["enrolled"] == 2

    # Verify DB
    p = session.get(UserProgress, {"user_id": uid, "course_id": "c1"})
    assert p is not None
    assert p.status == AssignmentStatus.SCHEDULED


def test_delete_user(service, mock_kc, session):
    # Arrange
    uid = "u1"
    session.add(User(keycloak_id=uid, email="u1@t.com"))
    session.commit()

    # Act
    service.delete_user("realm", "token", uid, session)

    # Assert
    mock_kc.delete_user.assert_called_once()
    assert session.get(User, uid) is None
