const API_URL = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────────────────────
   Types (aligned with backend schema)
───────────────────────────────────────────────────────── */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface ModuleChoice {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface ModuleQuestion {
  id: string;
  type: QuestionType;
  text: string;
  choices: ModuleChoice[];
  answer: string;
}

export interface CreateModulePayload {
  title: string;
  category: string;
  description: string;
  cover_image?: string;
  estimated_time: string;
  difficulty: Difficulty;
  body: string;
  questions: ModuleQuestion[];
}

export interface Module extends CreateModulePayload {
  id: number;
  created_at: string;
}

/* ─────────────────────────────────────────────────────────
   API functions
───────────────────────────────────────────────────────── */
function authHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchModules(token?: string): Promise<Module[]> {
  const res = await fetch(`${API_URL}/modules`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch modules');
  return res.json();
}

export async function fetchModule(id: number, token?: string): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch module ${id}`);
  return res.json();
}

export async function createModule(
  payload: CreateModulePayload,
  token?: string
): Promise<Module> {
  const res = await fetch(`${API_URL}/modules`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || 'Failed to create module');
  }
  return res.json();
}

export async function updateModule(
  id: number,
  payload: Partial<CreateModulePayload>,
  token?: string
): Promise<Module> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update module ${id}`);
  return res.json();
}

export async function deleteModule(id: number, token?: string): Promise<void> {
  const res = await fetch(`${API_URL}/modules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to delete module ${id}`);
}
