# Module MongoDB Schema & API Design

## Document Shape (MongoDB)

```json
{
  "_id": "ObjectId",
  "title": "Introduction to SQL Injection",
  "category": "Security",
  "description": "Learn how SQL injection works and how to prevent it.",
  "cover_image": "https://...",
  "estimated_time": "45",
  "difficulty": "Intermediate",
  "status": "draft",
  "created_at": "2026-02-26T00:00:00Z",
  "updated_at": "2026-02-26T00:00:00Z",
  "realm": "my-org",
  "created_by": "user-keycloak-sub",
  "version": 1,
  "sections": [
    {
      "id": "abc123",
      "title": "What is SQL Injection?",
      "order": 0,
      "collapsed": false,
      "require_correct_answers": true,
      "is_optional": false,
      "min_time_spent": 30,
      "blocks": [
        {
          "id": "blk001",
          "kind": "text",
          "order": 0,
          "content": "# SQL Injection\n\nSQL injection is..."
        },
        {
          "id": "blk002",
          "kind": "rich_content",
          "order": 1,
          "media_type": "image",
          "url": "https://example.com/diagram.png",
          "caption": "Attack vector diagram"
        },
        {
          "id": "blk003",
          "kind": "question",
          "order": 2,
          "question": {
            "id": "q001",
            "type": "multiple_choice",
            "text": "Which of the following prevents SQL injection?",
            "choices": [
              { "id": "c1", "text": "String concatenation", "is_correct": false },
              { "id": "c2", "text": "Parameterised queries", "is_correct": true },
              { "id": "c3", "text": "MD5 hashing", "is_correct": false }
            ],
            "answer": ""
          }
        }
      ]
    }
  ]
}
```

## Why This Shape

- **No string-serialised body**: Sections and blocks are first-class BSON arrays.
  MongoDB can index, query, and project nested fields directly.
- **Questions are NOT duplicated**: They live inside their block, not as a separate
  array. The backend can aggregate them with a `$unwind` pipeline if needed.
- **`order` field on sections and blocks**: Keeps ordering durable and DB-queryable
  without relying on array index position.
- **`status`**: `draft | published | archived` — drives access control.
- **`version`**: Integer counter for optimistic concurrency (prevents lost updates).
- **`realm` + `created_by`**: Multi-tenancy from the existing Keycloak setup.

---

## API Endpoints

### Create Module
```
POST /modules
Body: ModuleCreate
Returns: Module (with _id)
```

### Get Module
```
GET /modules/{id}
Returns: Module
```

### List Modules
```
GET /modules?realm=...&status=draft&page=1&limit=20
Returns: PaginatedModules
```

### Full Update (save / publish)
```
PUT /modules/{id}
Body: ModuleUpdate (full body)
Returns: Module
```

### Patch Module (real-time incremental)
```
PATCH /modules/{id}
Body: ModulePatch (partial — only changed fields)
Returns: Module
```

This is the endpoint the auto-save debounce will hit.

### Publish / Archive
```
POST /modules/{id}/publish
POST /modules/{id}/archive
```

### Delete
```
DELETE /modules/{id}
```

---

## Python / FastAPI Models

```python
# api/src/models/module.py

from datetime import datetime
from enum import StrEnum
from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, Field


class ModuleStatus(StrEnum):
    DRAFT     = "draft"
    PUBLISHED = "published"
    ARCHIVED  = "archived"


class Difficulty(StrEnum):
    BEGINNER     = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED     = "Advanced"


# ── Block types ────────────────────────────────────────────

class Choice(BaseModel):
    id:         str
    text:       str
    is_correct: bool

class QuestionModel(BaseModel):
    id:      str
    type:    Literal["multiple_choice", "true_false", "short_answer"]
    text:    str
    choices: list[Choice] = []
    answer:  str = ""

class TextBlock(BaseModel):
    id:      str
    kind:    Literal["text"]
    order:   int
    content: str

class RichContentBlock(BaseModel):
    id:         str
    kind:       Literal["rich_content"]
    order:      int
    media_type: Literal["image", "video", "audio", "file"]
    url:        str
    caption:    str = ""

class QuestionBlock(BaseModel):
    id:       str
    kind:     Literal["question"]
    order:    int
    question: QuestionModel

Block = Annotated[
    Union[TextBlock, RichContentBlock, QuestionBlock],
    Field(discriminator="kind")
]


# ── Section ────────────────────────────────────────────────

class Section(BaseModel):
    id:                      str
    title:                   str
    order:                   int
    collapsed:               bool  = False
    require_correct_answers: bool  = False
    is_optional:             bool  = False
    min_time_spent:          int   = 0
    blocks:                  list[Block] = []


# ── Module ─────────────────────────────────────────────────

class ModuleCreate(BaseModel):
    title:          str
    category:       str
    description:    str
    cover_image:    Optional[str] = None
    estimated_time: str
    difficulty:     Difficulty
    sections:       list[Section] = []

class ModuleUpdate(ModuleCreate):
    """Full replacement update."""
    pass

class ModulePatch(BaseModel):
    """Partial update — all fields optional."""
    title:          Optional[str]           = None
    category:       Optional[str]           = None
    description:    Optional[str]           = None
    cover_image:    Optional[str]           = None
    estimated_time: Optional[str]           = None
    difficulty:     Optional[Difficulty]    = None
    sections:       Optional[list[Section]] = None
    status:         Optional[ModuleStatus]  = None

class Module(ModuleCreate):
    id:         str
    status:     ModuleStatus = ModuleStatus.DRAFT
    version:    int          = 1
    realm:      Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
```

---

## Frontend TypeScript Changes

### Updated types.ts

```typescript
// Add `order` to section and blocks (set from array index on save)
export interface Section {
    id:                     string
    title:                  string
    order:                  number      // NEW — mirrors DB order field
    collapsed:              boolean
    blocks:                 Block[]
    requireCorrectAnswers?: boolean
    isOptional?:            boolean
    minTimeSpent?:          number
}

// Blocks get order too
export interface TextBlock        { id: string; kind: 'text';         order: number; content: string }
export interface RichContentBlock { id: string; kind: 'rich_content'; order: number; ... }
export interface QuestionBlock    { id: string; kind: 'question';     order: number; question: Question }
```

### Updated modulesApi.ts (drop the old CreateModulePayload)

```typescript
export interface ModuleSection {
    id:                      string
    title:                   string
    order:                   number
    collapsed:               boolean
    require_correct_answers: boolean
    is_optional:             boolean
    min_time_spent:          number
    blocks:                  ModuleBlock[]
}

export interface CreateModulePayload {
    title:          string
    category:       string
    description:    string
    cover_image?:   string
    estimated_time: string
    difficulty:     Difficulty
    sections:       ModuleSection[]   // structured, not a JSON string
}

export interface Module extends CreateModulePayload {
    id:         string              // MongoDB ObjectId as string
    status:     'draft' | 'published' | 'archived'
    version:    number
    realm?:     string
    created_by?: string
    created_at: string
    updated_at: string
}

// New: patch endpoint — all optional
export type PatchModulePayload = Partial<CreateModulePayload> & {
    status?: 'draft' | 'published' | 'archived'
}

export async function patchModule(
    id: string,
    payload: PatchModulePayload,
    token?: string
): Promise<Module> { ... }
```

---

## Real-time / Auto-save Strategy

### Recommended: Debounced PATCH (simple, reliable)

```
User edits → onChange fires → debounce(1500ms) → PATCH /modules/{id}
```

This is the same approach used by Notion, Linear, and Google Docs for non-collaborative
documents. It requires:

1. A `moduleId: string | null` state in `ModuleCreationForm`
2. On first meaningful edit: **POST** → creates the draft, stores the returned `id`
3. On all subsequent edits: **PATCH** with only changed fields and debounce delay
4. On unmount / navigate away: flush the pending debounce immediately

### Save Status Indicator

Show a pill in the header:
- `●  Saving...`    (debounce pending or request in-flight)
- `✓  Saved`        (last PATCH succeeded)
- `⚠  Unsaved`      (error, or offline)

### Future: WebSocket Collaboration

For true multi-user real-time editing (e.g., multiple editors on same module):
- Backend: FastAPI WebSocket endpoint `/modules/{id}/ws`
- Frontend: `useWebSocket` hook that sends delta operations
- Conflict resolution: operational transforms or CRDT (Yjs is the standard library)

This is a significant scope increase. Start with debounced PATCH and add WS later.

---

## Implementation Checklist (Ordered)

### Backend (FastAPI + Motor/MongoDB)

- [ ] `api/src/models/module.py` — Pydantic models as above
- [ ] `api/src/core/mongo.py` — add `get_modules_collection()`  
      Add `MONGODB_COLLECTION_MODULES = "modules"` to Settings
- [ ] `api/src/routers/modules.py` — CRUD + PATCH endpoints
- [ ] Register router in `api/src/main.py`

### Frontend

- [ ] `types.ts` — add `order` to sections/blocks, no other breaking changes needed
- [ ] `modulesApi.ts` — update `CreateModulePayload`, add `patchModule()`, update `Module.id` to `string`
- [ ] `constants.ts` — `uid()` replace with `crypto.randomUUID()` for RFC-compliant IDs
- [ ] `index.tsx` — `buildPayload()` strips UI-only fields (collapsed), maps snake_case, adds `order`
- [ ] `index.tsx` — add auto-save hook with debounce + save status indicator
- [ ] (Optional) Extract `useAutoSave` custom hook

---

## buildPayload() — Correct Mapping

```typescript
const buildPayload = (): CreateModulePayload => ({
    title:          data.title,
    category:       data.category,
    description:    data.description,
    cover_image:    data.coverImage || undefined,
    estimated_time: data.estimatedTime,
    difficulty:     data.difficulty,
    sections: data.sections.map((s, si) => ({
        id:                      s.id,
        title:                   s.title,
        order:                   si,            // derive from current array position
        collapsed:               false,          // strip UI state — DB doesn't need this
        require_correct_answers: s.requireCorrectAnswers ?? false,
        is_optional:             s.isOptional ?? false,
        min_time_spent:          s.minTimeSpent ?? 0,
        blocks: s.blocks.map((b, bi) => ({
            ...b,
            order: bi,
            // snake_case for backend
            ...(b.kind === 'rich_content' ? { media_type: b.mediaType } : {}),
            ...(b.kind === 'question' ? {
                question: {
                    ...b.question,
                    choices: b.question.choices.map(c => ({
                        ...c,
                        is_correct: c.isCorrect,
                    })),
                },
            } : {}),
        })),
    })),
})
```
