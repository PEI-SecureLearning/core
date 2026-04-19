from sqlmodel import Session, select
from fastapi import HTTPException
from sqlalchemy import or_
from datetime import datetime, timedelta
from src.models import UserProgress, AssignmentStatus, CertificateDTO
import asyncio
from src.services.courses import get_course
from src.services.modules import get_module


# TODO CHECK THIS
def assign_course(
    course_id: str,
    user_ids: list[str],
    start_date: datetime,
    deadline: datetime,
    cert_valid_days: float,
    session: Session,
    realm_name: str = None,
) -> list[UserProgress]:
    print(
        f"DEBUG: assign_course course={course_id}, users={len(user_ids)}, realm={realm_name}"
    )
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
                # Clear progress arrays to give a clean slate, particularly if EXPIRED or RENEWAL_REQUIRED
                existing.status = AssignmentStatus.SCHEDULED
                existing.start_date = start_date
                existing.deadline = deadline
                existing.cert_valid_days = cert_valid_days
                existing.overdue = False
                existing.expired = False
                existing.realm_name = realm_name
                if existing.status != AssignmentStatus.COMPLETED:
                    existing.progress_data = {}
                    existing.completed_sections = []
                session.add(existing)
                assigned.append(existing)
            continue

        progress = UserProgress(
            user_id=uid,
            course_id=course_id,
            start_date=start_date,
            deadline=deadline,
            cert_valid_days=cert_valid_days,
            status=AssignmentStatus.SCHEDULED,
            realm_name=realm_name,
            overdue=False,
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


def update_progress(
    user_id: str, course_id: str, section_id: str, task_id: str, session: Session
) -> UserProgress:
    print(
        f"DEBUG: update_progress user={user_id}, course={course_id}, section={section_id}, task={task_id}"
    )
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

        progress.total_completed_tasks = sum(
            len(tasks) for tasks in progress.progress_data.values()
        )
        session.add(progress)
        from sqlalchemy.orm.attributes import flag_modified

        flag_modified(progress, "progress_data")
        session.commit()
        session.refresh(progress)
        print(
            f"DEBUG: Update SUCCESS. New total tasks: {progress.total_completed_tasks}"
        )

    return progress


async def complete_section(
    user_id: str, course_id: str, section_id: str, session: Session
) -> UserProgress:
    print(
        f"DEBUG: complete_section user={user_id}, course={course_id}, section={section_id}"
    )
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

        # Calculate real total sections across all modules for this course
        try:
            course = await get_course(course_id)
            modules = await asyncio.gather(
                *[get_module(m_id) for m_id in course.modules]
            )
            total_sections = sum(len(m.sections) for m in modules)
        except Exception as e:
            print(f"DEBUG: Failed to fetch course modules to verify completion: {e}")
            total_sections = 1000  # fallback to prevent auto-cert if DB fails

        if len(progress.completed_sections) >= total_sections and total_sections > 0:
            progress.is_certified = True
            progress.expired = False
            progress.status = AssignmentStatus.COMPLETED
            progress.cert_expires_at = datetime.utcnow() + timedelta(
                days=progress.cert_valid_days
            )
            print("DEBUG: Certification EARNED")

        session.add(progress)
        from sqlalchemy.orm.attributes import flag_modified

        flag_modified(progress, "completed_sections")
        session.commit()
        session.refresh(progress)
        print(
            f"DEBUG: Section completion SUCCESS. Total completed: {len(progress.completed_sections)}"
        )

    return progress


async def complete_refreshment(
    user_id: str, course_id: str, session: Session
) -> UserProgress:
    print(f"DEBUG: complete_refreshment user={user_id}, course={course_id}")
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")

    if progress.status != AssignmentStatus.RENEWAL_REQUIRED:
        raise HTTPException(status_code=400, detail="Course is not in renewal state")

    # Validation
    try:
        course = await get_course(course_id)
        modules = await asyncio.gather(*[get_module(m_id) for m_id in course.modules])
        total_refresh_sections = sum(len(m.refresh_sections) for m in modules)
    except Exception as e:
        print(f"DEBUG: Failed to fetch course refresh modules: {e}")
        total_refresh_sections = 1000  # hard block if error

    if (
        len(progress.completed_sections) < total_refresh_sections
        and total_refresh_sections > 0
    ):
        raise HTTPException(
            status_code=400, detail="Not all refreshment sections completed"
        )

    progress.is_certified = True
    progress.expired = False
    progress.status = AssignmentStatus.COMPLETED
    progress.cert_expires_at = datetime.utcnow() + timedelta(
        days=progress.cert_valid_days
    )

    session.add(progress)
    session.commit()
    session.refresh(progress)
    print("DEBUG: Refreshment completely verified and certified")
    return progress


def mark_overdue(user_id: str, course_id: str, session: Session) -> UserProgress:
    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")

    if progress.status != AssignmentStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail="Only ACTIVE assignments can be manually marked as overdue",
        )

    progress.overdue = True
    progress.status = AssignmentStatus.OVERDUE
    session.add(progress)
    session.commit()
    session.refresh(progress)
    return progress


async def list_certificates(
    user_id: str,
    session: Session,
    realm_name: str | None = None,
    include_expired: bool = False,
) -> list[CertificateDTO]:

    query = select(UserProgress).where(
        UserProgress.user_id == user_id, UserProgress.is_certified
    )
    if realm_name:
        query = query.where(
            or_(
                UserProgress.realm_name == realm_name,
                UserProgress.realm_name.is_(None),
            )
        )

    certified_progresses = session.exec(query).all()

    certificates = []
    for progress in certified_progresses:
        # Skip expired certificates unless explicitly requested
        if progress.expired and not include_expired:
            continue

        try:
            course = await get_course(progress.course_id)
        except HTTPException:
            # Course was deleted; skip this certificate
            continue

        # Format dates as ISO strings
        emission_date = progress.updated_at.isoformat() if progress.updated_at else ""
        expiration_date = (
            progress.cert_expires_at.isoformat() if progress.cert_expires_at else ""
        )

        cert_dto = CertificateDTO(
            user_id=progress.user_id,
            course_id=progress.course_id,
            last_emission_date=emission_date,
            expiration_date=expiration_date,
            expired=progress.expired,
            course_name=course.title,
            course_cover_image_link=course.cover_image,
            difficulty=course.difficulty,
            category=course.category,
            realm=progress.realm_name or "",
        )
        certificates.append(cert_dto)

    return certificates
