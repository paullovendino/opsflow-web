import http from '@/services/http'
import type { ApiEnvelope } from '@/types/api'
import type { AuthUser, LoginCredentials, LoginData } from '@/types/auth'

function normalizeUser(payload: AuthUser): AuthUser {
  return {
    id: payload.id,
    first_name: payload.first_name,
    middle_name: payload.middle_name ?? null,
    last_name: payload.last_name ?? null,
    full_name: payload.full_name,
    email: payload.email,
    avatar: payload.avatar ?? null,
    status: payload.status,
    last_login_at: payload.last_login_at ?? null,
    theme_preference: payload.theme_preference ?? 'system',
    notify_task_assigned: payload.notify_task_assigned ?? true,
    notify_task_status: payload.notify_task_status ?? true,
    notify_remarks: payload.notify_remarks ?? true,
    notify_mentions: payload.notify_mentions ?? true,
    role: payload.role ?? null,
    department: payload.department ?? null,
    job_title: payload.job_title ?? null,
  }
}

export async function fetchCsrfCookie(): Promise<void> {
  await http.get('/sanctum/csrf-cookie')
}

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  await fetchCsrfCookie()

  const { data } = await http.post<ApiEnvelope<LoginData>>('/api/v1/auth/login', credentials)
  const user = data.data?.user

  if (!user) {
    throw new Error(data.message || 'Login succeeded without a user payload.')
  }

  return normalizeUser(user)
}

export async function logout(): Promise<void> {
  await fetchCsrfCookie()
  await http.post<ApiEnvelope<null>>('/api/v1/auth/logout')
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await http.get<ApiEnvelope<AuthUser>>('/api/v1/auth/me')

  if (!data.data) {
    throw new Error(data.message || 'Authenticated user payload missing.')
  }

  return normalizeUser(data.data)
}
