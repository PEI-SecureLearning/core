from typing import Annotated

from fastapi import APIRouter, Query, status

from src.core.dependencies import CurrentRealm, OAuth2Scheme
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
    realm:      CurrentRealm,
    search:     Annotated[str | None, Query()] = None,
    category:   Annotated[str | None, Query()] = None,
    difficulty: Annotated[str | None, Query()] = None,
    page:       Annotated[int, Query(ge=1)] = 1,
    limit:      Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedCourses:
    return await course_service.list_courses(
        realm=realm,
        search=search,
        category=category,
        difficulty=difficulty,
        page=page,
        limit=limit,
    )


@router.get("/courses/{course_id}", summary="Get a course")
async def get_course(course_id: str, realm: CurrentRealm) -> CourseOut:
    return await course_service.get_course(course_id=course_id, realm=realm)


@router.post("/courses", status_code=status.HTTP_201_CREATED, summary="Create a course")
async def create_course(
    payload: CourseCreate,
    realm:   CurrentRealm,
    token:   OAuth2Scheme,
) -> CourseOut:
    created_by = _get_sub(token)
    return await course_service.create_course(payload=payload, realm=realm, created_by=created_by)


@router.put("/courses/{course_id}", summary="Full update a course")
async def update_course(
    course_id: str,
    payload:   CourseUpdate,
    realm:     CurrentRealm,
) -> CourseOut:
    return await course_service.update_course(course_id=course_id, payload=payload, realm=realm)


@router.patch("/courses/{course_id}", summary="Partial update a course")
async def patch_course(
    course_id: str,
    payload:   CoursePatch,
    realm:     CurrentRealm,
) -> CourseOut:
    return await course_service.patch_course(course_id=course_id, payload=payload, realm=realm)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a course")
async def delete_course(course_id: str, realm: CurrentRealm) -> None:
    await course_service.delete_course(course_id=course_id, realm=realm)
