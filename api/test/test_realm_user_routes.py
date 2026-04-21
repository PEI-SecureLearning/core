import os
from unittest.mock import MagicMock

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

from src.routers.realm import user_routes


def test_delete_user_in_realm_passes_token_to_service(monkeypatch):
    service = MagicMock()
    monkeypatch.setattr(user_routes, "realm_service", service)

    result = user_routes.delete_user_in_realm(
        realm="tenant-a",
        user_id="u-1",
        session=MagicMock(),
        token="access-token",
    )

    assert result is None
    service.validate_realm_access.assert_called_once_with("access-token", "tenant-a")
    service.delete_user_in_realm.assert_called_once()
    assert service.delete_user_in_realm.call_args.args[0] == "tenant-a"
    assert service.delete_user_in_realm.call_args.args[1] == "u-1"
    assert service.delete_user_in_realm.call_args.args[3] == "access-token"


def test_admin_delete_user_in_realm_passes_token_to_service(monkeypatch):
    service = MagicMock()
    monkeypatch.setattr(user_routes, "realm_service", service)
    session = MagicMock()

    result = user_routes.admin_delete_user_in_realm(
        realm="tenant-a",
        user_id="u-1",
        session=session,
        token="access-token",
    )

    assert result is None
    service.delete_user_in_realm.assert_called_once_with(
        "tenant-a", "u-1", session, "access-token"
    )
