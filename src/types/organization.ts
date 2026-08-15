import type { PaginationMeta } from '@/types/api'

export type OrgEntityStatus = 'active' | 'inactive'

export interface Department {
  id: number
  name: string
  code?: string | null
  description?: string | null
  status: OrgEntityStatus
  job_titles_count?: number
  users_count?: number
}

export interface JobTitle {
  id: number
  department_id: number
  name: string
  code?: string | null
  description?: string | null
  status: OrgEntityStatus
  department?: Pick<Department, 'id' | 'name' | 'code' | 'status'> | null
  users_count?: number
}

export interface DepartmentWritePayload {
  name: string
  description?: string | null
}

export interface JobTitleWritePayload {
  name: string
  description?: string | null
  department_id: number
}

export interface OrgStatusPayload {
  status: OrgEntityStatus
}

export interface DepartmentListQuery {
  q?: string
  status?: OrgEntityStatus | ''
  page?: number
  per_page?: number
}

export interface JobTitleListQuery {
  q?: string
  status?: OrgEntityStatus | ''
  department_id?: number | null
  page?: number
  per_page?: number
}

export interface OrgListResult<T> {
  items: T[]
  meta: PaginationMeta
  message?: string
}
