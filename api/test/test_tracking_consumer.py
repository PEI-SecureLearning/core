import json
import pytest
from unittest.mock import patch, MagicMock
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool
from datetime import datetime
from uuid import uuid4

from src.models import User, Campaign, EmailSending, EmailSendingStatus
from src.core.db import engine
from src.tasks.tracking_consumer import process_tracking_message

# Create an in-memory database for testing
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@pytest.fixture(name="session")
def session_fixture():
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_tracking_consumer_updates_database(session: Session):
    # 0. Setup User
    user = User(keycloak_id="u1", email="alice@test.com")
    session.add(user)
    session.commit()

    # 1. Setup Database Mock State
    campaign = Campaign(
        name="Test Consumer Campaign", 
        company_name="Corp", 
        total_sent=0,
        begin_date=datetime.now(),
        end_date=datetime.now()
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    email = EmailSending(
        campaign_id=campaign.id,
        user_id="u1",
        first_name="Alice",
        last_name="Test",
        email_to="alice@test.com",
        scheduled_date=datetime.now(),
        tracking_token=str(uuid4()),
        status=EmailSendingStatus.QUEUED  # Simulating the scheduler's queuing state
    )
    session.add(email)
    session.commit()
    session.refresh(email)

    campaign_id = campaign.id
    email_id = email.id

    # 2. Setup RabbitMQ Mock Payload
    payload = {
        "action": "sent",
        "tracking_id": email.tracking_token
    }
    
    # 3. Mock the get_db context manager inside the consumer
    # Because run_tracking_consumer creates its own session from the global engine,
    # we patch it to yield our testing session instead.
    with patch("src.tasks.tracking_consumer.Session", return_value=session):
        # Simulate pika channel/method/properties, not used by the script extensively
        mock_channel = MagicMock()
        mock_method = MagicMock()
        mock_method.delivery_tag = 1
        
        # ACT: simulate a message consumption
        process_tracking_message(mock_channel, mock_method, None, json.dumps(payload).encode('utf-8'))
        
        # Verify message was acknowledged
        mock_channel.basic_ack.assert_called_once_with(1)

    # 4. Assert Database State was Mutated Correctly
    # We refetch because the with session block in the consumer closed our mock session
    email_db = session.get(EmailSending, email_id)
    campaign_db = session.get(Campaign, campaign_id)

    # The consumer should have flipped it from QUEUED to SENT
    assert email_db.status == EmailSendingStatus.SENT
    assert email_db.sent_at is not None
    assert type(email_db.sent_at) is datetime
    
    # And campaign counter must have incremented exactly once based on the event
    assert campaign_db.total_sent == 1
