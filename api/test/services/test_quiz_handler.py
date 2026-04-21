import os
from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

os.environ.update(
    {
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "testuser",
        "POSTGRES_PASSWORD": "testpassword",
        "POSTGRES_DB": "test",
        "RABBITMQ_HOST": "localhost",
        "RABBITMQ_USER": "guest",
        "RABBITMQ_PASS": "guest",
        "RABBITMQ_QUEUE": "test_queue",
        "KEYCLOAK_SERVER_URL": "http://localhost:8080",
        "KEYCLOAK_REALM": "master",
        "KEYCLOAK_CLIENT_ID": "test",
        "KEYCLOAK_CLIENT_SECRET": "test",
    }
)

from src.models import Answer, ComplianceAcceptance, Question, TenantComplianceQuiz
from src.services.compliance import quiz_handler


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


@pytest.fixture(autouse=True)
def clear_cooldowns():
    quiz_handler._cooldowns.clear()


def _policy(content_md: str = "# Security Policy\nRead carefully"):
    return SimpleNamespace(
        content_md=content_md, updated_at=datetime(2026, 1, 1, 10, 0, 0)
    )


def _quiz(question_count: int = 2, passing_score: int = 50):
    return SimpleNamespace(
        question_count=question_count,
        passing_score=passing_score,
        question_bank=[
            {
                "id": "q1",
                "prompt": "Question 1",
                "options": ["A", "B"],
                "answer_index": 0,
                "feedback": "f1",
            },
            {
                "id": "q2",
                "prompt": "Question 2",
                "options": ["C", "D"],
                "answer_index": 1,
                "feedback": "f2",
            },
        ],
    )


def test_compute_version_is_stable_for_same_payload():
    v1 = quiz_handler.compute_version("content", [{"id": 1}], 80, 5)
    v2 = quiz_handler.compute_version("content", [{"id": 1}], 80, 5)
    assert v1 == v2


def test_extract_title_and_default():
    assert quiz_handler.extract_title("# Header\nbody") == "Header"
    assert quiz_handler.extract_title("body only") == "Compliance Policy"


def test_question_bank_from_record_invalid_raises_http_500():
    bad = TenantComplianceQuiz(tenant="realm-a", question_bank=[{"id": "q1"}])
    with pytest.raises(HTTPException) as exc:
        quiz_handler.question_bank_from_record(bad)
    assert exc.value.status_code == 500


def test_select_questions_returns_copy_when_not_sampling():
    bank = [
        Question(id="q1", prompt="p1", options=["a"], answer_index=0, feedback="f1"),
    ]
    selected = quiz_handler.select_questions(bank, 5)
    assert selected == bank
    assert selected is not bank


def test_normalize_quiz_settings_clamps_count_and_snaps_score():
    count, score = quiz_handler.normalize_quiz_settings(
        question_count=10, passing_score=70, bank_len=3
    )
    assert count == 3
    assert score in [0, 33, 66, 100]


def test_enforce_version_raises_for_mismatch():
    with pytest.raises(HTTPException) as exc:
        quiz_handler.enforce_version("expected", "provided")
    assert exc.value.status_code == 400


def test_enforce_cooldown_allows_when_expired_and_blocks_when_active(monkeypatch):
    now = datetime(2026, 1, 1, 10, 0, 0)
    quiz_handler.record_cooldown("u1", "v1", now - timedelta(seconds=10))

    monkeypatch.setattr(quiz_handler, "_utcnow", lambda: now)
    with pytest.raises(HTTPException) as exc:
        quiz_handler.enforce_cooldown("u1", "v1")
    assert exc.value.status_code == 429

    quiz_handler.record_cooldown(
        "u1", "v1", now - timedelta(seconds=quiz_handler.COOLDOWN_SECONDS + 1)
    )
    result_now = quiz_handler.enforce_cooldown("u1", "v1")
    assert result_now == now


def test_evaluate_answers_success_and_errors():
    question_map = {
        "q1": Question(
            id="q1", prompt="p1", options=["a", "b"], answer_index=1, feedback="f1"
        ),
        "q2": Question(
            id="q2", prompt="p2", options=["c", "d"], answer_index=0, feedback="f2"
        ),
    }

    answers = [Answer(id="q1", choice=1), Answer(id="q2", choice=1)]
    correct, total, feedback = quiz_handler.evaluate_answers(
        answers, question_map, required_count=2
    )
    assert correct == 1
    assert total == 2
    assert len(feedback) == 2

    with pytest.raises(HTTPException):
        quiz_handler.evaluate_answers(
            [Answer(id="q1", choice=1)], question_map, required_count=2
        )

    with pytest.raises(HTTPException):
        quiz_handler.evaluate_answers(
            [Answer(id="missing", choice=0)], question_map, required_count=1
        )

    with pytest.raises(HTTPException):
        quiz_handler.evaluate_answers(
            [Answer(id="q1", choice=1), Answer(id="q1", choice=0)],
            question_map,
            required_count=2,
        )


def test_get_latest_compliance(monkeypatch, session: Session):
    monkeypatch.setattr(
        quiz_handler,
        "ensure_tenant_policy",
        lambda _s, _t: _policy("# Title\nbody body"),
    )
    monkeypatch.setattr(quiz_handler, "ensure_tenant_quiz", lambda _s, _t: _quiz())

    result = quiz_handler.get_latest_compliance(session, "realm-a")

    assert result.title == "Title"
    assert result.word_count == 4
    assert result.content.startswith("# Title")
    assert len(result.version) == 64


def test_get_latest_quiz(monkeypatch, session: Session):
    monkeypatch.setattr(quiz_handler, "ensure_tenant_policy", lambda _s, _t: _policy())
    monkeypatch.setattr(
        quiz_handler,
        "ensure_tenant_quiz",
        lambda _s, _t: _quiz(question_count=1, passing_score=100),
    )

    result = quiz_handler.get_latest_quiz(session, "realm-a")

    assert result.required_score == 100
    assert result.question_count == 1
    assert len(result.questions) == 1
    assert result.cooldown_seconds == quiz_handler.COOLDOWN_SECONDS


def test_submit_quiz_pass_creates_record_and_clears_cooldown(
    monkeypatch, session: Session
):
    policy = _policy()
    quiz = _quiz(question_count=2, passing_score=50)
    monkeypatch.setattr(quiz_handler, "ensure_tenant_policy", lambda _s, _t: policy)
    monkeypatch.setattr(quiz_handler, "ensure_tenant_quiz", lambda _s, _t: quiz)

    version = quiz_handler.compute_version(policy.content_md, quiz.question_bank, 50, 2)

    result = quiz_handler.submit_quiz(
        session,
        "realm-a",
        "user-1",
        version,
        [Answer(id="q1", choice=0), Answer(id="q2", choice=1)],
    )

    db_row = session.exec(
        select(ComplianceAcceptance).where(
            ComplianceAcceptance.user_identifier == "user-1"
        )
    ).first()
    assert result.passed is True
    assert result.cooldown_seconds_remaining == 0
    assert db_row is not None
    assert db_row.passed is True
    assert quiz_handler._cooldowns.get(("user-1", version)) is None


def test_submit_quiz_fail_sets_cooldown_and_updates_existing(
    monkeypatch, session: Session
):
    policy = _policy()
    quiz = _quiz(question_count=2, passing_score=100)
    monkeypatch.setattr(quiz_handler, "ensure_tenant_policy", lambda _s, _t: policy)
    monkeypatch.setattr(quiz_handler, "ensure_tenant_quiz", lambda _s, _t: quiz)

    version = quiz_handler.compute_version(
        policy.content_md, quiz.question_bank, 100, 2
    )
    existing = ComplianceAcceptance(
        user_identifier="user-2",
        tenant="realm-a",
        version=version,
        score=0,
        passed=False,
    )
    session.add(existing)
    session.commit()

    result = quiz_handler.submit_quiz(
        session,
        "realm-a",
        "user-2",
        version,
        [Answer(id="q1", choice=1), Answer(id="q2", choice=1)],
    )

    db_row = session.exec(
        select(ComplianceAcceptance).where(
            ComplianceAcceptance.user_identifier == "user-2"
        )
    ).first()
    assert result.passed is False
    assert result.cooldown_seconds_remaining == quiz_handler.COOLDOWN_SECONDS
    assert db_row is not None
    assert db_row.score == 50
    assert quiz_handler._cooldowns.get(("user-2", version)) is not None


def test_get_compliance_status_absent_and_present(monkeypatch, session: Session):
    policy = _policy()
    quiz = _quiz()
    monkeypatch.setattr(quiz_handler, "ensure_tenant_policy", lambda _s, _t: policy)
    monkeypatch.setattr(quiz_handler, "ensure_tenant_quiz", lambda _s, _t: quiz)

    version = quiz_handler.compute_version(policy.content_md, quiz.question_bank, 50, 2)
    status = quiz_handler.get_compliance_status(session, "realm-a", "user-3")
    assert status.accepted is False
    assert status.required_version == version

    session.add(
        ComplianceAcceptance(
            user_identifier="user-3",
            tenant="realm-a",
            version=version,
            score=90,
            passed=True,
        )
    )
    session.commit()

    status2 = quiz_handler.get_compliance_status(session, "realm-a", "user-3")
    assert status2.accepted is True
    assert status2.score == 90


def test_accept_compliance_validates_version_and_score(monkeypatch, session: Session):
    policy = _policy()
    quiz = _quiz(question_count=2, passing_score=80)
    monkeypatch.setattr(quiz_handler, "ensure_tenant_policy", lambda _s, _t: policy)
    monkeypatch.setattr(quiz_handler, "ensure_tenant_quiz", lambda _s, _t: quiz)

    normalized_count, normalized_score = quiz_handler.normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank)
    )
    expected_version = quiz_handler.compute_version(
        policy.content_md, quiz.question_bank, normalized_score, normalized_count
    )

    with pytest.raises(HTTPException) as exc_version:
        quiz_handler.accept_compliance(session, "realm-a", "user-4", "old", 90)
    assert exc_version.value.status_code == 400

    with pytest.raises(HTTPException) as exc_score:
        quiz_handler.accept_compliance(
            session, "realm-a", "user-4", expected_version, 50
        )
    assert exc_score.value.status_code == 400

    result = quiz_handler.accept_compliance(
        session, "realm-a", "user-4", expected_version, normalized_score
    )
    assert result["status"] == "accepted"

    row = session.exec(
        select(ComplianceAcceptance).where(
            ComplianceAcceptance.user_identifier == "user-4"
        )
    ).first()
    assert row is not None
    assert row.score == normalized_score
