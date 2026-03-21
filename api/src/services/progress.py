from sqlmodel import Session, select
from fastapi import HTTPException
from src.models import UserProgress

def get_all_progress(user_id: str, session: Session) -> list[UserProgress]:
    stmt = select(UserProgress).where(UserProgress.user_id == user_id)
    return list(session.exec(stmt).all())

def get_course_progress(user_id: str, course_id: str, session: Session) -> UserProgress:
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")
    return progress

def update_progress(user_id: str, course_id: str, section_id: str, task_id: str, session: Session) -> UserProgress:
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")
        
    p_data = progress.progress_data or {}
    
    if section_id not in p_data:
        p_data[section_id] = []
        
    if task_id not in p_data[section_id]:
        p_data[section_id].append(task_id)
        progress.progress_data = dict(p_data)
        
        progress.total_completed_tasks = sum(len(tasks) for tasks in progress.progress_data.values())
        session.add(progress)
        session.commit()
        session.refresh(progress)

    return progress

def complete_section(user_id: str, course_id: str, section_id: str, total_sections: int, session: Session) -> UserProgress:
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")
        
    sections = progress.completed_sections or []
    if section_id not in sections:
        sections.append(section_id)
        progress.completed_sections = list(sections)
        
        if len(progress.completed_sections) >= total_sections and total_sections > 0:
            progress.is_certified = True
            
        session.add(progress)
        session.commit()
        session.refresh(progress)
        
    return progress

def mark_expired(user_id: str, course_id: str, session: Session) -> UserProgress:
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")
        
    progress.expired = True
    session.add(progress)
    session.commit()
    session.refresh(progress)
    return progress
