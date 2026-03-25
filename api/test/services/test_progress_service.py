from datetime import datetime, timedelta
import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from src.services.progress import assign_course
from src.models import UserProgress, AssignmentStatus

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

def test_assign_course_new_users(session: Session):
    # Arrange
    course_id = "course-123"
    user_ids = ["user-1", "user-2"]
    start_date = datetime.utcnow()
    deadline = start_date + timedelta(days=30)
    cert_valid_days = 365.0
    realm_name = "test-realm"

    # Act
    assigned = assign_course(
        course_id=course_id,
        user_ids=user_ids,
        start_date=start_date,
        deadline=deadline,
        cert_valid_days=cert_valid_days,
        session=session,
        realm_name=realm_name
    )

    # Assert
    assert len(assigned) == 2
    for p in assigned:
        assert p.course_id == course_id
        assert p.user_id in user_ids
        assert p.status == AssignmentStatus.SCHEDULED
        assert p.realm_name == realm_name
        assert p.cert_valid_days == cert_valid_days

    # Verify in DB
    recs = session.query(UserProgress).all()
    assert len(recs) == 2

def test_assign_course_already_exists_updates_dates(session: Session):
    # Arrange
    course_id = "course-123"
    user_id = "user-1"
    old_start = datetime.utcnow() - timedelta(days=10)
    
    # Create existing
    existing = UserProgress(
        user_id=user_id,
        course_id=course_id,
        start_date=old_start,
        deadline=old_start + timedelta(days=5),
        status=AssignmentStatus.ACTIVE,
        realm_name="old-realm"
    )
    session.add(existing)
    session.commit()

    new_start = datetime.utcnow()
    new_deadline = new_start + timedelta(days=30)

    # Act
    assigned = assign_course(
        course_id=course_id,
        user_ids=[user_id],
        start_date=new_start,
        deadline=new_deadline,
        cert_valid_days=180.0,
        session=session,
        realm_name="new-realm"
    )

    # Assert
    assert len(assigned) == 1
    p = assigned[0]
    assert p.status == AssignmentStatus.SCHEDULED # Should be reset to scheduled
    assert p.start_date == new_start
    assert p.deadline == new_deadline
    assert p.realm_name == "new-realm"
    assert p.cert_valid_days == 180.0
