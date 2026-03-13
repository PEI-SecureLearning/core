/**
 * modulesApi.ts
 *
 * Typed client for the Learning-Module REST API.
 *
 * All snake_case field names mirror the Python/MongoDB document shape
 * exactly so that the JSON can be sent and received without any
 * key-mapping on the frontend side.
 *
 * Endpoint map
 * ─────────────────────────────────────────────────────────────────────
 *  GET    /api/modules                    → PaginatedModules
 *  GET    /api/modules/:id                → Module
 *  POST   /api/modules                    → Module          (201)
 *  PUT    /api/modules/:id                → Module
 *  PATCH  /api/modules/:id                → Module
 *  POST   /api/modules/:id/publish        → Module
 *  POST   /api/modules/:id/archive        → Module
 *  DELETE /api/modules/:id                → void            (204)
 */

const API_URL = import.meta.env.VITE_API_URL as string;

// Primitive enums

export type ModuleStatus  = 'draft' | 'published' | 'archived';
export type Difficulty    = 'Easy' | 'Medium' | 'Hard';
export type QuestionType  = 'multiple_choice' | 'true_false' | 'short_answer';
export type RichMediaType = 'image' | 'video' | 'audio' | 'file';

// Choice + Question 

export interface ModuleChoice {
  id:         string;
  text:       string;
  is_correct: boolean;
}

export interface ModuleQuestion {
  id:      string;
  type:    QuestionType;
  text:    string;
  choices: ModuleChoice[];
  answer:  string;
}

// Block types 

export interface ModuleTextBlock {
  id:      string;
  kind:    'text';
  order:   number;
  content: string;
}

export interface ModuleRichContentBlock {
  id:         string;
  kind:       'rich_content';
  order:      number;
  media_type: RichMediaType;
  url:        string;
  caption:    string;
}

export interface ModuleQuestionBlock {
  id:       string;
  kind:     'question';
  order:    number;
  question: ModuleQuestion;
}

export type ModuleBlock =
  | ModuleTextBlock
  | ModuleRichContentBlock
  | ModuleQuestionBlock;

// Section

export interface ModuleSection {
  id:                      string;
  title:                   string;
  /** Position in the sections array; set from array index before every save. */
  order:                   number;
  /** UI-only hint; always sent as `false` to the API. */
  collapsed:               boolean;
  require_correct_answers: boolean;
  is_optional:             boolean;
  min_time_spent:          number;
  blocks:                  ModuleBlock[];
}

// Module payloads

/**
 * Body sent on POST /modules.
 * Every writable field is required (no id / status / timestamps).
 */
export interface CreateModulePayload {
  title:              string;
  category:           string;
  description:        string;
  cover_image?:       string | null;   // null = explicitly clear; undefined = omit from PATCH
  estimated_time:     string;
  difficulty:         Difficulty;
  has_refresh_module: boolean;
  sections:           ModuleSection[];
  refresh_sections:   ModuleSection[];
}

/**
 * Body sent on PUT /modules/:id — same shape as create.
 * Use this for an explicit "Save" action.
 */
export type UpdateModulePayload = CreateModulePayload;

/**
 * Body sent on PATCH /modules/:id — every field is optional.
 * Use this for the debounced auto-save; only send what changed.
 */
export type PatchModulePayload = Partial<CreateModulePayload> & {
  status?: ModuleStatus;
};

/**
 * Full module document returned by the API.
 */
export interface Module extends CreateModulePayload {
  id:          string;          // MongoDB ObjectId as hex string
  status:      ModuleStatus;
  version:     number;          // incremented on every write (optimistic concurrency)
  realm?:      string;
  created_by?: string;
  created_at:  string;          // ISO-8601 UTC
  updated_at:  string;          // ISO-8601 UTC
}

// ── Paginated list response ────────────────────────────────────────────────────

export interface PaginatedModules {
  items: Module[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function authHeaders(token?: string): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as unknown as T;
  if (res.ok) return res.json() as Promise<T>;
  const detail = await res.text().catch(() => '');
  throw new Error(detail || `HTTP ${res.status}`);
}

// ── API functions ──────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of modules.
 * Sections / blocks are NOT included in list results — fetch by id for full data.
 */
export async function fetchModules(options?: {
  status?:  ModuleStatus;
  search?:  string;
  sort?:    'title_asc' | 'title_desc' | 'newest' | 'oldest';
  page?:    number;
  limit?:   number;
  token?:   string;
}): Promise<PaginatedModules> {
  const { status, search, sort, page = 1, limit = 20, token } = options ?? {};
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  if (search)  params.set('search', search);
  if (sort)    params.set('sort', sort);

  const res = await fetch(`${API_URL}/modules?${params}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PaginatedModules>(res);
}

/**
 * Fetch the full module document (sections + blocks included).
 */
export async function fetchModule(id: string, token?: string): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse<Module>(res);
}

/**
 * Create a new draft module.
 * Returns the persisted document with its generated `id`.
 */
export async function createModule(
  payload: CreateModulePayload,
  token?:  string,
): Promise<Module> {
  const res = await fetch(`${API_URL}/modules`, {
    method:  'POST',
    headers: authHeaders(token),
    body:    JSON.stringify(payload),
  });
  return handleResponse<Module>(res);
}

/**
 * Full replacement save (PUT).
 * Replaces all editable fields and bumps the version counter.
 */
export async function updateModule(
  id:      string,
  payload: UpdateModulePayload,
  token?:  string,
): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    method:  'PUT',
    headers: authHeaders(token),
    body:    JSON.stringify(payload),
  });
  return handleResponse<Module>(res);
}

/**
 * Partial update (PATCH) — used by the auto-save debounce.
 * Only the fields present in `payload` are written; everything else stays.
 */
export async function patchModule(
  id:      string,
  payload: PatchModulePayload,
  token?:  string,
): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    method:  'PATCH',
    headers: authHeaders(token),
    body:    JSON.stringify(payload),
  });
  return handleResponse<Module>(res);
}

/**
 * Transition a module from draft → published.
 */
export async function publishModule(id: string, token?: string): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}/publish`, {
    method:  'POST',
    headers: authHeaders(token),
  });
  return handleResponse<Module>(res);
}

/**
 * Transition a module to archived status.
 */
export async function archiveModule(id: string, token?: string): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}/archive`, {
    method:  'POST',
    headers: authHeaders(token),
  });
  return handleResponse<Module>(res);
}

/**
 * Hard-delete a draft or archived module.
 * The API rejects attempts to delete published modules (returns 409).
 */
export async function deleteModule(id: string, token?: string): Promise<void> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    method:  'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse<void>(res);
}
