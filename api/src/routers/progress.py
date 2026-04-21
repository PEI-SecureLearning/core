from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from src.core.dependencies import SessionDep, OAuth2Scheme
from src.core.security import Roles, Resource, Scope
from src.services import progress as progress_service
from src.services.compliance.token_helpers import decode_token_verified
from src.services.risk import risk_service

router = APIRouter(prefix="/users/{user_id}/progress", tags=["progress"])


class ProgressUpdate(BaseModel):
    section_id: str
    task_id: str


class SectionComplete(BaseModel):
    section_id: str
    total_sections: int


@router.get("")
def get_user_progress(
    user_id: str,
    session: SessionDep,
    exclude_scheduled: Annotated[bool, Query()] = False,
):
    from src.models import AssignmentStatus

    all_p = progress_service.get_all_progress(user_id, session)
    if exclude_scheduled:
        return [p for p in all_p if p.status != AssignmentStatus.SCHEDULED]
    return all_p


@router.get("/{course_id}")
def get_course_progress(user_id: str, course_id: str, session: SessionDep):
    return progress_service.get_course_progress(user_id, course_id, session)


@router.put("/{course_id}")
def update_course_progress(
    user_id: str,
    course_id: str,
    payload: ProgressUpdate,
    session: SessionDep,
):
    return progress_service.update_progress(
        user_id, course_id, payload.section_id, payload.task_id, session
    )


@router.post("/{course_id}/section")
async def complete_course_section(
    user_id: str,
    course_id: str,
    payload: SectionComplete,
    session: SessionDep,
    background_tasks: BackgroundTasks,
):
    result = await progress_service.complete_section(
        user_id, course_id, payload.section_id, session
    )
    background_tasks.add_task(risk_service.recalculate_k_factor, user_id, session)
    background_tasks.add_task(risk_service.recalculate_total_risk, user_id, session)
    return result


@router.post("/{course_id}/renewal")
async def complete_course_renewal(
    user_id: str,
    course_id: str,
    session: SessionDep,
):
    return await progress_service.complete_refreshment(user_id, course_id, session)


@router.post(
    "/{course_id}/overdue",
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def mark_course_overdue(
    user_id: str, course_id: str, session: SessionDep, token: OAuth2Scheme
):
    return progress_service.mark_overdue(user_id, course_id, session)


@router.post("/{course_id}/error")
async def record_wrong_answer(
    user_id: str,
    course_id: str,
    session: SessionDep,
    background_tasks: BackgroundTasks,
):
    result = await progress_service.record_error(user_id, course_id, session)
    background_tasks.add_task(risk_service.recalculate_k_factor, user_id, session)
    background_tasks.add_task(risk_service.recalculate_total_risk, user_id, session)
    return result
