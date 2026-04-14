import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from datetime import datetime
import os

from src.main import app
from src.core.dependencies import get_db
from src.models import Campaign, EmailSending, EmailSendingStatus
from src.core.settings import settings

# Setup SQLite in-memory DB
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


@pytest.fixture(name="client")
def client_fixture(session):
    def get_session_override():
        return session

    app.dependency_overrides[get_db] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="mock_data")
def mock_data_fixture(session):
    now = datetime.now()
    c = Campaign(
        name="Test Camp",
        realm_name="test-realm",
        total_recipients=1,
        sending_interval_seconds=60,
        begin_date=now,
        end_date=now,
    )
    session.add(c)
    session.commit()
    session.refresh(c)

    es = EmailSending(
        campaign_id=c.id,
        user_id="u1",
        email_to="u@test.com",
        scheduled_date=now,
        tracking_token="valid-token-123",
    )
    session.add(es)
    session.commit()
    return {"campaign": c, "email_sending": es}


def test_track_open_success(client: TestClient, mock_data: dict, session: Session):
    response = client.get("/api/track/open?si=valid-token-123")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/gif"
    
    # Verify DB update
    session.refresh(mock_data["email_sending"])
    assert mock_data["email_sending"].status == EmailSendingStatus.OPENED
    assert mock_data["email_sending"].opened_at is not None

    session.refresh(mock_data["campaign"])
    assert mock_data["campaign"].total_opened == 1


def test_track_phish_success_redirect(client: TestClient, mock_data: dict, session: Session):
    response = client.post("/api/track/phish?si=valid-token-123", follow_redirects=False)
    
    # Should be 303 Redirect to frontend
    assert response.status_code == 303
    assert response.headers["location"] == f"{settings.WEB_URL}/oops"
    
    # Verify DB update
    session.refresh(mock_data["email_sending"])
    assert mock_data["email_sending"].status == EmailSendingStatus.PHISHED
    assert mock_data["email_sending"].phished_at is not None
    assert mock_data["email_sending"].opened_at is not None

    session.refresh(mock_data["campaign"])
    assert mock_data["campaign"].total_phished == 1
    assert mock_data["campaign"].total_opened == 1


def test_track_invalid_token(client: TestClient):
    response_open = client.get("/api/track/open?si=invalid-token")
    assert response_open.status_code == 404

    response_phish = client.post("/api/track/phish?si=invalid-token")
    assert response_phish.status_code == 404

def test_simulate_rabbitmq_consumer(session: Session, mock_data: dict):
    from src.services.tracking import TrackingService
    import json
    
    # Simulate the payload the SMTP microservice publishes to AMQP
    mock_rabbitmq_payload = json.dumps({"action": "sent", "tracking_id": "valid-token-123"})
    data = json.loads(mock_rabbitmq_payload)
    
    # Simulate consumer worker processing
    if data.get("action") == "sent" and "tracking_id" in data:
        service = TrackingService()
        service.record_sent(data["tracking_id"], session)
        
    session.refresh(mock_data["email_sending"])
    assert mock_data["email_sending"].status == EmailSendingStatus.SENT
    assert mock_data["email_sending"].sent_at is not None
    
    session.refresh(mock_data["campaign"])
    assert mock_data["campaign"].total_sent == 1
