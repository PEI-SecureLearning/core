const API_BASE = import.meta.env.VITE_API_URL as string

// ─── Types ────────────────────────────────────────────────────────────────────

export type CourseDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface Course {
    id: string
    title: string
    description: string
    category: string
    difficulty: CourseDifficulty
    expected_time: string
    cover_image: string | null
    modules: string[]
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface CreateCoursePayload {
    title: string
    description: string
    category: string
    difficulty: CourseDifficulty
    expected_time: string
    cover_image: string | null
    modules: string[]
}

export type UpdateCoursePayload = CreateCoursePayload

export interface PatchCoursePayload {
    title?: string
    description?: string
    category?: string
    difficulty?: CourseDifficulty
    expected_time?: string
    cover_image?: string | null
    modules?: string[]
}

export interface PaginatedCourses {
    items: Course[]
    total: number
    page: number
    limit: number
    pages: number
}

export interface FetchCoursesOptions {
    token?: string
    search?: string
    category?: string
    difficulty?: string
    page?: number
    limit?: number
}

// ─── API functions ────────────────────────────────────────────────────────────

function authHeaders(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchCourses(opts: FetchCoursesOptions = {}): Promise<PaginatedCourses> {
    const params = new URLSearchParams()
    if (opts.search) params.set('search', opts.search)
    if (opts.category) params.set('category', opts.category)
    if (opts.difficulty) params.set('difficulty', opts.difficulty)
    if (opts.page) params.set('page', String(opts.page))
    if (opts.limit) params.set('limit', String(opts.limit))

    const qs = params.toString()
    const res = await fetch(`${API_BASE}/courses${qs ? `?${qs}` : ''}`, {
        headers: authHeaders(opts.token),
    })
    if (!res.ok) throw new Error('Failed to fetch courses')
    return res.json() as Promise<PaginatedCourses>
}

export async function fetchCourse(id: string, token?: string): Promise<Course> {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(id)}`, {
        headers: authHeaders(token),
    })
    if (!res.ok) throw new Error('Course not found')
    return res.json() as Promise<Course>
}

export async function fetchEnrolledCourses(userId: string, token?: string): Promise<Course[]> {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(userId)}/enrolled`, {
        headers: authHeaders(token),
    })
    if (!res.ok) throw new Error('Failed to fetch enrolled courses')
    return res.json() as Promise<Course[]>
}

export async function createCourse(payload: CreateCoursePayload, token?: string): Promise<Course> {
    const res = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Failed to create course')
    }
    return res.json() as Promise<Course>
}

export async function updateCourse(id: string, payload: UpdateCoursePayload, token?: string): Promise<Course> {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to update course')
    return res.json() as Promise<Course>
}

export async function deleteCourse(id: string, token?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    })
    if (!res.ok) throw new Error('Failed to delete course')
}
