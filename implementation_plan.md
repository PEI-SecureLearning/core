# User Course Progress Implementation Plan

Implement enrollment and progress tracking so org managers can assign courses to users and users can track their learning progress.

---

## Backend

### Database — New Table

#### [NEW] `user_progress` SQLModel table (`api/src/models/user_progress/table.py`)

```python
class UserProgress(SQLModel, table=True):
    __tablename__ = "user_progress"
    user_id: str = Field(primary_key=True)          # keycloak_id
    course_id: str = Field(primary_key=True)        # MongoDB course _id (str)
    progress_data: dict = Field(default={}, sa_column=Column(JSONB))
    completed_sections: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    total_completed_tasks: int = Field(default=0)
    is_certified: bool = Field(default=False)
    deadline: datetime | None = Field(default=None)
    expired: bool = Field(default=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```
- Export from [api/src/models/__init__.py](file:///home/gabriel/Documents/PEI/Core/api/src/models/__init__.py)

---

### Enrollment — Extend Org Manager User Routes ([api/src/routers/org_manager/user_routes.py](file:///home/gabriel/Documents/PEI/Core/api/src/routers/org_manager/user_routes.py))

Add 1 new endpoint using the existing OAuth2 pattern:

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/{realm}/users/{user_id}/enroll` | ORG_MANAGER | Assign one or more courses to a user — creates a `UserProgress` row per course |

**Request body:** `{ course_ids: list[str], deadline?: datetime }`  
**Default deadline:** 30 days from enrollment date.

#### [MODIFY] [user_routes.py](file:///home/gabriel/Documents/PEI/Core/api/src/routers/org_manager/user_routes.py)

---

### Progress Router — New File

#### [NEW] [progress.py](file:///home/gabriel/Documents/PEI/Core/api/src/routers/progress.py)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/users/{user_id}/progress` | ORG_MANAGER, DEFAULT_USER | All course progress for a user |
| `GET` | `/users/{user_id}/progress/{course_id}` | ORG_MANAGER, DEFAULT_USER | Single course progress |
| `PUT` | `/users/{user_id}/progress/{course_id}` | DEFAULT_USER | Update progress (add completed task or section); auto-certify when all sections done |
| `POST` | `/users/{user_id}/progress/{course_id}/expire` | ORG_MANAGER | Mark course as expired |

#### [NEW] [progress.py service](file:///home/gabriel/Documents/PEI/Core/api/src/services/progress.py)

Service functions called by the router:
- `get_all_progress(user_id, session)`
- `get_course_progress(user_id, course_id, session)`
- `update_progress(user_id, course_id, section_id, task_id, session)` — adds task to `progress_data[section_id]`, and if all tasks in that section are done adds section to `completed_sections`. Recalculates `total_completed_tasks`. If all sections complete, sets `is_certified=True`.
- `mark_expired(user_id, course_id, session)`

#### [MODIFY] [main.py](file:///home/gabriel/Documents/PEI/Core/api/src/main.py) — register `/progress` router

---

## Frontend

### Org Manager Sidebar — New Learning Section

#### [MODIFY] [navLinks.ts](file:///home/gabriel/Documents/PEI/Core/web/src/config/navLinks.ts)

Add to `userLinks` (gated to `ORG_MANAGER`, feature `lms`, group `"Learning"`):
```ts
{ href: '/courses/manage', label: 'Courses', icon: BookOpen }
{ href: '/courses/assign', label: 'Assign', icon: GraduationCap }
```

---

### New API Client

#### [NEW] [progressApi.ts](file:///home/gabriel/Documents/PEI/Core/web/src/services/progressApi.ts)

Typed functions for `enrollUser`, `unenrollUser`, `getUserProgress`, `getCourseProgress`, `updateProgress`.

---

### Courses List — Org Manager View

#### [NEW] `routes/courses/manage.tsx`

Renders the existing `<CourseList />` component (from content-manager) but with `showProgress={false}` and no Edit/Delete controls visible. 

---

### Course Assign Page — 3-Step Stepper

#### [NEW] `routes/courses/assign.tsx`

A new page with a 3-step stepper:

1. **Select Courses** — show the course grid; user picks one or more courses.
2. **Select Recipients** — pick individual users or a user group (fetch from `/{realm}/users`).
3. **Set Deadline** — date picker defaulting to +30 days. Submit calls `POST /{realm}/users/{user_id}/enroll` with all selected `course_ids` for each selected user.

---

### User Courses List — Live Data + Progress

#### [MODIFY] [routes/courses/index.tsx](file:///home/gabriel/Documents/PEI/Core/web/src/routes/courses/index.tsx)

- Fetch enrolled courses via `GET /users/{me}/progress` → extract `course_id` list → fetch each course from `GET /courses/{id}`.
- Show progress badge on each [CourseCard](file:///home/gabriel/Documents/PEI/Core/web/src/components/courses/CourseCard.tsx#310-318) using `progress` from `UserProgress.total_completed_tasks / (total tasks in course)`.
- Keep existing `UniversalFilters` for search/category/difficulty.

---

### User Course Detail — Real Backend + Progress

#### [MODIFY] [routes/courses/$courseId/index.tsx](file:///home/gabriel/Documents/PEI/Core/web/src/routes/courses/$courseId/index.tsx)

- Fetch course from `GET /courses/{courseId}`.
- Fetch full module objects.
- Fetch progress from `GET /users/{me}/progress/{courseId}`.
- Render [ModuleCard](file:///home/gabriel/Documents/PEI/Core/web/src/components/content-manager/courses/CourseModuleCard.tsx#18-86) for each module, with a completion percentage derived from `progress_data`.
- **Completed modules go to the bottom** and are rendered grey/dimmed.

---

### User Module Learner — Progress Saving

#### [MODIFY] [routes/courses/$courseId/modules/$moduleId.tsx](file:///home/gabriel/Documents/PEI/Core/web/src/routes/courses/$courseId/modules/$moduleId.tsx)

- Fetch module from `GET /modules/{moduleId}`.
- Fetch user progress from `GET /users/{me}/progress/{courseId}`.
- After each task completion, call `PUT /users/{me}/progress/{courseId}` with `{ section_id, task_id }`.
- Mark the task as visually completed immediately (optimistic update).
