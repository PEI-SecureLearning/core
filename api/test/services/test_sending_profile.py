from typing import List
import pytest
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

# Import the models and service we're testing
from src.models.sending_profile import (
    SendingProfile,
    SendingProfileCreate,
    SendingProfileDisplayInfo,
)
from src.models.custom_header import CustomHeader, CustomHeaderCreate
from src.services.sending_profile import SendingProfileService

# Fixtures

@pytest.fixture(name="engine")
def engine_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # This creates all tables defined by SQLModel classes (SendingProfile,
    # CustomHeader, etc.) — similar to schema.sql or Hibernate auto-DDL
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture(name="service")
def service_fixture():
    return SendingProfileService()

# Helpers

def _profile_data(**overrides) -> SendingProfileCreate:
    defaults = dict(
        name="Test Profile",
        smtp_host="smtp.example.com",
        smtp_port=587,
        username="testuser",
        password="s3cret",
        from_fname="Alice",
        from_lname="Sender",
        from_email="alice@example.com",
        custom_headers=[],
    )
    defaults.update(overrides)
    return SendingProfileCreate(**defaults)

def _header_data(**overrides) -> List[CustomHeaderCreate]:
    default_headers = [
        CustomHeaderCreate(name="X-Custom", value="hello"),
        CustomHeaderCreate(name="X-Another", value="world"),
    ]
    default_headers.extend(overrides)
    return default_headers


def _insert_profile(session: Session, realm: str = "test-realm", **overrides) -> SendingProfile:
    defaults = dict(
        name="Test Profile",
        smtp_host="smtp.example.com",
        smtp_port=587,
        username="testuser",
        password="s3cret",
        from_fname="Alice",
        from_lname="Sender",
        from_email="alice@example.com",
        realm_name=realm,
    )
    defaults.update(overrides)
    profile = SendingProfile(**defaults)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


class TestCreateSendingProfile:
    """Tests for SendingProfileService.create_sending_profile."""

    def test_create_profile_persists(
        self, service: SendingProfileService, session: Session
    ):
        data = _profile_data()
        realm = "test-realm"

        service.create_sending_profile(data, realm, session)

        results = session.exec(select(SendingProfile)).all()
        assert len(results) == 1

        p = results[0]
        assert p.name == _profile_data().name
        assert p.smtp_host == _profile_data().smtp_host
        assert p.smtp_port == _profile_data().smtp_port
        assert p.realm_name == realm


    def test_create_profile_with_custom_headers(
        self, service: SendingProfileService, session: Session
    ):
        realm = "test-realm"
        data = _profile_data(custom_headers=_header_data())

        service.create_sending_profile(data, realm, session)
        profile = session.exec(select(SendingProfile)).first()

        assert profile is not None
        headers = session.exec(
            select(CustomHeader).where(CustomHeader.profile_id == profile.id)
        ).all()

        assert len(headers) == 2
        header_map = {h.name: h.value for h in headers}
        assert header_map["X-Custom"] == "hello"
        assert header_map["X-Another"] == "world"


class TestGetSendingProfile:
    """Tests for SendingProfileService.get_sending_profile."""

    def test_get_existing_profile(self, service: SendingProfileService, session: Session):
        profile = _insert_profile(session)
        result = service.get_sending_profile(profile.id, session)
        assert result is not None
        assert result.name == profile.name
    
    def test_get_nonexistent_profile(self, service: SendingProfileService, session: Session):
        result = service.get_sending_profile(99999, session)
        assert result is None


class TestGetSendingProfilesByRealm:
    """Tests for SendingProfileService.get_sending_profiles_by_realm."""

    def test_filters_by_realm(self, service: SendingProfileService, session: Session):
        realm1 = "realm-1"
        realm2 = "realm-2"

        _insert_profile(session, realm=realm1, name="A")
        _insert_profile(session, realm=realm1, name="B")
        _insert_profile(session, realm=realm2, name="C")
        r1 = service.get_sending_profiles_by_realm(realm1, session)
        assert len(r1) == 2
        assert r1[0].name == "A"
        assert r1[1].name == "B"
        r2 = service.get_sending_profiles_by_realm(realm2, session)
        assert len(r2) == 1
    
    def test_empty_realm_returns_empty(self, service: SendingProfileService, session: Session):
        result = service.get_sending_profiles_by_realm("no-such-realm", session)
        assert result == []
    
    def test_returns_display_info_type(self, service: SendingProfileService, session: Session):
        _insert_profile(session)
        infos = service.get_sending_profiles_by_realm("test-realm", session)
        assert all(isinstance(i, SendingProfileDisplayInfo) for i in infos)


class TestDeleteSendingProfile:
    """Tests for SendingProfileService.delete_sending_profile."""


    def test_delete_removes_profile(self, service, session):
        profile = _insert_profile(session)
        service.delete_sending_profile(profile.id, session)
        assert service.get_sending_profile(profile.id, session) is None
        assert session.exec(select(SendingProfile)).first() is None
    
    def test_delete_cascades_headers(self, service, session):
        """Create profile + header, delete profile.
           Assert headers are also gone (cascade delete-orphan)."""
        profile = _profile_data(custom_headers=_header_data())
        service.create_sending_profile(profile, "test-realm", session)
        profile_id = session.exec(select(SendingProfile)).first().id

        service.delete_sending_profile(profile_id, session)
        assert session.exec(select(CustomHeader)).first() is None

    def test_delete_nonexistent_is_noop(self, service, session):
        """Delete an ID that doesn't exist. Should not raise."""
        service.delete_sending_profile(99999, session)  # no error


class TestUpdateSendingProfile:
    """Tests for SendingProfileService.update_sending_profile."""

    def test_update_changes_fields(self, service: SendingProfileService, session: Session):
        profile = _insert_profile(session)
        updated = service.update_sending_profile(
            profile.id,
            _profile_data(name="Updated", smtp_host="new.smtp.com"),
            session,
        )
        assert updated is not None
        assert updated.name == "Updated"
        assert updated.smtp_host == "new.smtp.com"
    
    def test_update_replaces_custom_headers(self, service, session):
        """Create with header A. Update with headers B,C.
           Assert A is gone, B+C exist."""
        profile = _profile_data(custom_headers=_header_data())
        service.create_sending_profile(profile, "test-realm", session)
        profile_id = session.exec(select(SendingProfile)).first().id

        header3: CustomHeaderCreate = CustomHeaderCreate(name = "X-third", value = "trello")
        new_headers = [header3]

        service.update_sending_profile(
            profile_id,
            _profile_data(custom_headers=new_headers),
            session,
        )

        r = session.exec(select(CustomHeader)).all()
        assert len(r) == 1
        assert r[0].name == "X-third"
    
    def test_update_nonexistent_returns_none(self, service, session):
        """Update an ID that doesn't exist. Assert result is None."""
        result = service.update_sending_profile(99999, _profile_data(), session)
        assert result is None
    
    def test_update_preserves_realm(self, service, session):
        profile = _profile_data(custom_headers=_header_data())
        realm_name = "test-realm"

        service.create_sending_profile(profile, realm_name, session)
        profile_id = session.exec(select(SendingProfile)).first().id

        service.update_sending_profile(
            profile_id,
            _profile_data(custom_headers=_header_data()),
            session,
        )
        assert session.exec(select(SendingProfile)).first().realm_name == realm_name
