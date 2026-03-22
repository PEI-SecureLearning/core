from sqlmodel import Session, select
from fastapi import HTTPException
from datetime import datetime
from src.models import UserProgress, AssignmentStatus

def assign_course(course_id: str, user_ids: list[str], start_date: datetime, deadline: datetime, session: Session) -> list[UserProgress]:
    print(f"DEBUG: assign_course course={course_id}, users={len(user_ids)}")
    assigned = []
    
    for uid in user_ids:
        # Guard against duplicate assignment
        existing = session.get(UserProgress, {"user_id": uid, "course_id": course_id})
        if existing:
            # If it already exists, update the dates and status to scheduled 
            # (unless it's COMPLETED, we shouldn't touch completed courses but we'll 
            # assume the admin's intention is to re-assign or extend).
            if existing.status != AssignmentStatus.COMPLETED or existing.is_certified:
                 # It's better to update it to scheduled if they are actively trying to restart
                 existing.status = AssignmentStatus.SCHEDULED
                 existing.start_date = start_date
                 existing.deadline = deadline
                 existing.expired = False
                 session.add(existing)
                 assigned.append(existing)
            continue
            
        progress = UserProgress(
            user_id=uid,
            course_id=course_id,
            start_date=start_date,
            deadline=deadline,
            status=AssignmentStatus.SCHEDULED,
            expired=False,
            progress_data={},
            completed_sections=[],
        )
        session.add(progress)
        assigned.append(progress)
        
    session.commit()
    for p in assigned:
        session.refresh(p)
    return assigned

def get_all_progress(user_id: str, session: Session) -> list[UserProgress]:
    stmt = select(UserProgress).where(UserProgress.user_id == user_id)
    return list(session.exec(stmt).all())

def get_course_progress(user_id: str, course_id: str, session: Session) -> UserProgress:
    print(f"DEBUG: Fetching progress for user={user_id}, course={course_id}")
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        print(f"DEBUG: Progress NOT FOUND for user={user_id}, course={course_id}")
        raise HTTPException(status_code=404, detail="Course progress not found")
    return progress

def update_progress(user_id: str, course_id: str, section_id: str, task_id: str, session: Session) -> UserProgress:
    print(f"DEBUG: update_progress user={user_id}, course={course_id}, section={section_id}, task={task_id}")
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        print(f"DEBUG: Progress NOT FOUND during update")
        raise HTTPException(status_code=404, detail="Course progress not found")
        
    p_data = progress.progress_data or {}
    print(f"DEBUG: Current progress_data: {p_data}")
    
    if section_id not in p_data:
        p_data[section_id] = []
        
    if task_id not in p_data[section_id]:
        p_data[section_id].append(task_id)
        progress.progress_data = dict(p_data)
        
        progress.total_completed_tasks = sum(len(tasks) for tasks in progress.progress_data.values())
        session.add(progress)
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(progress, "progress_data")
        session.commit()
        session.refresh(progress)
        print(f"DEBUG: Update SUCCESS. New total tasks: {progress.total_completed_tasks}")

    return progress

def complete_section(user_id: str, course_id: str, section_id: str, total_sections: int, session: Session) -> UserProgress:
    print(f"DEBUG: complete_section user={user_id}, course={course_id}, section={section_id}")
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        print(f"DEBUG: Progress NOT FOUND during section completion")
        raise HTTPException(status_code=404, detail="Course progress not found")
        
    sections = progress.completed_sections or []
    print(f"DEBUG: Current completed_sections: {sections}")
    if section_id not in sections:
        sections.append(section_id)
        # Note: We must re-assign to trigger SQLAlchemy change tracking for list types
        progress.completed_sections = list(sections)
        
        if len(progress.completed_sections) >= total_sections and total_sections > 0:
            progress.is_certified = True
            print("DEBUG: Certification EARNED")
            
        session.add(progress)
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(progress, "completed_sections")
        session.commit()
        session.refresh(progress)
        print(f"DEBUG: Section completion SUCCESS. Total completed: {len(progress.completed_sections)}")
        
    return progress

def mark_expired(user_id: str, course_id: str, session: Session) -> UserProgress:
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")
        
    if progress.status != AssignmentStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Only ACTIVE assignments can be manually expired")
        
    progress.expired = True
    progress.status = AssignmentStatus.EXPIRED
    session.add(progress)
    session.commit()
    session.refresh(progress)
    return progress
