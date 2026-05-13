from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from pymongo import ReturnDocument
from sqlalchemy import desc
from sqlmodel import Session, select

from src.core.mongo import get_surveys_collection
from src.models import SurveyResponse, UserProgress
from src.models.survey import SurveyTemplateOut, SurveyAnswer
from src.services.risk import risk_service


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _template_query(
    survey_type: str, realm_name: str | None = None, course_id: str | None = None
) -> dict:
    query: dict = {"survey_type": survey_type}
    if realm_name is not None:
        query["realm_name"] = realm_name
    if course_id is not None:
        query["course_id"] = course_id
    return query


async def _get_survey_document(
    survey_type: str,
    realm_name: str | None = None,
    course_id: str | None = None,
) -> dict:
    collection = get_surveys_collection()
    query = _template_query(survey_type, realm_name=realm_name, course_id=course_id)
    doc = await collection.find_one(query)
    if doc is not None:
        return doc

    fallback_query = _template_query(
        survey_type, realm_name="platform", course_id=course_id
    )
    doc = await collection.find_one(fallback_query)
    if doc is not None:
        return doc

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Survey template not found",
    )


async def get_learner_course_survey(
    course_id: str, realm_name: str | None
) -> SurveyTemplateOut:
    doc = await _get_survey_document(
        "learner-course", realm_name=realm_name, course_id=course_id
    )
    return SurveyTemplateOut.model_validate(
        {
            "id": str(doc.get("_id")) if doc.get("_id") else None,
            "survey_type": doc.get("survey_type", "learner-course"),
            "realm_name": doc.get("realm_name"),
            "course_id": doc.get("course_id"),
            "title": doc.get("title", "Course Survey"),
            "description": doc.get("description"),
            "questions": doc.get("questions", []),
            "updated_at": doc.get("updated_at"),
        }
    )


async def get_executive_survey(realm_name: str | None) -> SurveyTemplateOut:
    doc = await _get_survey_document("executive", realm_name=realm_name)
    return SurveyTemplateOut.model_validate(
        {
            "id": str(doc.get("_id")) if doc.get("_id") else None,
            "survey_type": doc.get("survey_type", "executive"),
            "realm_name": doc.get("realm_name"),
            "course_id": doc.get("course_id"),
            "title": doc.get("title", "Executive Survey"),
            "description": doc.get("description"),
            "questions": doc.get("questions", []),
            "updated_at": doc.get("updated_at"),
        }
    )


def calculate_normalized_sentiment(
    template: SurveyTemplateOut, answers: list[SurveyAnswer]
) -> float:
    question_map = {question.id: question for question in template.questions}
    if not answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one survey answer is required.",
        )

    weighted_total = 0.0
    total_weight = 0.0

    for answer in answers:
        question = question_map.get(answer.id)
        if question is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown survey question id: {answer.id}",
            )

        max_index = len(question.options) - 1
        if max_index < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Survey question '{answer.id}' must define at least two options.",
            )
        if answer.choice > max_index:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Survey choice out of range for question '{answer.id}'.",
            )

        normalized = answer.choice / max_index
        if question.reverse_scored:
            normalized = 1.0 - normalized

        weight = question.weight
        weighted_total += normalized * weight
        total_weight += weight

    if total_weight <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Survey questions must define positive weights.",
        )

    return max(0.0, min(1.0, weighted_total / total_weight))


async def submit_course_survey(
    *,
    session: Session,
    user_id: str,
    course_id: str,
    realm_name: str | None,
    answers: list[SurveyAnswer],
) -> SurveyResponse:
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if progress is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course progress not found",
        )

    template = await get_learner_course_survey(course_id, realm_name)
    normalized_score = calculate_normalized_sentiment(template, answers)

    response = SurveyResponse(
        user_id=user_id,
        course_id=course_id,
        realm_name=realm_name,
        answers=[answer.model_dump() for answer in answers],
        normalized_score=normalized_score,
        submitted_at=_utcnow(),
    )

    progress.sentiment_score = normalized_score
    session.add(progress)
    session.add(response)
    session.commit()
    session.refresh(progress)
    session.refresh(response)

    risk_service.recalculate_s_factor(user_id, session)
    risk_service.recalculate_total_risk(user_id, session)
    return response
