import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type {
  User,
  UserListQuery,
  UserListResult,
  UserStatusPayload,
  UserWritePayload,
} from '@/types/user'

function cleanParams(params: UserListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

  if (params.search?.trim()) {
    out.search = params.search.trim()
  }
  if (params.role_id != null) {
    out.role_id = params.role_id
  }
  if (params.department_id != null) {
    out.department_id = params.department_id
  }
  if (params.job_title_id != null) {
    out.job_title_id = params.job_title_id
  }
  if (params.status) {
    out.status = params.status
  }
  if (params.sort) {
    out.sort = params.sort
  }
  if (params.direction) {
    out.direction = params.direction
  }
  if (params.page != null) {
    out.page = params.page
  }
  if (params.per_page != null) {
    out.per_page = params.per_page
  }

  return out
}

function asPaginationMeta(meta: Record<string, unknown> | null): PaginationMeta {
  return {
    current_page: Number(meta?.current_page ?? 1),
    last_page: Number(meta?.last_page ?? 1),
    per_page: Number(meta?.per_page ?? 15),
    total: Number(meta?.total ?? 0),
    from: (meta?.from as number | null | undefined) ?? null,
    to: (meta?.to as number | null | undefined) ?? null,
  }
}

export async function listUsers(params: UserListQuery = {}): Promise<UserListResult> {
  const { data } = await http.get<ApiEnvelope<User[]>>('/api/v1/users', {
    params: cleanParams(params),
  })

  return {
    users: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getUser(id: number): Promise<User> {
  const { data } = await http.get<ApiEnvelope<User>>(`/api/v1/users/${id}`)

  if (!data.data) {
    throw new Error(data.message || 'User payload missing.')
  }

  return data.data
}

export async function createUser(payload: UserWritePayload): Promise<User> {
  const { data } = await http.post<ApiEnvelope<User>>('/api/v1/users', payload)

  if (!data.data) {
    throw new Error(data.message || 'User create payload missing.')
  }

  return data.data
}

export async function updateUser(id: number, payload: UserWritePayload): Promise<User> {
  const body: Record<string, unknown> = {
    first_name: payload.first_name,
    middle_name: payload.middle_name,
    last_name: payload.last_name,
    email: payload.email,
    role_id: payload.role_id,
    department_id: payload.department_id,
    job_title_id: payload.job_title_id,
    status: payload.status,
    avatar: payload.avatar ?? null,
  }

  if (payload.password) {
    body.password = payload.password
  }

  const { data } = await http.put<ApiEnvelope<User>>(`/api/v1/users/${id}`, body)

  if (!data.data) {
    throw new Error(data.message || 'User update payload missing.')
  }

  return data.data
}

export async function updateUserStatus(id: number, payload: UserStatusPayload): Promise<User> {
  const { data } = await http.patch<ApiEnvelope<User>>(`/api/v1/users/${id}/status`, payload)

  if (!data.data) {
    throw new Error(data.message || 'User status payload missing.')
  }

  return data.data
}

export async function deleteUser(id: number): Promise<void> {
  await http.delete<ApiEnvelope<null>>(`/api/v1/users/${id}`)
}
