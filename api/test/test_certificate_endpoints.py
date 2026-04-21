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
        "KEYCLOAK_URL": "http://fake-keycloak:8080",
        "CLIENT_SECRET": "fake-secret",
    }
)

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

from src.main import app
from src.core.dependencies import get_db, get_current_realm
from src.core.security import oauth_2_scheme
from src.routers import certificates as certificates_router

client = TestClient(app)


@pytest.fixture(autouse=True)
def override_dependencies():
    mock_session = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_session
    app.dependency_overrides[oauth_2_scheme] = lambda: "fake-token"
    app.dependency_overrides[get_current_realm] = lambda: "test-realm"

    yield

    app.dependency_overrides = {}


@pytest.mark.anyio
async def test_get_my_certificates_endpoint():
    expected = [
        {
            "user_id": "user-123",
            "course_id": "course-1",
            "last_emission_date": "2026-04-19T10:00:00",
            "expiration_date": "2027-04-19T10:00:00",
            "expired": False,
            "course_name": "Course A",
            "course_cover_image_link": "cover-1",
            "difficulty": "Easy",
            "category": "Awareness",
            "realm": "test-realm",
        }
    ]

    with patch("src.routers.certificates.decode_token_verified") as mock_decode:
        with patch(
            "src.services.progress.list_certificates", new_callable=AsyncMock
        ) as mock_list:
            mock_decode.return_value = {"sub": "user-123"}
            mock_list.return_value = expected

            response = client.get("/api/users/me/certificates")

    assert response.status_code == 200
    assert response.json() == expected
    mock_list.assert_awaited_once_with(
        user_id="user-123",
        session=app.dependency_overrides[get_db](),
        realm_name="test-realm",
        include_expired=False,
    )


@pytest.mark.anyio
async def test_get_user_certificates_endpoint_function_as_org_manager():
    expected = [
        {
            "user_id": "user-456",
            "course_id": "course-2",
            "last_emission_date": "2026-04-19T10:00:00",
            "expiration_date": "2027-04-19T10:00:00",
            "expired": False,
            "course_name": "Course B",
            "course_cover_image_link": "cover-2",
            "difficulty": "Medium",
            "category": "Phishing",
            "realm": "test-realm",
        }
    ]

    mock_session = MagicMock()
    with patch(
        "src.services.progress.list_certificates", new_callable=AsyncMock
    ) as mock_list:
        mock_list.return_value = expected

        result = await certificates_router.get_user_certificates(
            user_id="user-456",
            session=mock_session,
            realm="test-realm",
            token="fake-token",
            include_expired=True,
        )

    assert result == expected
    mock_list.assert_awaited_once_with(
        user_id="user-456",
        session=mock_session,
        realm_name="test-realm",
        include_expired=True,
    )


@pytest.mark.anyio
async def test_get_my_certificates_missing_sub_returns_401():
    with patch("src.routers.certificates.decode_token_verified") as mock_decode:
        mock_decode.return_value = {}
        response = client.get("/api/users/me/certificates")

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"


@pytest.mark.anyio
async def test_get_my_certificates_include_expired_true_is_forwarded():
    expected = []

    with patch("src.routers.certificates.decode_token_verified") as mock_decode:
        with patch(
            "src.services.progress.list_certificates", new_callable=AsyncMock
        ) as mock_list:
            mock_decode.return_value = {"sub": "user-123"}
            mock_list.return_value = expected

            response = client.get("/api/users/me/certificates?include_expired=true")

    assert response.status_code == 200
    assert response.json() == expected
    mock_list.assert_awaited_once_with(
        user_id="user-123",
        session=app.dependency_overrides[get_db](),
        realm_name="test-realm",
        include_expired=True,
    )
