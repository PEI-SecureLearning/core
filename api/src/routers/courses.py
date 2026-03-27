from typing import Annotated

from fastapi import APIRouter, Query, status, Depends
from sqlmodel import Session, select

from src.core.dependencies import OAuth2Scheme, SessionDep, CurrentRealm
from src.models import (
    CourseCreate,
    CourseOut,
    CoursePatch,
    CourseUpdate,
    PaginatedCourses,
)
from src.services import courses as course_service
from src.services.compliance.token_helpers import decode_token_verified
from fastapi import HTTPException

router = APIRouter()

def _get_sub(token: str) -> str:
    claims = decode_token_verified(token)
    sub = claims.get("sub", "")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing 'sub' claim")
    return sub


@router.get("/courses", summary="List courses")
async def list_courses(
    search:     Annotated[str | None, Query()] = None,
    category:   Annotated[str | None, Query()] = None,
    difficulty: Annotated[str | None, Query()] = None,
    page:       Annotated[int, Query(ge=1)] = 1,
    limit:      Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedCourses:
    return await course_service.list_courses(
        search=search,
        category=category,
        difficulty=difficulty,
        page=page,
        limit=limit,
    )


@router.get("/courses/{user_id}/enrolled", summary="List courses the user is enrolled in")
async def get_enrolled_courses(
    user_id: str,
    session: SessionDep,
    exclude_scheduled: bool = Query(False)
) -> list[CourseOut]:
    from src.models import UserProgress, AssignmentStatus
    
    stmt = select(UserProgress).where(UserProgress.user_id == user_id)
    if exclude_scheduled:
        stmt = stmt.where(UserProgress.status != AssignmentStatus.SCHEDULED)
        
    progress_records = list(session.exec(stmt).all())
    
    if not progress_records:
        return []
        
    course_ids = [p.course_id for p in progress_records]
    return await course_service.list_enrolled_courses(course_ids)


@router.get("/courses/assignments/all", summary="List all course assignments (admin/manager view)")
async def list_all_assignments(
    current_realm: CurrentRealm,
    session: SessionDep,
) -> list:
    """
    Returns all UserProgress records with course titles for the current realm.
    """
    from src.models import UserProgress
    stmt = select(UserProgress).where(UserProgress.realm_name == current_realm)
    results = session.exec(stmt).all()
    
    if not results:
        return []

    # Fetch course titles from MongoDB via service
    course_ids = list(set(p.course_id for p in results))
    courses = await course_service.list_enrolled_courses(course_ids)
    course_map = {c.id: c.title for c in courses}
    
    # Map and group to a Campaign-like shape for the timeline
    grouped = {}
    for progress in results:
        course_title = course_map.get(progress.course_id, "Unknown Course")
        key = (progress.course_id, progress.start_date, progress.deadline)
        if key not in grouped:
            grouped[key] = {
                "id": f"course_batch_{progress.course_id}_{progress.start_date}_{progress.deadline}",
                "name": f"Training: {course_title}",
                "status": progress.status.lower(),
                "begin_date": progress.start_date.isoformat() if progress.start_date else None,
                "end_date": progress.deadline.isoformat() if progress.deadline else None,
                "type": "course",
                "user_count": 0
            }
        grouped[key]["user_count"] += 1
        
    # Final name adjustment to include user count
    assignments = []
    for val in grouped.values():
        val["name"] += f" ({val['user_count']} users)"
        assignments.append(val)
        
    return assignments


from pydantic import BaseModel
from datetime import datetime
from src.services.progress import assign_course

class CourseAssignPayload(BaseModel):
    user_ids: list[str]
    start_date: datetime
    deadline: datetime
    cert_valid_days: float = 365.0

@router.post("/courses/{course_id}/assign", summary="Assign course to users")
async def assign_course_to_users(
    course_id: str,
    payload: CourseAssignPayload,
    current_realm: CurrentRealm,
    session: SessionDep,
):
    assigned = assign_course(
        course_id=course_id,
        user_ids=payload.user_ids,
        start_date=payload.start_date,
        deadline=payload.deadline,
        cert_valid_days=payload.cert_valid_days,
        session=session,
        realm_name=current_realm
    )
    return {"status": "success", "assigned_count": len(assigned)}

from src.tasks.scheduler import process_course_assignments

@router.post("/courses/scheduler/force-tick", summary="Admin: Force course assignment scheduler tick")
async def force_scheduler_tick():
    process_course_assignments()
    return {"status": "success", "message": "Scheduler tick processed manually."}

@router.get("/courses/{course_id}", summary="Get a course")
async def get_course(course_id: str) -> CourseOut:
    return await course_service.get_course(course_id=course_id)


@router.post("/courses", status_code=status.HTTP_201_CREATED, summary="Create a course")
async def create_course(
    payload: CourseCreate,
    token:   OAuth2Scheme,
) -> CourseOut:
    created_by = _get_sub(token)
    return await course_service.create_course(payload=payload, created_by=created_by)


@router.put("/courses/{course_id}", summary="Full update a course")
async def update_course(
    course_id: str,
    payload:   CourseUpdate,
) -> CourseOut:
    return await course_service.update_course(course_id=course_id, payload=payload)


@router.patch("/courses/{course_id}", summary="Partial update a course")
async def patch_course(
    course_id: str,
    payload:   CoursePatch,
) -> CourseOut:
    return await course_service.patch_course(course_id=course_id, payload=payload)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a course")
async def delete_course(course_id: str) -> None:
    await course_service.delete_course(course_id=course_id)
