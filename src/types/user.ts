import type { AuthLookup, AuthRole, UserStatus } from '@/types/auth'
import type { PaginationMeta } from '@/types/api'

export type { UserStatus }

export interface User {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string | null
  full_name: string
  email: string
  avatar: string | null
  status: UserStatus | string
  last_login_at: string | null
  role?: AuthRole | null
  department?: AuthLookup | null
  job_title?: AuthLookup | null
}

export type UserSortField =
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'created_at'
  | 'last_login_at'
  | 'status'

export interface UserListQuery {
  search?: string
  role_id?: number | null
  department_id?: number | null
  job_title_id?: number | null
  status?: UserStatus | ''
  sort?: UserSortField
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface UserListResult {
  users: User[]
  meta: PaginationMeta
  message: string
}

export interface UserWritePayload {
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  password?: string | null
  role_id: number
  department_id: number | null
  job_title_id: number | null
  status: UserStatus
}

export interface UserStatusPayload {
  status: UserStatus
}
