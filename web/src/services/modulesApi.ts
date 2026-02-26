const API_URL = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────────────────────
   Primitive types (mirror the backend enums / literals)
───────────────────────────────────────────────────────── */
export type Difficulty    = 'Easy' | 'Medium' | 'Hard';
export type QuestionType  = 'multiple_choice' | 'true_false' | 'short_answer';
export type RichMediaType = 'image' | 'video' | 'audio' | 'file';
export type ModuleStatus  = 'draft' | 'published' | 'archived';

/* ─────────────────────────────────────────────────────────
   Block types (stored as structured BSON — no JSON strings)
───────────────────────────────────────────────────────── */
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

export type ModuleBlock = ModuleTextBlock | ModuleRichContentBlock | ModuleQuestionBlock;

/* ─────────────────────────────────────────────────────────
   Section
───────────────────────────────────────────────────────── */
export interface ModuleSection {
  id:                      string;
  title:                   string;
  order:                   number;
  collapsed:               boolean;   // always false when sent — UI-only flag is stripped
  require_correct_answers: boolean;
  is_optional:             boolean;
  min_time_spent:          number;
  blocks:                  ModuleBlock[];
}

/* ─────────────────────────────────────────────────────────
   Module payloads
───────────────────────────────────────────────────────── */

/** Sent on POST /modules (create) */
export interface CreateModulePayload {
  title:          string;
  category:       string;
  description:    string;
  cover_image?:   string;
  estimated_time: string;
  difficulty:     Difficulty;
  sections:       ModuleSection[];
}

/** Sent on PATCH /modules/{id} — every field is optional */
export type PatchModulePayload = Partial<CreateModulePayload> & {
  status?: ModuleStatus;
};

/** What the backend returns */
export interface Module extends CreateModulePayload {
  id:          string;          // MongoDB ObjectId as string
  status:      ModuleStatus;
  version:     number;
  realm?:      string;
  created_by?: string;
  created_at:  string;
  updated_at:  string;
}

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function authHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ─────────────────────────────────────────────────────────
   API functions
───────────────────────────────────────────────────────── */

export async function fetchModules(token?: string): Promise<Module[]> {
  const res = await fetch(`${API_URL}/modules`, { headers: authHeaders(token) });
  return handleResponse<Module[]>(res);
}

export async function fetchModule(id: string, token?: string): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}`, { headers: authHeaders(token) });
  return handleResponse<Module>(res);
}

export async function createModule(
  payload: CreateModulePayload,
  token?: string,
): Promise<Module> {
  const res = await fetch(`${API_URL}/modules`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Module>(res);
}

/** Incremental save — used by the auto-save debounce hook */
export async function patchModule(
  id: string,
  payload: PatchModulePayload,
  token?: string,
): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Module>(res);
}

export async function publishModule(id: string, token?: string): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}/publish`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<Module>(res);
}

export async function deleteModule(id: string, token?: string): Promise<void> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to delete module ${id}`);
}
