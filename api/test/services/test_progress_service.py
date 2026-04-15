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

from datetime import datetime, timedelta
import pytest
from pytest import approx
from unittest.mock import AsyncMock, patch, MagicMock
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool
from src.services.progress import (
    assign_course,
    get_all_progress,
    get_course_progress,
    update_progress,
    complete_section,
    complete_refreshment,
    mark_overdue,
)
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
        realm_name=realm_name,
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
    recs = session.exec(select(UserProgress)).all()
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
        realm_name="old-realm",
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
        realm_name="new-realm",
    )

    # Assert
    assert len(assigned) == 1
    p = assigned[0]
    assert p.status == AssignmentStatus.SCHEDULED  # Should be reset to scheduled
    assert p.start_date.timestamp() == approx(new_start.timestamp(), abs=1)
    assert p.deadline.timestamp() == approx(new_deadline.timestamp(), abs=1)
    assert p.realm_name == "new-realm"
    assert p.cert_valid_days == 180.0


def test_get_all_progress(session: Session):
    # Arrange
    uid = "user-1"
    session.add(UserProgress(user_id=uid, course_id="c1", start_date=datetime.utcnow()))
    session.add(UserProgress(user_id=uid, course_id="c2", start_date=datetime.utcnow()))
    session.add(
        UserProgress(user_id="other", course_id="c1", start_date=datetime.utcnow())
    )
    session.commit()

    # Act
    results = get_all_progress(uid, session)

    # Assert
    assert len(results) == 2
    for r in results:
        assert r.user_id == uid


def test_get_course_progress_success(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(UserProgress(user_id=uid, course_id=cid, start_date=datetime.utcnow()))
    session.commit()

    # Act
    res = get_course_progress(uid, cid, session)

    # Assert
    assert res.user_id == uid
    assert res.course_id == cid


from fastapi import HTTPException


def test_get_course_progress_not_found(session: Session):
    with pytest.raises(HTTPException) as exc:
        get_course_progress("none", "none", session)
    assert exc.value.status_code == 404


def test_update_progress(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(UserProgress(user_id=uid, course_id=cid, progress_data={}))
    session.commit()

    # Act
    res = update_progress(uid, cid, "sec-1", "task-1", session)

    # Assert
    assert "sec-1" in res.progress_data
    assert "task-1" in res.progress_data["sec-1"]
    assert res.total_completed_tasks == 1


@pytest.mark.anyio
async def test_complete_section(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    progress = UserProgress(
        user_id=uid, course_id=cid, completed_sections=[], cert_valid_days=30
    )
    session.add(progress)
    session.commit()

    # Mock course and modules
    mock_course = MagicMock()
    mock_course.modules = ["mod-1"]

    mock_module = MagicMock()
    mock_module.sections = ["sec-1"]  # Total 1 section

    with patch(
        "src.services.progress.get_course", new_callable=AsyncMock
    ) as mock_get_course:
        with patch(
            "src.services.progress.get_module", new_callable=AsyncMock
        ) as mock_get_module:
            mock_get_course.return_value = mock_course
            mock_get_module.return_value = mock_module

            # Act
            res = await complete_section(uid, cid, "sec-1", session)

            # Assert
            assert "sec-1" in res.completed_sections
            assert res.is_certified is True
            assert res.status == AssignmentStatus.COMPLETED
            assert res.cert_expires_at is not None


def test_mark_overdue(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(
        UserProgress(user_id=uid, course_id=cid, status=AssignmentStatus.ACTIVE)
    )
    session.commit()

    # Act
    res = mark_overdue(uid, cid, session)

    # Assert
    assert res.status == AssignmentStatus.OVERDUE
    assert res.overdue is True


def test_update_progress_not_found(session: Session):
    with pytest.raises(HTTPException) as exc:
        update_progress("none", "none", "s", "t", session)
    assert exc.value.status_code == 404


@pytest.mark.anyio
async def test_complete_section_not_found(session: Session):
    with pytest.raises(HTTPException) as exc:
        await complete_section("none", "none", "s", session)
    assert exc.value.status_code == 404


@pytest.mark.anyio
async def test_complete_section_fetch_error_fallback(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(UserProgress(user_id=uid, course_id=cid, completed_sections=[]))
    session.commit()

    with patch("src.services.progress.get_course", side_effect=Exception("DB DOWN")):
        # Act
        res = await complete_section(uid, cid, "sec-1", session)
        # Assert - should fallback and NOT certify if total_sections is set to 1000
        assert "sec-1" in res.completed_sections
        assert res.is_certified is False


def test_mark_overdue_not_found(session: Session):
    with pytest.raises(HTTPException) as exc:
        mark_overdue("none", "none", session)
    assert exc.value.status_code == 404


def test_mark_overdue_invalid_status(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(
        UserProgress(user_id=uid, course_id=cid, status=AssignmentStatus.COMPLETED)
    )
    session.commit()

    with pytest.raises(HTTPException) as exc:
        mark_overdue(uid, cid, session)
    assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_complete_refreshment_success(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    progress = UserProgress(
        user_id=uid,
        course_id=cid,
        status=AssignmentStatus.RENEWAL_REQUIRED,
        completed_sections=["ref-1"],
        cert_valid_days=30,
    )
    session.add(progress)
    session.commit()

    mock_course = MagicMock()
    mock_course.modules = ["mod-1"]
    mock_module = MagicMock()
    mock_module.refresh_sections = ["ref-1"]

    with patch(
        "src.services.progress.get_course", new_callable=AsyncMock
    ) as mock_get_course:
        with patch(
            "src.services.progress.get_module", new_callable=AsyncMock
        ) as mock_get_module:
            mock_get_course.return_value = mock_course
            mock_get_module.return_value = mock_module

            # Act
            res = await complete_refreshment(uid, cid, session)

            # Assert
            assert res.is_certified is True
            assert res.status == AssignmentStatus.COMPLETED


@pytest.mark.anyio
async def test_complete_refreshment_not_required(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(
        UserProgress(user_id=uid, course_id=cid, status=AssignmentStatus.ACTIVE)
    )
    session.commit()

    with pytest.raises(HTTPException) as exc:
        await complete_refreshment(uid, cid, session)
    assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_complete_refreshment_incomplete(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(
        UserProgress(
            user_id=uid,
            course_id=cid,
            status=AssignmentStatus.RENEWAL_REQUIRED,
            completed_sections=[],
        )
    )
    session.commit()

    mock_course = MagicMock()
    mock_course.modules = ["mod-1"]
    mock_module = MagicMock()
    mock_module.refresh_sections = ["ref-1"]

    with patch(
        "src.services.progress.get_course", new_callable=AsyncMock
    ) as mock_get_course:
        with patch(
            "src.services.progress.get_module", new_callable=AsyncMock
        ) as mock_get_module:
            mock_get_course.return_value = mock_course
            mock_get_module.return_value = mock_module

            with pytest.raises(HTTPException) as exc:
                await complete_refreshment(uid, cid, session)
            assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_complete_refreshment_not_found(session: Session):
    with pytest.raises(HTTPException) as exc:
        await complete_refreshment("none", "none", session)
    assert exc.value.status_code == 404


@pytest.mark.anyio
async def test_complete_refreshment_fetch_error(session: Session):
    # Arrange
    uid = "u1"
    cid = "c1"
    session.add(
        UserProgress(
            user_id=uid, course_id=cid, status=AssignmentStatus.RENEWAL_REQUIRED
        )
    )
    session.commit()

    with patch("src.services.progress.get_course", side_effect=Exception("DB DOWN")):
        with pytest.raises(HTTPException) as exc:
            await complete_refreshment(uid, cid, session)
        assert exc.value.status_code == 400
        assert "Not all refreshment sections completed" in exc.value.detail
