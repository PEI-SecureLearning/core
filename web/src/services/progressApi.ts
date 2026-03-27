const API_BASE = import.meta.env.VITE_API_URL as string

function authHeaders(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface UserProgress {
    user_id: string;
    course_id: string;
    progress_data: Record<string, string[]>;
    completed_sections: string[];
    total_completed_tasks: number;
    is_certified: boolean;
    status: string;
    deadline: string | null;
    start_date: string | null;
    cert_valid_days: number;
    cert_expires_at: string | null;
    overdue: boolean;
    expired: boolean;
    updated_at: string;
}

export async function enrollUser(realm: string, userId: string, courseIds: string[], token: string, deadline?: string, startDate?: string, certValidDays: number = 365): Promise<{ status: string; enrolled: number }> {
    const res = await fetch(`${API_BASE}/org-manager/${realm}/users/${userId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ course_ids: courseIds, deadline, start_date: startDate, cert_valid_days: certValidDays }),
    })
    if (!res.ok) throw new Error('Failed to enroll user')
    return res.json()
}

export async function getUserProgress(userId: string, token: string, excludeScheduled?: boolean): Promise<UserProgress[]> {
    const params = new URLSearchParams()
    if (excludeScheduled) params.set('exclude_scheduled', 'true')
    const qs = params.toString()

    const res = await fetch(`${API_BASE}/users/${userId}/progress${qs ? `?${qs}` : ''}`, {
        headers: authHeaders(token),
    })
    if (!res.ok) throw new Error('Failed to fetch user progress')
    return res.json()
}

export async function getCourseProgress(userId: string, courseId: string, token: string): Promise<UserProgress> {
    const res = await fetch(`${API_BASE}/users/${userId}/progress/${courseId}`, {
        headers: authHeaders(token),
    })
    if (!res.ok) throw new Error('Failed to fetch course progress')
    return res.json()
}

export async function updateProgress(userId: string, courseId: string, sectionId: string, taskId: string, token: string): Promise<UserProgress> {
    const res = await fetch(`${API_BASE}/users/${userId}/progress/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ section_id: sectionId, task_id: taskId }),
    })
    if (!res.ok) throw new Error('Failed to update progress')
    return res.json()
}

export async function completeSection(userId: string, courseId: string, sectionId: string, totalSections: number, token: string): Promise<UserProgress> {
    const res = await fetch(`${API_BASE}/users/${userId}/progress/${courseId}/section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ section_id: sectionId, total_sections: totalSections }),
    })
    if (!res.ok) throw new Error('Failed to complete section')
    return res.json()
}

export async function completeRefreshment(userId: string, courseId: string, token: string): Promise<UserProgress> {
    const res = await fetch(`${API_BASE}/users/${userId}/progress/${courseId}/renewal`, {
        method: 'POST',
        headers: authHeaders(token),
    })
    if (!res.ok) throw new Error('Failed to complete renewal')
    return res.json()
}

export async function markOverdue(userId: string, courseId: string, token: string): Promise<UserProgress> {
    const res = await fetch(`${API_BASE}/users/${userId}/progress/${courseId}/overdue`, {
        method: 'POST',
        headers: authHeaders(token),
    })
    if (!res.ok) throw new Error('Failed to mark course as overdue')
    return res.json()
}
