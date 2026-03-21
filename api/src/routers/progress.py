from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from src.core.dependencies import SessionDep, OAuth2Scheme
from src.core.security import Roles, Resource, Scope
from src.services import progress as progress_service
from src.services.compliance.token_helpers import decode_token_verified

router = APIRouter(prefix="/users/{user_id}/progress", tags=["progress"])

class ProgressUpdate(BaseModel):
    section_id: str
    task_id: str

class SectionComplete(BaseModel):
    section_id: str
    total_sections: int

def verify_user_access(user_id: str, token: OAuth2Scheme):
    """Ensure the user is requesting their own progress or is an ORG_MANAGER."""
    decoded_token = decode_token_verified(token)
    token_user = decoded_token.get("sub")
    roles = decoded_token.get("realm_access", {}).get("roles", [])
    if token_user != user_id and not any(r.lower() == "org_manager" for r in roles):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's progress")

@router.get("")
def get_user_progress(user_id: str, session: SessionDep, token: OAuth2Scheme):
    verify_user_access(user_id, token)
    return progress_service.get_all_progress(user_id, session)

@router.get("/{course_id}")
def get_course_progress(user_id: str, course_id: str, session: SessionDep, token: OAuth2Scheme):
    verify_user_access(user_id, token)
    return progress_service.get_course_progress(user_id, course_id, session)

@router.put("/{course_id}")
def update_course_progress(
    user_id: str, 
    course_id: str, 
    payload: ProgressUpdate, 
    session: SessionDep, 
    token: OAuth2Scheme
):
    verify_user_access(user_id, token)
    return progress_service.update_progress(user_id, course_id, payload.section_id, payload.task_id, session)

@router.post("/{course_id}/section")
def complete_course_section(
    user_id: str, 
    course_id: str, 
    payload: SectionComplete, 
    session: SessionDep, 
    token: OAuth2Scheme
):
    verify_user_access(user_id, token)
    return progress_service.complete_section(user_id, course_id, payload.section_id, payload.total_sections, session)

@router.post("/{course_id}/expire", dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))])
def mark_course_expired(user_id: str, course_id: str, session: SessionDep, token: OAuth2Scheme):
    return progress_service.mark_expired(user_id, course_id, session)
