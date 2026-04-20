import os

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

from unittest.mock import MagicMock

from src.models import UserSendingInfo
from src.models.org_manager.schemas import UserDetailsDTO
from src.routers.org_manager import user_routes


def test_list_user_details_endpoint_validates_realm_and_calls_service(monkeypatch):
    token = "fake-token"
    realm = "tenant-a"
    user_id = "u-1"

    expected = UserDetailsDTO(
        id=user_id,
        username="jane",
        email="jane@tenant-a.com",
        firstName="Jane",
        lastName="Doe",
        email_verified=True,
        active=True,
        role="ORG_MANAGER",
        realm=realm,
        groups=[],
    )

    mock_validate = MagicMock()
    mock_service = MagicMock()
    mock_service.list_user_details.return_value = expected

    monkeypatch.setattr(user_routes, "validate_realm_access", mock_validate)
    monkeypatch.setattr(user_routes, "org_manager_service", mock_service)

    result = user_routes.list_user_details(realm=realm, user_id=user_id, token=token)

    assert result == expected
    mock_validate.assert_called_once_with(token, realm)
    mock_service.list_user_details.assert_called_once_with(realm, token, user_id)


def test_list_user_sendings_endpoint_validates_realm_and_calls_service(monkeypatch):
    token = "fake-token"
    realm = "tenant-a"
    user_id = "u-1"
    session = MagicMock()

    expected = [
        UserSendingInfo(
            user_id=user_id,
            email="jane@tenant-a.com",
            status="sent",
            campaign_id=10,
            campaign_name="Awareness Campaign",
        )
    ]

    mock_validate = MagicMock()
    mock_campaign_service = MagicMock()
    mock_campaign_service.list_user_sendings.return_value = expected

    monkeypatch.setattr(user_routes, "validate_realm_access", mock_validate)
    monkeypatch.setattr(user_routes, "campaign_service", mock_campaign_service)

    result = user_routes.list_user_sendings(
        realm=realm,
        user_id=user_id,
        session=session,
        token=token,
    )

    assert result == expected
    mock_validate.assert_called_once_with(token, realm)
    mock_campaign_service.list_user_sendings.assert_called_once_with(session, user_id)
